"""Train Element's compact nose model; rerun from cached CSVs with --offline.

Dependencies: python -m pip install --user numpy pandas scikit-learn
"""

import argparse
import hashlib
import json
from pathlib import Path
import platform
from urllib.request import urlopen

import numpy as np
import pandas as pd
import sklearn
from sklearn.cluster import KMeans
from sklearn.linear_model import Ridge
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler


ROOT = Path(__file__).resolve().parents[1]
FILES = ("behavior.csv", "molecules.csv", "stimuli.csv", "subjects.csv")
FAMILIES = ("citrus", "green", "water", "floral", "woody", "amber")
DESCRIPTORS = (
    "acid", "ammonia/urinous", "bakery", "burnt", "cold", "chemical",
    "decayed", "edible", "fish", "flower", "fruit", "garlic", "grass",
    "musky", "sour", "spices", "sweaty", "sweet", "warm", "wood",
)
FAMILY_DESCRIPTORS = {
    "citrus": ("fruit", "sour"),
    "green": ("grass",),
    "water": ("cold",),
    "floral": ("flower",),
    "woody": ("wood",),
    "amber": ("warm", "sweet", "spices", "musky"),
}
NAMES = {
    "Fresh-leaning": {"en": "Fresh-leaning", "zh-Hant": "清新傾向", "zh-Hans": "清新倾向"},
    "Warm-leaning": {"en": "Warm-leaning", "zh-Hant": "暖香傾向", "zh-Hans": "暖香倾向"},
    "Floral-leaning": {"en": "Floral-leaning", "zh-Hant": "花香傾向", "zh-Hans": "花香倾向"},
    "Balanced": {"en": "Balanced", "zh-Hant": "均衡型", "zh-Hans": "均衡型"},
}


def load_csvs(data_dir, offline, refresh, source_ref):
    data_dir.mkdir(parents=True, exist_ok=True)
    tables, headers, hashes = {}, {}, {}
    provenance = data_dir / "sources.json"
    sources = json.loads(provenance.read_text(encoding="utf-8")) if provenance.exists() else {}
    for filename in FILES:
        path = data_dir / filename
        if refresh or not path.exists():
            if offline:
                raise ValueError(f"Offline cache missing: {path}")
            url = f"https://raw.githubusercontent.com/pyrfume/pyrfume-data/{source_ref}/keller_2016/{filename}"
            print(f"Downloading {url}", flush=True)
            with urlopen(url, timeout=60) as response:
                payload = response.read()
            temporary = path.with_suffix(".csv.tmp")
            temporary.write_bytes(payload)
            temporary.replace(path)
            sources[filename] = url
            provenance.write_text(json.dumps(sources, indent=2) + "\n", encoding="utf-8")
        table = pd.read_csv(path, low_memory=False)
        headers[filename] = table.columns.tolist()
        print(f"{filename} headers: {json.dumps(headers[filename])}", flush=True)
        hashes[filename] = hashlib.sha256(path.read_bytes()).hexdigest()
        tables[filename] = table.rename(columns=lambda column: str(column).strip().casefold())
    return tables, headers, hashes, sources


def require_columns(table, columns, filename):
    missing = set(columns) - set(table.columns)
    if missing:
        raise ValueError(f"{filename} missing columns: {sorted(missing)}")


def prepare_ratings(tables):
    behavior = tables["behavior.csv"]
    stimuli = tables["stimuli.csv"]
    molecules = tables["molecules.csv"]
    subjects = tables["subjects.csv"]
    require_columns(molecules, ("cid",), "molecules.csv")
    require_columns(subjects, ("subjects",), "subjects.csv")
    require_columns(behavior, ("stimulus", "subject", "measurementvalue", "value"), "behavior.csv")
    require_columns(stimuli, ("stimulus", "cids", "concentration"), "stimuli.csv")
    stimuli = stimuli.copy()
    # The source uses CAS strings for these two odorants. Apply Pyrfume's
    # published Keller CID fixes before joining to numeric molecules.csv.
    stimuli["cids"] = pd.to_numeric(stimuli["cids"].astype(str).replace({
        "109-19-0": "8038", "3796-70-1": "1549778",
    }), errors="raise")
    behavior = behavior.copy()
    index = ["subject", "stimulus"]
    behavior["measurementvalue"] = behavior["measurementvalue"].str.strip().str.casefold().replace({
        "ammonia": "ammonia/urinous",
        "how strong is the smell?": "intensity",
        "how pleasant is the smell?": "pleasantness",
        "how familiar is the smell?": "familiarity",
    })
    # MeasurementValue holds descriptor names in the current long-format CSV.
    # Numeric coercion preserves blank / N/A ratings as missing, never as zero.
    relevant = behavior["measurementvalue"].isin((*DESCRIPTORS, "pleasantness"))
    values = behavior.loc[relevant, [*index, "measurementvalue", "value"]].copy()
    values["value"] = pd.to_numeric(values["value"], errors="coerce")
    if not values["value"].dropna().between(0, 100).all():
        raise ValueError("Expected Keller ratings in the 0–100 range")
    ratings = values.pivot_table(
        index=index, columns="measurementvalue", values="value", aggfunc="mean",
    ).reset_index()
    mapped = {descriptor for group in FAMILY_DESCRIPTORS.values() for descriptor in group}
    require_columns(ratings, (*mapped, "pleasantness"), "behavior.csv measurements")
    require_columns(ratings, DESCRIPTORS, "behavior.csv measurements")
    ratings = ratings.merge(
        stimuli[["stimulus", "cids", "concentration"]], on="stimulus", how="left", validate="many_to_one",
    )
    if ratings[["cids", "concentration"]].isna().any().any():
        raise ValueError("Every rating must join to a molecule and concentration")
    if not ratings["cids"].isin(molecules["cid"]).all():
        raise ValueError("Stimulus CIDs must exist in molecules.csv")
    subject_ids = sorted(subjects["subjects"].unique())
    if sorted(ratings["subject"].unique()) != subject_ids or len(subject_ids) != 55:
        raise ValueError("Expected the verified 55-subject panel")
    if ratings["cids"].nunique() != 480:
        raise ValueError("Expected the verified 480 molecules")
    if not (ratings.groupby("cids")["concentration"].nunique() == 2).all():
        raise ValueError("Expected two concentrations per molecule")
    ratings["high"] = ratings["concentration"].eq(ratings.groupby("cids")["concentration"].transform("max"))
    ratings["pleasantness"] = 1 + 4 * ratings["pleasantness"] / 100
    return ratings, subject_ids


def family_profiles(ratings, subject_ids, excluded_subject=None):
    # For evaluation, even descriptor averaging and the cutoff exclude the test subject.
    descriptor_rows = ratings if excluded_subject is None else ratings[ratings["subject"] != excluded_subject]
    available = [descriptor for descriptor in DESCRIPTORS if descriptor in descriptor_rows.columns]
    descriptors = descriptor_rows.groupby("cids")[available].mean()
    top_descriptor = descriptors.max(axis=1)
    cutoff = float(top_descriptor.quantile(0.60))
    scores = pd.DataFrame({
        # Average multi-descriptor groups so amber does not win merely because
        # it has four terms. Literal sums leave three families empty here.
        family: descriptors[list(FAMILY_DESCRIPTORS[family])].mean(axis=1)
        for family in FAMILIES
    })
    retained = top_descriptor.ge(cutoff) & scores.notna().all(axis=1)
    assignments = scores.loc[retained].idxmax(axis=1).rename("family")
    high = ratings.loc[ratings["high"], ["subject", "cids", "pleasantness"]].merge(
        assignments, on="cids", how="inner", validate="many_to_one",
    )
    profiles = high.groupby(["subject", "family"])["pleasantness"].mean().unstack("family")
    profiles = profiles.reindex(index=subject_ids, columns=FAMILIES)
    counts = assignments.value_counts().reindex(FAMILIES, fill_value=0).astype(int)
    return profiles.to_numpy(dtype=float), cutoff, counts


def fit_ridge(profiles):
    mean = np.nanmean(profiles, axis=0)
    if not np.isfinite(mean).all():
        raise ValueError("Every family needs observed training pleasantness; cannot invent an empty family")
    imputed = np.where(np.isnan(profiles), mean, profiles)
    scaler = StandardScaler().fit(imputed)
    standardised = scaler.transform(imputed)
    ridge = {}
    for target, family in enumerate(FAMILIES):
        others = [index for index in range(len(FAMILIES)) if index != target]
        observed = np.isfinite(profiles[:, target])
        regression = Ridge(alpha=1.0).fit(standardised[observed][:, others], standardised[observed, target])
        # Export raw 1–5 input/output coefficients for dependency-free TypeScript.
        coef = regression.coef_ * scaler.scale_[target] / scaler.scale_[others]
        intercept = mean[target] + scaler.scale_[target] * regression.intercept_ - np.dot(coef, mean[others])
        ridge[family] = {"intercept": float(intercept), "coef": coef.tolist()}
    return mean, scaler.scale_, standardised, ridge


def predict_family(ridge, family, inputs):
    others = [index for index, name in enumerate(FAMILIES) if name != family]
    weights = ridge[family]
    return float(np.clip(weights["intercept"] + np.dot(weights["coef"], inputs[others]), 1, 5))


def evaluate(ratings, subject_ids):
    errors, baselines = [], []
    by_family = {family: {"ridge": [], "baseline": []} for family in FAMILIES}
    sparse_errors = {count: [] for count in (0, 1, 3)}
    for held_out, subject in enumerate(subject_ids):
        profiles, _, _ = family_profiles(ratings, subject_ids, excluded_subject=subject)
        training = np.delete(profiles, held_out, axis=0)
        mean, _, _, ridge = fit_ridge(training)
        actual = profiles[held_out]
        inputs = np.where(np.isnan(actual), mean, actual)
        for target, family in enumerate(FAMILIES):
            if not np.isfinite(actual[target]):
                continue
            prediction = predict_family(ridge, family, inputs)
            error = abs(prediction - actual[target])
            baseline = abs(mean[target] - actual[target])
            errors.append(error)
            baselines.append(baseline)
            by_family[family]["ridge"].append(error)
            by_family[family]["baseline"].append(baseline)
            # Additional deterministic sparse-input checks, not the primary benchmark.
            others = [index for index in range(len(FAMILIES)) if index != target]
            for count in sparse_errors:
                sparse = mean.copy()
                known = others[:count]
                sparse[known] = inputs[known]
                sparse_errors[count].append(abs(predict_family(ridge, family, sparse) - actual[target]))
    if not errors:
        raise ValueError("No held-out observed targets to evaluate")
    return {
        "looMae": float(np.mean(errors)), "baselineMae": float(np.mean(baselines)),
    }, by_family, sparse_errors, len(errors)


def centroid_name(center):
    top, bottom = FAMILIES[int(np.argmax(center))], FAMILIES[int(np.argmin(center))]
    fresh, warm = {"citrus", "green", "water"}, {"woody", "amber"}
    if np.ptp(center) < 0.5:
        label = "Balanced"
    elif top in fresh and bottom in warm:
        label = "Fresh-leaning"
    elif top in warm and bottom in fresh:
        label = "Warm-leaning"
    elif top == "floral" and bottom != "floral":
        label = "Floral-leaning"
    else:
        label = "Balanced"
    return NAMES[label], top, bottom


def train(ratings, subject_ids):
    profiles, cutoff, counts = family_profiles(ratings, subject_ids)
    descriptors = ratings.groupby("cids")[list(DESCRIPTORS)].mean()
    summed_scores = pd.DataFrame({family: descriptors[list(group)].sum(axis=1, min_count=1) for family, group in FAMILY_DESCRIPTORS.items()})
    sum_retained = descriptors.max(axis=1).ge(cutoff) & summed_scores.notna().all(axis=1)
    sum_counts = summed_scores.loc[sum_retained].idxmax(axis=1).value_counts().reindex(FAMILIES, fill_value=0).astype(int)
    mean, std, standardised, ridge = fit_ridge(profiles)
    candidates = []
    for k in range(3, 7):
        clustering = KMeans(n_clusters=k, random_state=42, n_init=20).fit(standardised)
        score = float(silhouette_score(standardised, clustering.labels_))
        candidates.append((score, k, clustering))
        print(f"k={k} silhouette={score:.10f}", flush=True)
    _, best_k, clustering = max(candidates, key=lambda candidate: (candidate[0], -candidate[1]))
    # Canonical ordering makes IDs independent of arbitrary k-means label order.
    centers = sorted(clustering.cluster_centers_.tolist(), key=lambda center: (int(np.argmax(center)), int(np.argmin(center)), center))
    centroids = [{"id": f"nose-{index + 1}", "name": centroid_name(center)[0], "center": center} for index, center in enumerate(centers)]
    evaluation, by_family, sparse, observations = evaluate(ratings, subject_ids)
    model = {"families": list(FAMILIES), "mean": mean.tolist(), "std": std.tolist(), "centroids": centroids, "ridge": ridge, "eval": evaluation}
    details = {"cutoff": cutoff, "counts": counts, "sum_counts": sum_counts, "profiles": profiles, "candidates": candidates, "best_k": best_k, "by_family": by_family, "sparse": sparse, "observations": observations}
    return model, details


def write_report(model, details, headers, hashes, sources, ratings):
    evaluation = model["eval"]
    beats = evaluation["looMae"] < evaluation["baselineMae"]
    outcome = "The ridge model beats the training-mean baseline on this benchmark." if beats else "The ridge model does not beat the training-mean baseline on this benchmark."
    family_rows = "\n".join(
        f"| {family} | {details['counts'][family]} | {len(details['by_family'][family]['ridge'])} | {np.mean(details['by_family'][family]['ridge']):.10f} | {np.mean(details['by_family'][family]['baseline']):.10f} |"
        for family in FAMILIES
    )
    silhouette_rows = "\n".join(f"| {k} | {score:.10f} |" for score, k, _ in details["candidates"])
    centroid_rows = "\n".join(
        f"| {centroid['id']} | {centroid['name']['en']} | {centroid_name(centroid['center'])[1]} | {centroid_name(centroid['center'])[2]} |"
        for centroid in model["centroids"]
    )
    sparse_rows = "\n".join(f"| {count} | {np.mean(errors):.10f} |" for count, errors in details["sparse"].items())
    available = [descriptor for descriptor in DESCRIPTORS if descriptor in ratings.columns]
    sum_counts = ", ".join(f"{family}={details['sum_counts'][family]}" for family in FAMILIES)
    report = f"""# Element nose model

Offline training on [Keller & Vosshall (2016), *Olfactory perception of chemically diverse molecules*, BMC Neuroscience 17:55, PMC4977894](https://pmc.ncbi.nlm.nih.gov/articles/PMC4977894/), DOI [10.1186/s12868-016-0287-2](https://doi.org/10.1186/s12868-016-0287-2). Original dataset: 55 subjects, 480 molecules, two concentrations per molecule, intensity, pleasantness, familiarity and 20 odor descriptors. Dataset licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). CSV transformation supplied by [Pyrfume, keller_2016](https://github.com/pyrfume/pyrfume-data/tree/main/keller_2016). This project transforms descriptor scores and pleasantness into six preference families; these are not labels supplied by the authors.

## Observed evaluation

- `looMae`: **{evaluation['looMae']:.10f}**
- `baselineMae`: **{evaluation['baselineMae']:.10f}**
- Errors are in **1–5 pleasantness units**, over {details['observations']} observed held-out subject/family targets in 55 folds.
- {outcome}

Each fold excludes one subject from descriptor averaging, percentile filtering, family assignment, predictor imputation, standardisation and ridge fitting. The held-out subject's five other observed family means predict the sixth. The baseline is that family's mean among the 54 training subjects. Missing targets are excluded from scoring; missing predictors use the fold's training means. Both ridge outputs and baseline means are within 1–5. Clustering is descriptive and is not used to predict pleasantness.

| Family | Retained molecules (full-data map) | LOO targets | Ridge MAE | Mean baseline MAE |
| --- | ---: | ---: | ---: | ---: |
{family_rows}

Additional sparse-input results use the first N other families in the fixed family order (not randomly selected). All unknown inputs use training means. These checks illustrate the sparse-input limitation and are not a validated app-input benchmark.

| Known other families | Ridge MAE |
| ---: | ---: |
{sparse_rows}

## Data preparation and choices

This run uses the full current long export: `Stimulus,Subject,Experiment,MeasurementValue,Value` plus export index. It includes all 20 descriptors. MeasurementValue contains descriptor names and question labels; `HOW PLEASANT IS THE SMELL?` is normalised to `pleasantness`. Stimulus joins to stimuli.csv for its CID and concentration. The stimulus CSV uses CAS strings for two molecules; apply [Pyrfume's published Keller corrections](https://github.com/pyrfume/pyrfume/blob/main/pyrfume/keller.py), `109-19-0` → CID 8038 (isobutyl acetate) and `3796-70-1` → CID 1549778 (geranylacetone), before numeric CID matching. Subjects.csv validates subject IDs only; demographic fields are not predictors. The checked-in model was trained from these current CSVs, not an older compact export.

1. Inspect all four CSV headers, listed below. The script validates the current long-format schema and all 20 descriptors, and averages repeat ratings for each subject/molecule/concentration before aggregation. Use numeric stimulus/CID/subject IDs, not row position, to join the files.
2. The source ratings use 0–100; transform pleasantness with `1 + 4 * pleasantness / 100`. Missing ratings still present in the supplied CSV remain missing. Descriptor scores stay on their original scale.
3. Average each descriptor per molecule across subjects and both concentrations. Assign the maximum family score: citrus = mean(fruit, sour); green = grass; water = cold; floral = flower; woody = wood; amber = mean(warm, sweet, spices, musky). **Necessary interpretation of the brief's grouped descriptors:** normalize each group by its descriptor count. Literal sums on these current inputs produce full-data counts **{sum_counts}**. Empty families cannot support trained regressions. Group means preserve the requested descriptor membership and make all six families observable. Ties use `families` order.
4. Filter using each molecule's **maximum mean score across the {len(available)} available original descriptors**, before grouping family scores. Keep scores at or above the 60th percentile: **{details['cutoff']:.10f}** in the full-data map. Retained: **{int(details['counts'].sum())}/480** molecules. This also retains molecules strongly associated with an unmapped descriptor; the six-family projection is a heuristic.
5. Select **each molecule's own maximum concentration**, rather than one global concentration. There are {ratings['concentration'].nunique()} absolute concentrations across this two-level-per-molecule dataset. Average high-concentration pleasantness per subject/family, giving molecules equal weight. Training profiles contain {int(np.isnan(details['profiles']).sum())} missing subject/family entries, filled from training means for predictors and clustering only.
6. `StandardScaler` uses population standard deviation (ddof=0), with scale 1 for zero variance. Fit k-means for k in **3..6**, seed **42**, **20** initialisations, choose the highest silhouette (smaller k wins a tie). Selected **k={details['best_k']}**.
7. Fit **Ridge(alpha=1.0)** on standardised predictors and target, separately per family using the other five. Export coefficients converted back to raw 1–5 inputs and outputs. Coefficients follow `families` order **with the target family omitted**. No target self-coefficient is stored.

| k | Silhouette |
| ---: | ---: |
{silhouette_rows}

Centroid centers are standardised coordinates. IDs are sorted by top-family index, bottom-family index and coordinates. Names use both top and bottom family: a fresh top (citrus/green/water) and warm bottom (woody/amber) is Fresh-leaning; the reverse is Warm-leaning; a floral top is Floral-leaning; other combinations or a center range below 0.5 are Balanced. Multiple centroids may share a display name, but IDs are unique. All names have English, traditional Chinese and simplified Chinese values.

| ID | Name | Top family | Bottom family |
| --- | --- | --- | --- |
{centroid_rows}

## TypeScript inference

`inferNose(likes, sensitivity)` preserves finite known likes after clamping them to 1–5. For every missing or non-finite like, apply that family's ridge model to the **original** known inputs and training means for all other unknown inputs. Fill simultaneously, clamp predictions, standardise all six filled values, then choose the nearest centroid by Euclidean distance (squared distance is equivalent). Sensitivity affects only `muskQuiet = filled.amber <= 2 && sensitivity === "low"`. The flag is a product heuristic, not a clinical measure of musk sensitivity. Runtime needs only the checked-in JSON; it performs no network calls or Python execution.

## Reproduction

```powershell
python -m pip install --user numpy pandas scikit-learn
python scripts/train-nose-model.py
python scripts/train-nose-model.py --offline
npm test
```

The script caches CSVs under `.tmp/nose-data/keller_2016` (ignored by Git). `--data-dir PATH` selects another cache; `--refresh` redownloads all CSVs and cannot be combined with `--offline`. A fresh cache defaults to the task's current `main` URLs; `--source-ref REF` can pin a compatible Pyrfume commit. Existing cached files take precedence over this option. It writes `lib/element/nose-model.json` and this report only after successful training and evaluation. `main` is mutable; retain the recorded CSV hashes for exact input verification. Versions in this run: Python {platform.python_version()}, numpy {np.__version__}, pandas {pd.__version__}, scikit-learn {sklearn.__version__}.

Actual cached input sources (`unknown` when pre-provisioned without sources.json):

```json
{json.dumps({filename: sources.get(filename, 'unknown') for filename in FILES}, indent=2)}
```

Actual CSV headers before normalisation:

```json
{json.dumps(headers, indent=2)}
```

Input SHA-256 hashes:

```json
{json.dumps(hashes, indent=2)}
```

## Limits

This panel has only 55 subjects. Synthetic six-family averages of laboratory molecule ratings differ from direct 1–5 ratings of kit scents, mixtures, real-world perfume preferences and demographic populations. The primary evaluation assumes five other family averages are known; mean-filled sparse inputs have less information. Silhouette selection is in-sample cluster structure, not classification accuracy. Family sizes remain uneven even after descriptor-count normalization. These results support a hackathon prototype, not an olfactory diagnosis, validated preference taxonomy or demonstrated accuracy on app users.
"""
    path = ROOT / "docs/element-nose-model.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(report, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=ROOT / ".tmp/nose-data/keller_2016")
    parser.add_argument("--offline", action="store_true")
    parser.add_argument("--refresh", action="store_true")
    parser.add_argument("--source-ref", default="main", help="Compatible Pyrfume ref for all four CSVs; defaults to main")
    args = parser.parse_args()
    if args.offline and args.refresh:
        parser.error("--offline and --refresh cannot be combined")
    tables, headers, hashes, sources = load_csvs(args.data_dir, args.offline, args.refresh, args.source_ref)
    ratings, subjects = prepare_ratings(tables)
    print(f"subjects={len(subjects)} molecules={ratings['cids'].nunique()} subject/stimulus profiles={len(ratings)}", flush=True)
    model, details = train(ratings, subjects)
    output = ROOT / "lib/element/nose-model.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(model, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    write_report(model, details, headers, hashes, sources, ratings)
    print(f"looMae={model['eval']['looMae']:.10f} baselineMae={model['eval']['baselineMae']:.10f}", flush=True)
    print(f"Wrote {output.relative_to(ROOT)} and docs/element-nose-model.md", flush=True)


if __name__ == "__main__":
    main()

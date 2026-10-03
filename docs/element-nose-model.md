# Element nose model

Offline training on [Keller & Vosshall (2016), *Olfactory perception of chemically diverse molecules*, BMC Neuroscience 17:55, PMC4977894](https://pmc.ncbi.nlm.nih.gov/articles/PMC4977894/), DOI [10.1186/s12868-016-0287-2](https://doi.org/10.1186/s12868-016-0287-2). Original dataset: 55 subjects, 480 molecules, two concentrations per molecule, intensity, pleasantness, familiarity and 20 odor descriptors. Dataset licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). CSV transformation supplied by [Pyrfume, keller_2016](https://github.com/pyrfume/pyrfume-data/tree/main/keller_2016). This project transforms descriptor scores and pleasantness into six preference families; these are not labels supplied by the authors.

## Observed evaluation

- `looMae`: **0.1775916397**
- `baselineMae`: **0.2999222812**
- Errors are in **1–5 pleasantness units**, over 330 observed held-out subject/family targets in 55 folds.
- The ridge model beats the training-mean baseline on this benchmark.

Each fold excludes one subject from descriptor averaging, percentile filtering, family assignment, predictor imputation, standardisation and ridge fitting. The held-out subject's five other observed family means predict the sixth. The baseline is that family's mean among the 54 training subjects. Missing targets are excluded from scoring; missing predictors use the fold's training means. Both ridge outputs and baseline means are within 1–5. Clustering is descriptive and is not used to predict pleasantness.

| Family | Retained molecules (full-data map) | LOO targets | Ridge MAE | Mean baseline MAE |
| --- | ---: | ---: | ---: | ---: |
| citrus | 23 | 55 | 0.1693407751 | 0.2904134809 |
| green | 37 | 55 | 0.1728243080 | 0.3099735535 |
| water | 43 | 55 | 0.1688178993 | 0.3071246611 |
| floral | 49 | 55 | 0.1470841631 | 0.2819316907 |
| woody | 22 | 55 | 0.2127048556 | 0.3162186259 |
| amber | 17 | 55 | 0.1947778371 | 0.2938716749 |

Additional sparse-input results use the first N other families in the fixed family order (not randomly selected). All unknown inputs use training means. These checks illustrate the sparse-input limitation and are not a validated app-input benchmark.

| Known other families | Ridge MAE |
| ---: | ---: |
| 0 | 0.2999222812 |
| 1 | 0.2594231831 |
| 3 | 0.1904003604 |

## Data preparation and choices

This run uses the full current long export: `Stimulus,Subject,Experiment,MeasurementValue,Value` plus export index. It includes all 20 descriptors. MeasurementValue contains descriptor names and question labels; `HOW PLEASANT IS THE SMELL?` is normalised to `pleasantness`. Stimulus joins to stimuli.csv for its CID and concentration. The stimulus CSV uses CAS strings for two molecules; apply [Pyrfume's published Keller corrections](https://github.com/pyrfume/pyrfume/blob/main/pyrfume/keller.py), `109-19-0` → CID 8038 (isobutyl acetate) and `3796-70-1` → CID 1549778 (geranylacetone), before numeric CID matching. Subjects.csv validates subject IDs only; demographic fields are not predictors. The checked-in model was trained from these current CSVs, not an older compact export.

1. Inspect all four CSV headers, listed below. The script validates the current long-format schema and all 20 descriptors, and averages repeat ratings for each subject/molecule/concentration before aggregation. Use numeric stimulus/CID/subject IDs, not row position, to join the files.
2. The source ratings use 0–100; transform pleasantness with `1 + 4 * pleasantness / 100`. Missing ratings still present in the supplied CSV remain missing. Descriptor scores stay on their original scale.
3. Average each descriptor per molecule across subjects and both concentrations. Assign the maximum family score: citrus = mean(fruit, sour); green = grass; water = cold; floral = flower; woody = wood; amber = mean(warm, sweet, spices, musky). **Necessary interpretation of the brief's grouped descriptors:** normalize each group by its descriptor count. Literal sums on these current inputs produce full-data counts **citrus=0, green=0, water=0, floral=0, woody=0, amber=191**. Empty families cannot support trained regressions. Group means preserve the requested descriptor membership and make all six families observable. Ties use `families` order.
4. Filter using each molecule's **maximum mean score across the 20 available original descriptors**, before grouping family scores. Keep scores at or above the 60th percentile: **40.6512820513** in the full-data map. Retained: **191/480** molecules. This also retains molecules strongly associated with an unmapped descriptor; the six-family projection is a heuristic.
5. Select **each molecule's own maximum concentration**, rather than one global concentration. There are 4 absolute concentrations across this two-level-per-molecule dataset. Average high-concentration pleasantness per subject/family, giving molecules equal weight. Training profiles contain 0 missing subject/family entries, filled from training means for predictors and clustering only.
6. `StandardScaler` uses population standard deviation (ddof=0), with scale 1 for zero variance. Fit k-means for k in **3..6**, seed **42**, **20** initialisations, choose the highest silhouette (smaller k wins a tie). Selected **k=3**.
7. Fit **Ridge(alpha=1.0)** on standardised predictors and target, separately per family using the other five. Export coefficients converted back to raw 1–5 inputs and outputs. Coefficients follow `families` order **with the target family omitted**. No target self-coefficient is stored.

| k | Silhouette |
| ---: | ---: |
| 3 | 0.3114266152 |
| 4 | 0.2570943137 |
| 5 | 0.2431454924 |
| 6 | 0.2006103546 |

Centroid centers are standardised coordinates. IDs are sorted by top-family index, bottom-family index and coordinates. Names use both top and bottom family: a fresh top (citrus/green/water) and warm bottom (woody/amber) is Fresh-leaning; the reverse is Warm-leaning; a floral top is Floral-leaning; other combinations or a center range below 0.5 are Balanced. Multiple centroids may share a display name, but IDs are unique. All names have English, traditional Chinese and simplified Chinese values.

| ID | Name | Top family | Bottom family |
| --- | --- | --- | --- |
| nose-1 | Balanced | citrus | water |
| nose-2 | Balanced | citrus | water |
| nose-3 | Balanced | water | citrus |

## TypeScript inference

`inferNose(likes, sensitivity)` preserves finite known likes after clamping them to 1–5. For every missing or non-finite like, apply that family's ridge model to the **original** known inputs and training means for all other unknown inputs. Fill simultaneously, clamp predictions, standardise all six filled values, then choose the nearest centroid by Euclidean distance (squared distance is equivalent). Sensitivity affects only `muskQuiet = filled.amber <= 2 && sensitivity === "low"`. The flag is a product heuristic, not a clinical measure of musk sensitivity. Runtime needs only the checked-in JSON; it performs no network calls or Python execution.

## Reproduction

```powershell
python -m pip install --user numpy pandas scikit-learn
python scripts/train-nose-model.py
python scripts/train-nose-model.py --offline
npm test
```

The script caches CSVs under `.tmp/nose-data/keller_2016` (ignored by Git). `--data-dir PATH` selects another cache; `--refresh` redownloads all CSVs and cannot be combined with `--offline`. A fresh cache defaults to the task's current `main` URLs; `--source-ref REF` can pin a compatible Pyrfume commit. Existing cached files take precedence over this option. It writes `lib/element/nose-model.json` and this report only after successful training and evaluation. `main` is mutable; retain the recorded CSV hashes for exact input verification. Versions in this run: Python 3.12.10, numpy 2.5.1, pandas 3.0.3, scikit-learn 1.9.0.

Actual cached input sources (`unknown` when pre-provisioned without sources.json):

```json
{
  "behavior.csv": "https://raw.githubusercontent.com/pyrfume/pyrfume-data/main/keller_2016/behavior.csv",
  "molecules.csv": "https://raw.githubusercontent.com/pyrfume/pyrfume-data/main/keller_2016/molecules.csv",
  "stimuli.csv": "https://raw.githubusercontent.com/pyrfume/pyrfume-data/main/keller_2016/stimuli.csv",
  "subjects.csv": "https://raw.githubusercontent.com/pyrfume/pyrfume-data/main/keller_2016/subjects.csv"
}
```

Actual CSV headers before normalisation:

```json
{
  "behavior.csv": [
    "Unnamed: 0",
    "Stimulus",
    "Subject",
    "Experiment",
    "MeasurementValue",
    "Value"
  ],
  "molecules.csv": [
    "Unnamed: 0",
    "CID",
    "OdorName",
    "CAS",
    "CanonicalSMILES",
    "MolecularWeight"
  ],
  "stimuli.csv": [
    "Unnamed: 0",
    "Stimulus",
    "Experiment",
    "CIDs",
    "Concentration",
    "Ratio",
    "Solvent"
  ],
  "subjects.csv": [
    "Unnamed: 0",
    "Subjects",
    "Experiment",
    "Gender",
    "Race",
    "Ethnicity",
    "Age"
  ]
}
```

Input SHA-256 hashes:

```json
{
  "behavior.csv": "ab31c17c475c8b471706822f89aaf9e148bebe5f50f33ff03ebc42b32ac94df8",
  "molecules.csv": "5f862b6ea62dd3ee0a15138605ea2567d06a527263284348a5982844f9bec81f",
  "stimuli.csv": "49c1a6bfb8c1665a31e13f515add95a95291f29416be1bb0b54d3317efb6665b",
  "subjects.csv": "45d4d17d557982bb98ce399cf4cf07166aa38f6670c339bad266aac21583c39f"
}
```

## Limits

This panel has only 55 subjects. Synthetic six-family averages of laboratory molecule ratings differ from direct 1–5 ratings of kit scents, mixtures, real-world perfume preferences and demographic populations. The primary evaluation assumes five other family averages are known; mean-filled sparse inputs have less information. Silhouette selection is in-sample cluster structure, not classification accuracy. Family sizes remain uneven even after descriptor-count normalization. These results support a hackathon prototype, not an olfactory diagnosis, validated preference taxonomy or demonstrated accuracy on app users.

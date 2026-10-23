import type { Product } from "../../lib/shop";
import { SCENT_NOTES, SCENT_STAGES, scentJourneyCopy } from "../../lib/scent-notes";
import { lineIcon } from "../site-header";
import "./scent-profile.css";

type Locale = keyof Product["copy"];

const profileCopy: Record<Locale, { family: string; hints: string[]; families: Record<string, string> }> = {
  en: { family: "Fragrance family", hints: ["First impression", "As it settles", "What lingers"], families: { tea: "Tea", floral: "Floral", woody: "Woody", fruity: "Fruity", green: "Green", citrus: "Citrus", fresh: "Fresh", marine: "Marine", musky: "Musky", powdery: "Powdery", aromatic: "Aromatic" } },
  "zh-Hant": { family: "香調家族", hints: ["第一印象", "慢慢展開", "最後留下"], families: { tea: "茶香", floral: "花香", woody: "木質", fruity: "果香", green: "綠意", citrus: "柑橘", fresh: "清新", marine: "海洋", musky: "麝香", powdery: "粉感", aromatic: "芳香" } },
  "zh-Hans": { family: "香调家族", hints: ["第一印象", "慢慢展开", "最后留下"], families: { tea: "茶香", floral: "花香", woody: "木质", fruity: "果香", green: "绿意", citrus: "柑橘", fresh: "清新", marine: "海洋", musky: "麝香", powdery: "粉感", aromatic: "芳香" } },
};

// One drawn icon per note family, matched against the English note name. First match wins.
const noteIcons: [RegExp, string][] = [
  [/tea/i, "M4 9h13v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6ZM17 10.5h1.5a2.5 2.5 0 0 1 0 5h-1.9M9 3.5c-.8 1 .8 2 0 3M12.5 3.5c-.8 1 .8 2 0 3"],
  [/citrus|lemon|mandarin|bergamot/i, "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM12 6.5v11M7.2 9.2l9.6 5.6M7.2 14.8l9.6-5.6"],
  [/peach|pear|fruit|fig/i, "M12 7c-1.4 0-2 1.6-2.4 3.2C9 12.6 6.5 13.6 6.5 16.6A5.5 5.5 0 0 0 12 21a5.5 5.5 0 0 0 5.5-4.4c0-3-2.5-4-3.1-6.4C14 8.6 13.4 7 12 7ZM12 7V4.5M12 5c1-1.3 2.6-1.8 4-1.2-.7 1.5-2.3 2-4 1.6"],
  [/jasmine|neroli|freesia|rose|flower|floral|lily/i, "M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM12 10c-1.8-2.2-1.8-5 0-6.5 1.8 1.5 1.8 4.3 0 6.5ZM14 12c2.2-1.8 5-1.8 6.5 0-1.5 1.8-4.3 1.8-6.5 0ZM12 14c1.8 2.2 1.8 5 0 6.5-1.8-1.5-1.8-4.3 0-6.5ZM10 12c-2.2 1.8-5 1.8-6.5 0 1.5-1.8 4.3-1.8 6.5 0Z"],
  [/wood|cedar|sandal|vetiver/i, "M12 3 6 12h3l-4 6h14l-4-6h3ZM12 18v3"],
  [/musk/i, "M7 17a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 8a4.5 4.5 0 0 1 0 9Z"],
  [/cardamom/i, "M12 3c3.5 3 4.5 9 0 18-4.5-9-3.5-15 0-18ZM12 6v12"],
  [/sea|salt|marine|coastal/i, "M3 9c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0M3 14c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0M3 19c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0"],
  [/amber/i, "M7 4h10l4 5-9 11L3 9ZM3 9h18M9.5 4 8 9l4 11 4-11-1.5-5"],
  [/leather|tobacco|hay/i, "M12 21V8M12 8c-2-1-2.5-3-1.5-5 2 1 2.5 3 1.5 5Zm0 4c-2.4-.4-3.6-2.2-3.4-4.4 2.4.4 3.6 2.2 3.4 4.4Zm0 0c2.4-.4 3.6-2.2 3.4-4.4-2.4.4-3.6 2.2-3.4 4.4Zm0 4c-2.4-.4-3.6-2.2-3.4-4.4 2.4.4 3.6 2.2 3.4 4.4Zm0 0c2.4-.4 3.6-2.2 3.4-4.4-2.4.4-3.6 2.2-3.4 4.4Z"],
  [/air/i, "M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h7"],
  [/green|leaf|leaves|mint/i, "M5 19C5 10 10 5 19 5c0 9-5 14-14 14ZM5 19l9-9"],
];
const dropIcon = "M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11Z";
export const noteIcon = (englishNote = "") => noteIcons.find(([pattern]) => pattern.test(englishNote))?.[1] ?? dropIcon;

// Each tier is one slice of the classic fragrance pyramid; stacked rows draw the whole shape.
const tiers = ["120,6 162,94 78,94", "74,6 166,6 206,94 34,94", "30,6 210,6 236,94 4,94"];

export function ScentProfile({ product, locale, title }: { product: Product; locale: Locale; title: string }) {
  const journey = scentJourneyCopy[locale];
  const copy = profileCopy[locale];
  const stages = SCENT_NOTES[product.slug][locale];
  const english = SCENT_NOTES[product.slug].en;

  return <section className="store-scent-profile" id="scent-profile" aria-labelledby="scent-profile-title" aria-describedby="scent-profile-note">
    <div className="store-scent-profile-head">
      <h2 id="scent-profile-title">{title}</h2>
      <div className="store-scent-families"><span>{copy.family}</span><ul role="list">{product.families.map((family) => <li key={family}>{copy.families[family] ?? family}</li>)}</ul></div>
    </div>
    <ol className="store-scent-profile-notes" role="list">
      {SCENT_STAGES.map((stage, index) => {
        const notes = stages[stage].split(" · ");
        const englishNotes = english[stage].split(" · ");
        return <li key={stage} className={`store-scent-tier store-scent-tier-${index + 1}`}>
          <svg className="store-scent-slice" aria-hidden="true" viewBox="0 0 240 100" preserveAspectRatio="none"><polygon points={tiers[index]} /></svg>
          <div className="store-scent-tier-label"><h3>{journey.labels[stage]}</h3><p>{copy.hints[index]}</p></div>
          <ul className="store-scent-notes" role="list">{notes.map((note, noteIndex) => <li key={note}><span className="store-scent-note-icon">{lineIcon(noteIcon(englishNotes[noteIndex]))}</span>{note.charAt(0).toUpperCase() + note.slice(1)}</li>)}</ul>
        </li>;
      })}
    </ol>
    <p className="store-scent-profile-note" id="scent-profile-note">{journey.disclaimer}</p>
  </section>;
}

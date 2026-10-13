import type { Product } from "../../lib/shop";
import { SCENT_NOTES, SCENT_STAGES, scentJourneyCopy } from "../../lib/scent-notes";
import "./scent-profile.css";

export function ScentProfile({ product, locale, title }: { product: Product; locale: keyof Product["copy"]; title: string }) {
  const journey = scentJourneyCopy[locale];
  const stages = SCENT_NOTES[product.slug][locale];

  return <section className="store-scent-profile" id="scent-profile" aria-labelledby="scent-profile-title" aria-describedby="scent-profile-note">
    <h2 id="scent-profile-title">{title}</h2>
    <ol className="store-scent-profile-notes" role="list">
      {SCENT_STAGES.map((stage, index) => <li key={stage}><h3><span className="store-scent-stage-number" aria-hidden="true">0{index + 1}</span>{journey.labels[stage]}</h3><p>{stages[stage]}</p></li>)}
    </ol>
    <p className="store-scent-profile-note" id="scent-profile-note">{journey.disclaimer}</p>
  </section>;
}

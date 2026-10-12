import type { Product } from "../../lib/shop";
import { SCENT_NOTES, SCENT_STAGES, scentJourneyCopy } from "../../lib/scent-notes";
import "./scent-profile.css";

export function ScentProfile({ product, locale, title }: { product: Product; locale: keyof Product["copy"]; title: string }) {
  const journey = scentJourneyCopy[locale];
  const stages = SCENT_NOTES[product.slug][locale];

  return <section className="store-scent-profile" id="scent-profile" aria-labelledby="scent-profile-title" aria-describedby="scent-profile-note">
    <h2 id="scent-profile-title">{title}</h2>
    <div className="store-scent-diagram">
      <div className="store-scent-pyramid" aria-hidden="true">
        <svg viewBox="0 0 180 264" preserveAspectRatio="none" fill="none">
          <polygon className="store-scent-opening" points="90,8 114,80 66,80" />
          <polygon className="store-scent-heart" points="64,88 116,88 142,168 38,168" />
          <polygon className="store-scent-dry-down" points="36,176 144,176 170,256 10,256" />
        </svg>
      </div>
      <ol className="store-scent-profile-notes" role="list">
        {SCENT_STAGES.map((stage) => <li key={stage}><h3>{journey.labels[stage]}</h3><p>{stages[stage]}</p></li>)}
      </ol>
    </div>
    <p className="store-scent-profile-note" id="scent-profile-note">{journey.disclaimer}</p>
  </section>;
}

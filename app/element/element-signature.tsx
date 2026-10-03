import "./element-signature.css";

/** The supplied Element artwork, displayed with source-preserving crops. */
export function ElementSignature({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return <span className={`element-signature ${className}`} role="img" aria-label="Element">
    {compact ? <span className="element-signature-compact" aria-hidden="true">
      <span className="element-brand-monogram"><img src="/media/element-brand-original.png" alt="" width="1254" height="1254" /></span>
      <span className="element-brand-lettering"><img src="/media/element-brand-original.png" alt="" width="1254" height="1254" /></span>
    </span> : <span className="element-signature-full" aria-hidden="true">
      <img src="/media/element-brand-original.png" alt="" width="1254" height="1254" />
      <span className="element-signature-target" />
    </span>}
  </span>;
}

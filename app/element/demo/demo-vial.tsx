/** Decorative concept photograph; the surrounding control supplies its accessible label. */
export function DemoVial({ label, active = false, size = "large", className = "" }: {
  label: string;
  active?: boolean;
  size?: "small" | "large";
  className?: string;
}) {
  return <span aria-hidden="true" className={`demo-vial-photo demo-vial-photo--${size} ${active ? "is-active" : ""} ${className}`}>
    <img src="/media/element-demo-vial.webp" width="1024" height="1536" alt="" loading="lazy" decoding="async" />
    <span className="demo-vial-photo-label">{label}</span>
  </span>;
}

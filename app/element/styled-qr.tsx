"use client";

import { useEffect, useRef, useState } from "react";

export function StyledQr({ value, size = 216 }: { value: string; size?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const container = host.current;
    setFailed(false);
    // The renderer accesses the DOM, so keep it outside server rendering.
    import("qr-code-styling").then(({ default: QRCodeStyling }) => {
      if (cancelled || !container) return;
      container.replaceChildren();
      new QRCodeStyling({
        width: size, height: size, type: "svg", data: value, margin: 10,
        dotsOptions: { type: "rounded", color: "#8a6418" },
        cornersSquareOptions: { type: "extra-rounded", color: "#8a6418" },
        cornersDotOptions: { type: "dot", color: "#8a6418" },
        image: "/media/element-e.png",
        imageOptions: { margin: 6, hideBackgroundDots: true, imageSize: 0.32 },
        qrOptions: { errorCorrectionLevel: "H" },
        backgroundOptions: { color: "#ffffff" },
      }).append(container);
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; container?.replaceChildren(); };
  }, [value, size]);
  return <div className="styled-qr" style={{ width: size, minHeight: size }}>
    <div ref={host} role="img" aria-label={value} />
    {failed && <a href={value}>{value}</a>}
  </div>;
}

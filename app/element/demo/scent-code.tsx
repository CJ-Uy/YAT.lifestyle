"use client";

import { StyledQr } from "../styled-qr";
import type { FamilyValues } from "./local-social";
import { SCENT_CODE_QR, SCENT_CODE_VIEWBOX, scentCodeContour } from "./scent-code-geometry";
import "./scent-code.css";

export function ScentCode({ likes, value, size = 220 }: { likes: FamilyValues; value: string; size?: number }) {
  const contour = scentCodeContour(likes);
  const echo = scentCodeContour(likes, 6);
  const qrSize = Math.round(size * SCENT_CODE_QR / SCENT_CODE_VIEWBOX);
  return <div className="scent-code" style={{ width: size, height: size }}>
    <svg className="scent-code-outline" viewBox={`0 0 ${SCENT_CODE_VIEWBOX} ${SCENT_CODE_VIEWBOX}`} aria-hidden="true">
      <path className="scent-code-echo" d={echo.path} />
      <path className="scent-code-contour" d={contour.path} />
      {contour.points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="3" />)}
    </svg>
    <div className="scent-code-qr"><StyledQr value={value} size={qrSize} color="#223541" /></div>
  </div>;
}

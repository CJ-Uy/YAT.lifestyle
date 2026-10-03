import { CARD_FAMILIES, type FamilyValues } from "./local-social";
import { SCENT_CODE_QR, SCENT_CODE_VIEWBOX, scentCodeContour } from "./scent-code-geometry";

export type ExportCard = {
  name: string;
  nose: string;
  base: string;
  concentration: string;
  families: Record<string, string>;
  likes: FamilyValues;
  url: string;
  qrLabel: string;
  signatureLabel: string;
  status: string;
  sample: string;
};

function wrappedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lineHeight: number, maxLines = 4) {
  // Character wrapping also works for Chinese copy and names without spaces.
  const lines: string[] = [];
  let line = "";
  for (const char of Array.from(text)) {
    if (ctx.measureText(line + char).width > width && line) {
      lines.push(line.trim());
      line = char;
    } else line += char;
  }
  if (line) lines.push(line.trim());
  lines.slice(0, maxLines).forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight));
  return Math.min(maxLines, lines.length) * lineHeight;
}

let brandImagePromise: Promise<HTMLImageElement> | undefined;
function originalBrandImage() {
  if (!brandImagePromise) {
    brandImagePromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Brand image unavailable"));
      image.src = "/media/element-brand-original.png";
    }).catch(error => { brandImagePromise = undefined; throw error; });
  }
  return brandImagePromise;
}

/** The supplied brand image stays intact; preferences and the scan code are rendered from session data. */
export async function renderCardPng(card: ExportCard): Promise<Blob> {
  if (document.fonts) {
    try {
      await document.fonts.load('400 78px "Bodoni Moda"', card.name);
      await document.fonts.ready;
    } catch { /* A cached or installed serif fallback keeps offline downloads available. */ }
  }
  const brand = await originalBrandImage();
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  const ink = "#223541";
  const muted = "#53636d";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  // Display-only brightness matches the shared component; source pixels and gold hues are retained.
  ctx.filter = "brightness(1.04)";
  ctx.drawImage(brand, 400, 214, 480, 526, 80, 54, 50, 55);
  ctx.drawImage(brand, 54, 784, 1146, 195, 146, 76, 180, 31);
  ctx.restore();
  ctx.fillStyle = ink;
  ctx.font = '26px Arial, sans-serif';
  ctx.textAlign = "right";
  ctx.fillText(card.concentration, 1000, 106);
  ctx.textAlign = "left";
  let nameSize = 78;
  ctx.font = `${nameSize}px "Bodoni Moda", Georgia, serif`;
  if (ctx.measureText(card.name).width > 920) nameSize = 46;
  ctx.font = `${nameSize}px "Bodoni Moda", Georgia, serif`;
  while (nameSize > 20 && ctx.measureText(card.name).width > 1780) {
    nameSize -= 2;
    ctx.font = `${nameSize}px "Bodoni Moda", Georgia, serif`;
  }
  const nameLine = nameSize * 1.15;
  const nameHeight = wrappedText(ctx, card.name, 80, 222, 920, nameLine, 2);
  ctx.font = '27px Arial, sans-serif';
  ctx.fillStyle = muted;
  wrappedText(ctx, `${card.base} · ${card.nose}`, 80, 270 + nameHeight - nameLine, 920, 38, 2);

  const cx = 540, cy = 680, radius = 210;
  const point = (index: number, r: number) => {
    const angle = index * Math.PI / 3 - Math.PI / 2;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  };
  const polygon = (radii: number[]) => {
    ctx.beginPath();
    radii.forEach((r, index) => {
      const [x, y] = point(index, r);
      if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
  };
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#7b8d9b";
  [1, 2, 3, 4, 5].forEach(level => { polygon(CARD_FAMILIES.map(() => radius * level / 5)); ctx.stroke(); });
  CARD_FAMILIES.forEach((_, index) => {
    const [x, y] = point(index, radius);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
  });
  polygon(CARD_FAMILIES.map(family => radius * card.likes[family] / 5));
  ctx.fillStyle = "rgba(34,53,65,0.08)"; ctx.fill();
  ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.stroke();
  CARD_FAMILIES.forEach((family, index) => {
    const [x, y] = point(index, radius * card.likes[family] / 5);
    ctx.beginPath(); ctx.arc(x, y, 6, 0, 2 * Math.PI); ctx.fillStyle = ink; ctx.fill();
    const [lx, ly] = point(index, 285);
    ctx.textAlign = "center"; ctx.fillStyle = ink; ctx.font = '27px Arial, sans-serif';
    ctx.fillText(card.families[family], lx, ly - 5);
    ctx.font = '22px Arial, sans-serif'; ctx.fillStyle = muted;
    ctx.fillText(`${card.likes[family]} / 5`, lx, ly + 27);
  });
  ctx.textAlign = "left";
  ctx.strokeStyle = "#d3dcdf"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(80, 994); ctx.lineTo(1000, 994); ctx.stroke();
  ctx.fillStyle = ink; ctx.font = '27px Arial, sans-serif';
  ctx.fillText(card.signatureLabel, 80, 1050);
  const codeX = 680, codeY = 1032, codeSize = 320;
  const codeScale = codeSize / SCENT_CODE_VIEWBOX;
  const contour = scentCodeContour(card.likes);
  ctx.save();
  ctx.translate(codeX, codeY); ctx.scale(codeScale, codeScale);
  ctx.strokeStyle = "#93a4af"; ctx.lineWidth = 1;
  ctx.stroke(new Path2D(scentCodeContour(card.likes, 6).path));
  ctx.strokeStyle = ink; ctx.lineWidth = 2.5;
  ctx.stroke(new Path2D(contour.path));
  contour.points.forEach(point => { ctx.beginPath(); ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI); ctx.fillStyle = ink; ctx.fill(); });
  ctx.restore();

  const { default: QRCodeStyling } = await import("qr-code-styling");
  const qr = new QRCodeStyling({
    width: 240, height: 240, type: "canvas", data: card.url, margin: 34,
    dotsOptions: { color: ink, type: "square" },
    cornersSquareOptions: { color: ink, type: "square" },
    cornersDotOptions: { color: ink, type: "square" },
    backgroundOptions: { color: "transparent" }, qrOptions: { errorCorrectionLevel: "H" },
  });
  const qrBlob = await qr.getRawData("png");
  if (!(qrBlob instanceof Blob)) throw new Error("QR unavailable");
  const image = new Image();
  const imageUrl = URL.createObjectURL(qrBlob);
  try {
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = reject; image.src = imageUrl; });
    const qrInset = (SCENT_CODE_VIEWBOX - SCENT_CODE_QR) * codeScale / 2;
    ctx.drawImage(image, codeX + qrInset, codeY + qrInset, SCENT_CODE_QR * codeScale, SCENT_CODE_QR * codeScale);
  } finally { URL.revokeObjectURL(imageUrl); }
  ctx.fillStyle = ink; ctx.font = '24px Arial, sans-serif';
  ctx.textAlign = "center"; ctx.fillText(card.qrLabel, codeX + codeSize / 2, 1380); ctx.textAlign = "left";
  ctx.fillStyle = muted; ctx.font = '24px Arial, sans-serif';
  wrappedText(ctx, card.status, 80, 1110, 540, 35, 5);
  ctx.font = '20px Arial, sans-serif';
  ctx.fillText(card.sample, 80, 1372);
  ctx.textAlign = "right"; ctx.fillText("yatlifestyle.com", 1000, 1418);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("PNG unavailable")), "image/png"));
}

export function downloadCard(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename;
  document.body.append(anchor); anchor.click(); anchor.remove();
  // Keep the URL alive long enough for Safari to start the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

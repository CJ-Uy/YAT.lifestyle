"use client";

import { useEffect, useId, useRef, type FormEvent, type RefObject } from "react";
import type { Locale } from "../../site-header";
import { ElementSignature } from "../element-signature";
import { deliveryComplete, type DeliveryState } from "./delivery-state";
import "./delivery-preview.css";

export const deliveryCopy = {
  en: {
    step: "Delivery preview", continueDelivery: "Continue to delivery preview", title: "Your Element, to your door.",
    lead: "Preview a 50 ml bottle and its Hong Kong delivery details.",
    notice: "Delivery preview · No parcel is sent in this demo.",
    bottle: "Your bottle", formula: "Your selected base, with the refinement shown in your result.",
    addressTitle: "Hong Kong address", example: "Use example address", exampleNote: "The example is fictional. You can edit it below.",
    recipient: "Recipient", address: "Street / building address", extra: "Additional details (optional)", area: "Area", countryLabel: "Region", country: "Hong Kong",
    recipientExample: "Example Recipient", addressExample: "Unit 3, Example House, 12 Example Street", choose: "Choose an area", island: "Hong Kong Island", kowloon: "Kowloon", territories: "New Territories",
    gate: "Add a recipient, address and Hong Kong area to continue.", ready: "Ready to preview. These details stay in this demo session.", submit: "Confirm delivery preview",
    confirmedTitle: "Your delivery preview is ready.", confirmedLead: "A 50 ml bottle of your Element, addressed as shown below.",
    timing: "Estimated delivery", estimate: "About one week within Hong Kong", estimateNote: "This is an illustrative delivery estimate for the preview.",
    addressSummary: "Preview address", edit: "Edit address", return: "Back to Element",
  },
  "zh-Hant": {
    step: "配送預覽", continueDelivery: "繼續查看配送預覽", title: "把你的 Element 帶回家。",
    lead: "預覽一瓶 50 ml 香水及其香港配送資料。",
    notice: "配送預覽 · 本示範不會寄出包裹。",
    bottle: "你的香水", formula: "以你選擇的基底，配合結果中顯示的微調。",
    addressTitle: "香港地址", example: "使用示例地址", exampleNote: "此地址純屬虛構，你可在下方修改。",
    recipient: "收件人", address: "街道／大廈地址", extra: "補充資料（可選）", area: "地區", countryLabel: "配送範圍", country: "香港",
    recipientExample: "示例收件人", addressExample: "Example House 3 室，12 Example Street", choose: "選擇地區", island: "香港島", kowloon: "九龍", territories: "新界",
    gate: "填寫收件人、地址及香港地區後即可繼續。", ready: "可以查看預覽。資料只保留於本次示範工作階段。", submit: "確認配送預覽",
    confirmedTitle: "你的配送預覽已準備好。", confirmedLead: "一瓶 50 ml 的 Element，以下方資料作配送預覽。",
    timing: "預計配送時間", estimate: "香港範圍內約一星期", estimateNote: "此時間僅為配送預覽的示例估算。",
    addressSummary: "預覽地址", edit: "修改地址", return: "返回 Element",
  },
  "zh-Hans": {
    step: "配送预览", continueDelivery: "继续查看配送预览", title: "把你的 Element 带回家。",
    lead: "预览一瓶 50 ml 香水及其香港配送资料。",
    notice: "配送预览 · 本演示不会寄出包裹。",
    bottle: "你的香水", formula: "以你选择的基底，配合结果中显示的微调。",
    addressTitle: "香港地址", example: "使用示例地址", exampleNote: "此地址纯属虚构，你可在下方修改。",
    recipient: "收件人", address: "街道／大厦地址", extra: "补充资料（可选）", area: "地区", countryLabel: "配送范围", country: "香港",
    recipientExample: "示例收件人", addressExample: "Example House 3 室，12 Example Street", choose: "选择地区", island: "香港岛", kowloon: "九龙", territories: "新界",
    gate: "填写收件人、地址及香港地区后即可继续。", ready: "可以查看预览。资料只保留于本次演示会话。", submit: "确认配送预览",
    confirmedTitle: "你的配送预览已准备好。", confirmedLead: "一瓶 50 ml 的 Element，以下方资料作配送预览。",
    timing: "预计配送时间", estimate: "香港范围内约一星期", estimateNote: "此时间仅为配送预览的示例估算。",
    addressSummary: "预览地址", edit: "修改地址", return: "返回 Element",
  },
} as const;

type Props = {
  locale: Locale;
  baseName: string;
  concentration: "EDT" | "EDP";
  value: DeliveryState;
  onChange: (value: DeliveryState) => void;
  heading: RefObject<HTMLHeadingElement | null>;
};

export default function DeliveryPreview({ locale, baseName, concentration, value, onChange, heading }: Props) {
  const c = deliveryCopy[locale];
  const uid = useId();
  const lastConfirmed = useRef(value.confirmed);
  const complete = deliveryComplete(value);
  const areaName = value.area === "hong-kong-island" ? c.island : value.area === "kowloon" ? c.kowloon : value.area === "new-territories" ? c.territories : "";
  useEffect(() => {
    if (lastConfirmed.current !== value.confirmed) {
      window.scrollTo(0, 0);
      heading.current?.focus({ preventScroll: true });
    }
    lastConfirmed.current = value.confirmed;
  }, [value.confirmed, heading]);
  const field = (key: "recipient" | "address" | "extra" | "area", text: string) => onChange({ ...value, [key]: text, confirmed: false });
  const example = () => onChange({ recipient: c.recipientExample, address: c.addressExample, extra: "", area: "kowloon", confirmed: false });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (complete && event.currentTarget.reportValidity()) onChange({ ...value, recipient: value.recipient.trim(), address: value.address.trim(), extra: value.extra.trim(), confirmed: true });
  };
  return <div className="delivery-preview">
    <h1 ref={heading} tabIndex={-1}>{value.confirmed ? c.confirmedTitle : c.title}</h1>
    <p className="demo-lead">{value.confirmed ? c.confirmedLead : c.lead}</p>
    <p className="delivery-notice" id={`${uid}-notice`}>{c.notice}</p>
    <section className="delivery-product" aria-label={c.bottle}>
      <ElementSignature compact />
      <div><p className="delivery-volume">50 ml · {concentration}</p><h2>{baseName}</h2><p>{c.formula}</p></div>
    </section>
    {value.confirmed ? <>
      <div className="delivery-estimate" role="status"><p>{c.timing}</p><strong>{c.estimate}</strong><small>{c.estimateNote}</small></div>
      <section className="delivery-address-summary" aria-label={c.addressSummary}>
        <h2>{c.addressSummary}</h2><address>{[value.recipient, value.address, value.extra, areaName, c.country].filter(Boolean).map((line, i) => <span key={i}>{line}</span>)}</address>
      </section>
      <div className="delivery-final-actions"><button type="button" onClick={() => onChange({ ...value, confirmed: false })}>{c.edit}</button><a href="/element">{c.return}</a></div>
    </> : <form onSubmit={submit} aria-describedby={`${uid}-notice`}>
      <div className="delivery-form-heading"><h2>{c.addressTitle}</h2><button type="button" onClick={example}>{c.example}</button></div>
      <p className="delivery-example-note">{c.exampleNote}</p>
      <div className="delivery-fields">
        <label>{c.recipient}<input name="recipient" autoComplete="off" required maxLength={80} value={value.recipient} placeholder={c.recipientExample} onChange={e => field("recipient", e.target.value)} /></label>
        <label>{c.address}<input name="address" autoComplete="off" required maxLength={180} value={value.address} placeholder={c.addressExample} onChange={e => field("address", e.target.value)} /></label>
        <label>{c.extra}<input name="extra" autoComplete="off" maxLength={100} value={value.extra} onChange={e => field("extra", e.target.value)} /></label>
        <label>{c.area}<select name="area" required value={value.area} onChange={e => field("area", e.target.value)}><option value="">{c.choose}</option><option value="hong-kong-island">{c.island}</option><option value="kowloon">{c.kowloon}</option><option value="new-territories">{c.territories}</option></select></label>
        <p className="delivery-region"><span>{c.countryLabel}</span><strong>{c.country}</strong></p>
      </div>
      <p className="delivery-gate" id={`${uid}-gate`} role="status">{complete ? c.ready : c.gate}</p>
      <button className="delivery-submit" type="submit" disabled={!complete} aria-describedby={`${uid}-gate`}>{c.submit}</button>
    </form>}
  </div>;
}

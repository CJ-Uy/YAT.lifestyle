"use client";

import { useEffect, useState } from "react";

type Stock = { ready: boolean; closed: boolean; soldOut: string[] };
let pending: Promise<Stock> | null = null;

// One request per page load, shared by every card and button.
// ponytail: an unreachable stock endpoint shows everything as available; checkout still refuses sold-out scents server-side.
function loadStock() {
  pending ??= fetch("/api/commerce/stock", { cache: "no-store" })
    .then((response): Promise<{ closed?: unknown; soldOut?: unknown }> | object => response.ok ? response.json() : {})
    .then((data: { closed?: unknown; soldOut?: unknown }) => ({ ready: true, closed: data.closed === true, soldOut: Array.isArray(data.soldOut) ? data.soldOut.filter((slug): slug is string => typeof slug === "string") : [] }))
    .catch(() => ({ ready: true, closed: false, soldOut: [] }));
  return pending;
}

export function useStock() {
  const [stock, setStock] = useState<Stock>({ ready: false, closed: false, soldOut: [] });
  useEffect(() => {
    let live = true;
    void loadStock().then((value) => { if (live) setStock(value); });
    return () => { live = false; };
  }, []);
  return { ...stock, isSoldOut: (slug: string) => stock.closed || stock.soldOut.includes(slug) };
}

export const SOLD_OUT_COPY = {
  en: { soldOut: "Sold out", closed: "The shop is closed for now. Checkout will reopen soon.", remove: "Some scents in your cart are sold out. Remove them to check out." },
  "zh-Hant": { soldOut: "售罄", closed: "商店暫時休息，結帳稍後重開。", remove: "購物車內有香水已售罄，請移除後再結帳。" },
  "zh-Hans": { soldOut: "售罄", closed: "商店暂时休息，结账稍后重开。", remove: "购物车内有香水已售罄，请移除后再结账。" },
};

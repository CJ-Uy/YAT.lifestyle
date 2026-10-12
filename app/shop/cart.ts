"use client";

import { useEffect, useState } from "react";
import { cartSubtotal, MAX_BAG_COUNT, MAX_PER_SCENT, normalizeCart, productBySlug, type CartItem } from "../../lib/shop";

const STORAGE_KEY = "yat-bag-v1";
const CHANGE_EVENT = "yat-bag-change";
type CartState = { items: CartItem[]; ready: boolean; storageAvailable: boolean };
const initialState: CartState = { items: [], ready: false, storageAvailable: true };
let sharedState = initialState;

function readCart(): CartState {
  // A failed write leaves newer items in memory; older storage must not replace them.
  if (!sharedState.storageAvailable) return { ...sharedState, ready: true };
  let saved: string | null;
  try { saved = window.localStorage.getItem(STORAGE_KEY); }
  catch { return { ...sharedState, ready: true, storageAvailable: false }; }
  let items: CartItem[] = [];
  try { items = normalizeCart(saved ? JSON.parse(saved) : []); }
  catch { /* Ignore malformed saved bags until the next explicit action. */ }
  return { items, ready: true, storageAvailable: true };
}

function updateCart(change: (items: CartItem[]) => unknown) {
  const current = readCart();
  sharedState = { ...current, items: normalizeCart(change(current.items)) };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sharedState.items));
    sharedState.storageAvailable = true;
  } catch { sharedState.storageAvailable = false; }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function add(slug: string, quantity = 1) {
  if (!productBySlug(slug) || !Number.isSafeInteger(quantity) || quantity < 1) return;
  updateCart((items) => [...items, { slug, quantity }]);
}

function setQuantity(slug: string, quantity: number) {
  if (!productBySlug(slug) || !Number.isSafeInteger(quantity) || quantity < 0) return;
  updateCart((items) => {
    const count = items.reduce((total, item) => total + item.quantity, 0);
    return items.map((item) => item.slug === slug
      ? { slug, quantity: Math.min(quantity, MAX_PER_SCENT, MAX_BAG_COUNT - count + item.quantity) }
      : item);
  });
}

function remove(slug: string) {
  updateCart((items) => items.filter((item) => item.slug !== slug));
}

function clear() {
  updateCart(() => []);
}

export function useCart() {
  const [state, setState] = useState(initialState);
  useEffect(() => {
    const sync = () => setState(sharedState);
    const externalChange = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      sharedState = readCart();
      sync();
    };
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", externalChange);
    sharedState = readCart();
    sync();
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", externalChange);
    };
  }, []);
  return {
    ...state,
    add,
    setQuantity,
    remove,
    clear,
    count: state.items.reduce((total, item) => total + item.quantity, 0),
    subtotal: cartSubtotal(state.items),
  };
}

export const DELIVERY_AREAS = ["hong-kong-island", "kowloon", "new-territories"] as const;
export type DeliveryArea = (typeof DELIVERY_AREAS)[number];

export type DeliveryState = {
  recipient: string;
  address: string;
  extra: string;
  area: DeliveryArea | "";
  confirmed: boolean;
};

export const emptyDelivery: DeliveryState = { recipient: "", address: "", extra: "", area: "", confirmed: false };

export function deliveryComplete(value: DeliveryState): boolean {
  return value.recipient.trim().length > 0 && value.address.trim().length > 0 &&
    DELIVERY_AREAS.includes(value.area as DeliveryArea);
}

/** Old sessions have no delivery state; malformed state cannot restore a confirmation. */
export function normaliseDelivery(raw: unknown): DeliveryState {
  const value = raw && typeof raw === "object" ? raw as Partial<DeliveryState> : {};
  const state: DeliveryState = {
    recipient: typeof value.recipient === "string" ? value.recipient.slice(0, 80) : "",
    address: typeof value.address === "string" ? value.address.slice(0, 180) : "",
    extra: typeof value.extra === "string" ? value.extra.slice(0, 100) : "",
    area: DELIVERY_AREAS.includes(value.area as DeliveryArea) ? value.area as DeliveryArea : "",
    confirmed: false,
  };
  state.confirmed = value.confirmed === true && deliveryComplete(state);
  return state;
}

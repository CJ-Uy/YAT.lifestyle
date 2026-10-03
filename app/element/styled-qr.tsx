// TEMPORARY placeholder: Task 8 owns this file and ships the real styled QR. On merge, take Task 8's version.
export function StyledQr({ value, size = 160 }: { value: string; size?: number }) {
  return <div className="qr-stub" style={{ width: size, minHeight: size }} role="img" aria-label={value}>{value}</div>;
}
export default StyledQr;

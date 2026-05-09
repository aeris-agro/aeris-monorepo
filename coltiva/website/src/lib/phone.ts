/**
 * Phone normalization mirroring the backend.
 *
 * Accepts: +256700000001, 256700000001, 0700000001, 700000001
 * Returns: +256700000001 (or throws if invalid)
 */
export function normalizePhone(input: string): string {
  let v = input.trim().replace(/\s+/g, "").replace(/-/g, "");

  // +2560... → +256...
  if (v.startsWith("+2560")) v = "+256" + v.slice(5);

  // Bare 9-digit Ugandan starting with 7 → prepend +256
  if (/^7\d{8}$/.test(v)) v = "+256" + v;

  // 0... (10 digits) → +256...
  else if (/^07\d{8}$/.test(v)) v = "+256" + v.slice(1);

  // 256... (12 digits) → +256...
  else if (/^256\d{9}$/.test(v)) v = "+" + v;

  if (!v.startsWith("+")) {
    throw new Error("Phone must include country code (+256...)");
  }
  if (v.length < 10 || v.length > 16) {
    throw new Error("Phone number length is invalid");
  }
  return v;
}

/** Format a normalized E.164 number for display (+256 700 000 001) */
export function formatPhoneDisplay(phone: string): string {
  if (phone.startsWith("+256") && phone.length === 13) {
    return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7, 10)} ${phone.slice(10)}`;
  }
  return phone;
}

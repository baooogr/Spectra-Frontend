// Vietnamese phone number validation
// Supports: +84xxxxxxxxx, 0xxxxxxxxx (10-11 digits total)
const VN_PHONE_REGEX =
  /^(\+84|0)(3[2-9]|5[2689]|7[06-9]|8[0-689]|9[0-46-9])\d{7}$/;

export function isValidVNPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s.-]/g, "");
  return VN_PHONE_REGEX.test(cleaned);
}

export function formatPhoneDisplay(phone) {
  if (!phone) return "";
  const cleaned = phone.replace(/[\s.-]/g, "");
  if (cleaned.startsWith("+84")) {
    return cleaned;
  }
  if (cleaned.startsWith("0")) {
    return "+84" + cleaned.slice(1);
  }
  return cleaned;
}

// Fallback exchange rate (used when API is unavailable)
export const FALLBACK_EXCHANGE_RATE = 25400;

// Kept for backward compatibility — components should prefer useExchangeRate() hook
export const EXCHANGE_RATE = FALLBACK_EXCHANGE_RATE;

export const roundVND = (vndAmount) => {
  const value = Number(vndAmount) || 0;
  const step = 500;
  const remainder = value % step;

  if (remainder === 0) return Math.round(value);
  if (remainder < step / 2) return Math.floor(value / step) * step;
  return Math.ceil(value / step) * step;
};

export const formatVNDNumber = (vndAmount) => {
  const rounded = roundVND(vndAmount);
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(rounded);
};

export function formatPrice(n, rate) {
  const r = rate || FALLBACK_EXCHANGE_RATE;
  const usd = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n || 0);
  const rawVnd = (n || 0) * r;
  const vnd = formatVNDNumber(rawVnd);
  return `${usd}(${vnd} VND)`;
}

export function formatVND(usdAmount, rate) {
  const r = rate || FALLBACK_EXCHANGE_RATE;
  const rawVnd = (usdAmount || 0) * r;
  const rounded = roundVND(rawVnd);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    currencyDisplay: "code",
    minimumFractionDigits: 0,
  }).format(rounded);
}

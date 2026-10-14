const PHONE =
  /(?:\+?254|0)\s?[17]\d{1,2}[\s-]?\d{3}[\s-]?\d{3,4}|\b\d{3}[\s-]?\d{3}[\s-]?\d{3,4}\b/;
const EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const HANDLE = /(?:^|[\s(])@[A-Za-z0-9._]{1,30}\b/;
const LINK = /https?:\/\/|www\.|\b[\w-]+\.(com|co\.ke|org|net|io)\b/i;

const BLOCKLIST = [
  /\bescort\b/i,
  /\bsex\s*work\b/i,
  /\bcrypto\s*invest/i,
  /\bforex\b/i,
  /\bnude\b/i,
  /\bunder\s*18\b/i,
];

export function rejectIfContactLeak(text: string): {
  ok: boolean;
  reason?: string;
} {
  if (PHONE.test(text)) {
    return {
      ok: false,
      reason: "Remove phone numbers from your story. Contact stays private until unlock.",
    };
  }
  if (EMAIL.test(text)) {
    return {
      ok: false,
      reason: "Remove email addresses from your story. Contact stays private until unlock.",
    };
  }
  if (HANDLE.test(text)) {
    return {
      ok: false,
      reason: "Remove Instagram handles from your story. Contact stays private until unlock.",
    };
  }
  if (LINK.test(text)) {
    return {
      ok: false,
      reason: "Remove links from your story. Contact stays private until unlock.",
    };
  }
  for (const re of BLOCKLIST) {
    if (re.test(text)) {
      return {
        ok: false,
        reason: "That wording is not allowed. Please rewrite without solicitation or scams.",
      };
    }
  }
  return { ok: true };
}

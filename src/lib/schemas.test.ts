import { describe, expect, it } from "vitest";
import { phoneSchema } from "./schemas";
import { rejectIfContactLeak } from "./moderation";

describe("phoneSchema", () => {
  it.each([
    ["0712345678", "0712345678"],
    ["+254 712 345 678", "+254712345678"],
    ["+44 7700 900123", "+447700900123"],
    ["+1 (415) 555-0132", "+14155550132"],
  ])("accepts %s", (input, saved) => {
    expect(phoneSchema.parse(input)).toBe(saved);
  });

  it.each(["12345", "call me", "+1234567890123456"])("rejects %s", (input) => {
    expect(phoneSchema.safeParse(input).success).toBe(false);
  });
});

describe("rejectIfContactLeak", () => {
  it("catches international numbers in a story", () => {
    expect(rejectIfContactLeak("Text me on +44 7700 900123").ok).toBe(false);
  });

  it("lets ordinary numbers through", () => {
    expect(rejectIfContactLeak("I'm 29 and run 5k on Sundays").ok).toBe(true);
  });
});

import { z } from "zod";

export const kindSchema = z.enum(["love", "friend"]);
export const profileStatusSchema = z.enum([
  "pending_review",
  "live",
  "paused",
  "found",
  "rejected",
  "removed",
]);
export const requestStatusSchema = z.enum(["pending", "approved", "rejected"]);

export const handleSchema = z
  .string()
  .trim()
  .regex(/^@?[A-Za-z0-9._]{1,30}$/, "Use a valid Instagram handle");

export const kenyanPhoneSchema = z
  .string()
  .trim()
  .regex(
    /^(\+?254|0)[17]\d{8}$/,
    "Use a Kenyan phone like 07XX XXX XXX or +2547XX XXX XXX",
  );

export const mpesaCodeSchema = z
  .string()
  .trim()
  .transform((s) => s.toUpperCase().replace(/\s+/g, ""))
  .pipe(
    z
      .string()
      .regex(/^[A-Z0-9]{8,12}$/, "M-Pesa code is 8 to 12 letters or numbers"),
  );

export const listingInputSchema = z
  .object({
    kind: kindSchema,
    alias: z.string().trim().min(2).max(20),
    age: z.number().int().min(18).max(99),
    gender: z.string().trim().min(1).max(40),
    area: z.string().trim().min(2).max(40),
    seekMin: z.number().int().min(18).max(99).optional(),
    seekMax: z.number().int().min(18).max(99).optional(),
    headline: z.string().trim().min(8).max(90),
    seek: z.string().trim().min(8).max(160),
    body: z.string().trim().min(40).max(2500),
    tags: z.array(z.string().trim().min(1).max(24)).max(6),
    instagram: handleSchema,
    phone: kenyanPhoneSchema,
    payerPhone: kenyanPhoneSchema,
    mpesaCode: mpesaCodeSchema,
    realName: z.string().trim().max(80).optional(),
  })
  .refine(
    (d) =>
      d.seekMin == null || d.seekMax == null || d.seekMin <= d.seekMax,
    { message: "Age range must go from lower to higher", path: ["seekMax"] },
  );

export const unlockInputSchema = z.object({
  code: z.string().trim().min(1),
  handle: handleSchema,
  payerPhone: kenyanPhoneSchema,
  mpesaCode: mpesaCodeSchema,
});

export const searchQuerySchema = z.object({
  q: z.string().optional(),
  kind: z.enum(["love", "friend", "all"]).optional(),
  band: z.string().optional(),
  myAge: z.number().int().min(18).max(99).optional(),
  cursor: z.string().optional(),
  includeHidden: z.boolean().optional(),
});

export const settingsSchema = z.object({
  listingFee: z.number().int().positive(),
  unlockFee: z.number().int().positive(),
  tillNumber: z.string().min(1),
  responseTimeText: z.string().min(1),
  dmTemplate: z.string().min(1),
});

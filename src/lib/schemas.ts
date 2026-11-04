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

/**
 * Any phone number: optional + and country code, 7 to 15 digits (the E.164 limit).
 * Spaces, dashes, dots and brackets are allowed while typing and stripped on save.
 */
export const phoneSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s\-().]/g, ""))
  .pipe(
    z
      .string()
      .regex(
        /^\+?\d{7,15}$/,
        "Enter a valid phone number. Add your country code if you're outside Kenya, e.g. +44 7700 900123",
      ),
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
    phone: phoneSchema,
    payerPhone: phoneSchema,
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
  payerPhone: phoneSchema,
  mpesaCode: mpesaCodeSchema,
  note: z
    .string()
    .trim()
    .max(280, "Keep your note under 280 characters")
    .optional()
    .transform((s) => (s ? s : undefined)),
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

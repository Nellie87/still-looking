import type { RequestStatus } from "@/lib/data/repo";

export interface MockPayment {
  id: string;
  purpose: "listing" | "unlock";
  profileCode: string;
  amountKes: number;
  mpesaCode: string;
  payerPhone: string;
  requesterToken?: string;
  requesterHandle?: string;
  status: RequestStatus;
  rejectReason?: string;
  reviewedAt?: string;
  releasedAt?: string;
  dmSentAt?: string;
  createdAt: string;
}

/** Sample admin queue — invented M-Pesa codes only. */
export const MOCK_PAYMENTS: MockPayment[] = [
  {
    id: "pay-demo-1",
    purpose: "unlock",
    profileCode: "SL-0101",
    amountKes: 500,
    mpesaCode: "DEMOCODE01",
    payerPhone: "0712345678",
    requesterToken: "seed-visitor",
    requesterHandle: "@demo_browser",
    status: "pending",
    createdAt: "2026-10-12T09:30:00.000Z",
  },
  {
    id: "pay-demo-2",
    purpose: "listing",
    profileCode: "SL-0112",
    amountKes: 800,
    mpesaCode: "DEMOCODE02",
    payerPhone: "0722000000",
    requesterToken: "seed-lister",
    status: "pending",
    createdAt: "2026-10-13T11:00:00.000Z",
  },
];

export const DEFAULT_SETTINGS = {
  listingFee: 800,
  unlockFee: 500,
  tillNumber: "000000",
  responseTimeText: "Usually within a few hours (sample)",
  dmTemplate: `Hi {handle}, thanks for your payment. Here is the contact for {code} ({alias}):
{instagram} · {phone}. Please be kind and respectful, meet in a public place,
and tell a friend where you're going. Still Looking`,
};

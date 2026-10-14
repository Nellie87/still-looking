export type Kind = "love" | "friend";
export type ProfileStatus =
  | "pending_review"
  | "live"
  | "paused"
  | "found"
  | "rejected"
  | "removed";
export type RequestStatus = "pending" | "approved" | "rejected";

export interface PublicProfile {
  code: string;
  kind: Kind;
  alias: string;
  age: number;
  gender: string;
  area: string;
  seekMin?: number;
  seekMax?: number;
  headline: string;
  seek: string;
  body: string[];
  tags: string[];
}

export interface Contact {
  instagram: string;
  phone: string;
  realName?: string;
}

export interface Settings {
  listingFee: number;
  unlockFee: number;
  tillNumber: string;
  responseTimeText: string;
  dmTemplate: string;
}

export interface SearchQuery {
  q?: string;
  kind?: Kind | "all";
  band?: string;
  myAge?: number;
  cursor?: string;
  includeHidden?: boolean;
}

export interface ListingInput {
  kind: Kind;
  alias: string;
  age: number;
  gender: string;
  area: string;
  seekMin?: number;
  seekMax?: number;
  headline: string;
  seek: string;
  body: string;
  tags: string[];
  instagram: string;
  phone: string;
  payerPhone: string;
  mpesaCode: string;
  realName?: string;
}

export interface UnlockInput {
  code: string;
  handle: string;
  payerPhone: string;
  mpesaCode: string;
}

export interface ActivityItem {
  id: string;
  code: string;
  alias: string;
  kind: Kind;
  status: RequestStatus | ProfileStatus;
  purpose: "listing" | "unlock";
  rejectReason?: string;
  headline: string;
}

export interface MyActivity {
  unlocks: ActivityItem[];
  listings: ActivityItem[];
  pendingCount: number;
}

export interface AdminStats {
  revenue14d: number;
  toReview: number;
  liveProfiles: number;
  contactsUnlocked: number;
  revenueByDay: { day: string; total: number }[];
}

export interface QueueItem {
  id: string;
  purpose: "listing" | "unlock";
  status: RequestStatus;
  amountKes: number;
  mpesaCode: string;
  payerPhoneMasked: string;
  createdAt: string;
  requesterHandle?: string;
  profile: PublicProfile;
  privateContact: Contact;
  rejectReason?: string;
  dmSentAt?: string;
  releasedAt?: string;
}

export interface AdminProfile extends PublicProfile {
  status: ProfileStatus;
  privateContact: Contact;
}

export interface QueueFilter {
  status?: RequestStatus | "all";
  purpose?: "listing" | "unlock" | "all";
  q?: string;
}

export interface Repo {
  searchProfiles(
    q: SearchQuery,
  ): Promise<{ items: PublicProfile[]; total: number; nextCursor?: string }>;
  getProfile(code: string): Promise<PublicProfile | null>;
  submitListing(input: ListingInput): Promise<{ code: string }>;
  submitUnlock(input: UnlockInput): Promise<{ paymentId: string }>;
  getMyActivity(): Promise<MyActivity>;
  getMyContact(code: string): Promise<Contact | null>;
  getUnlockStatus(
    code: string,
  ): Promise<{ status: RequestStatus | "none"; rejectReason?: string }>;
  adminStats(): Promise<AdminStats>;
  adminQueue(f: QueueFilter): Promise<QueueItem[]>;
  approvePayment(id: string): Promise<void>;
  rejectPayment(id: string, reason: string): Promise<void>;
  markDmSent(id: string): Promise<void>;
  adminProfiles(): Promise<AdminProfile[]>;
  setProfileStatus(code: string, s: ProfileStatus): Promise<void>;
  getSettings(): Promise<Settings>;
  updateSettings(s: Partial<Settings>): Promise<void>;
  getAdminContact(code: string): Promise<Contact | null>;
}

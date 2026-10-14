import { ageFromBirthYear, birthYearFromAge } from "@/lib/age";
import { formatProfileCode, maskPhone, normalizeMpesaCode } from "@/lib/codes";
import { rejectIfContactLeak } from "@/lib/moderation";
import { filterProfiles } from "@/lib/search";
import { listingInputSchema, unlockInputSchema } from "@/lib/schemas";
import { DEFAULT_SETTINGS, MOCK_PAYMENTS, type MockPayment } from "@/mocks/queue";
import { MOCK_PROFILES, type MockProfile } from "@/mocks/profiles";
import type {
  AdminProfile,
  AdminStats,
  Contact,
  ListingInput,
  MyActivity,
  ProfileStatus,
  PublicProfile,
  QueueFilter,
  QueueItem,
  Repo,
  SearchQuery,
  Settings,
  UnlockInput,
} from "./repo";

const TOKEN_KEY = "sl-visitor-token";
const STATE_KEY = "sl-mock-state";

type Persisted = {
  profiles: MockProfile[];
  payments: MockPayment[];
  settings: Settings;
  nextCode: number;
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function getToken(): string {
  if (typeof window === "undefined") return "ssr";
  let t = localStorage.getItem(TOKEN_KEY);
  if (!t) {
    t = uid("visitor");
    localStorage.setItem(TOKEN_KEY, t);
  }
  return t;
}

function seed(): Persisted {
  const pendingListing: MockProfile = {
    code: "SL-0112",
    kind: "love",
    alias: "Thorn",
    birthYear: 1993,
    gender: "Woman",
    area: "Kilimani",
    seekMin: 28,
    seekMax: 38,
    headline: "New listing waiting for the team to review",
    seek: "Looking for someone calm who likes weekend markets.",
    body: [
      "This is a sample pending listing so the admin queue has something to approve. Invented data only.",
    ],
    tags: ["markets", "calm"],
    status: "pending_review",
    private: {
      instagram: "@demo_contact_112",
      phone: "+254700000112",
    },
  };

  return {
    profiles: [...MOCK_PROFILES.map((p) => ({ ...p, private: { ...p.private } })), pendingListing],
    payments: MOCK_PAYMENTS.map((p) => ({ ...p })),
    settings: { ...DEFAULT_SETTINGS },
    nextCode: 113,
  };
}

function load(): Persisted {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(STATE_KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as Persisted;
  } catch {
    return seed();
  }
}

function save(state: Persisted) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function toPublic(p: MockProfile): PublicProfile {
  return {
    code: p.code,
    kind: p.kind,
    alias: p.alias,
    age: ageFromBirthYear(p.birthYear),
    gender: p.gender,
    area: p.area,
    seekMin: p.seekMin,
    seekMax: p.seekMax,
    headline: p.headline,
    seek: p.seek,
    body: p.body,
    tags: p.tags,
  };
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

class MockRepo implements Repo {
  private state = load();

  private refresh() {
    this.state = load();
  }

  private persist() {
    save(this.state);
  }

  async searchProfiles(q: SearchQuery) {
    this.refresh();
    const live = this.state.profiles
      .filter((p) => p.status === "live")
      .map(toPublic);
    const items = filterProfiles(live, q);
    return { items, total: items.length };
  }

  async getProfile(code: string) {
    this.refresh();
    const p = this.state.profiles.find(
      (x) => x.code === code && (x.status === "live" || x.status === "paused"),
    );
    return p && p.status === "live" ? toPublic(p) : p ? toPublic(p) : null;
  }

  async submitListing(input: ListingInput) {
    this.refresh();
    const parsed = listingInputSchema.parse(input);
    for (const field of [parsed.headline, parsed.seek, parsed.body]) {
      const check = rejectIfContactLeak(field);
      if (!check.ok) throw new Error(check.reason);
    }
    const code = normalizeMpesaCode(parsed.mpesaCode);
    if (this.state.payments.some((p) => p.mpesaCode === code)) {
      throw new Error("That M-Pesa code was already used. Enter a different confirmation code.");
    }
    const profileCode = formatProfileCode(this.state.nextCode++);
    const profile: MockProfile = {
      code: profileCode,
      kind: parsed.kind,
      alias: parsed.alias,
      birthYear: birthYearFromAge(parsed.age),
      gender: parsed.gender,
      area: parsed.area,
      seekMin: parsed.seekMin,
      seekMax: parsed.seekMax,
      headline: parsed.headline,
      seek: parsed.seek,
      body: parsed.body.split(/\n+/).map((s) => s.trim()).filter(Boolean),
      tags: parsed.tags,
      status: "pending_review",
      private: {
        instagram: parsed.instagram.startsWith("@")
          ? parsed.instagram
          : `@${parsed.instagram}`,
        phone: parsed.phone,
        realName: parsed.realName,
      },
    };
    this.state.profiles.push(profile);
    this.state.payments.push({
      id: uid("pay"),
      purpose: "listing",
      profileCode,
      amountKes: this.state.settings.listingFee,
      mpesaCode: code,
      payerPhone: parsed.payerPhone,
      requesterToken: getToken(),
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    this.persist();
    return { code: profileCode };
  }

  async submitUnlock(input: UnlockInput) {
    this.refresh();
    const parsed = unlockInputSchema.parse(input);
    const profile = this.state.profiles.find(
      (p) => p.code === parsed.code && p.status === "live",
    );
    if (!profile) throw new Error("That profile is not available.");
    const code = normalizeMpesaCode(parsed.mpesaCode);
    if (this.state.payments.some((p) => p.mpesaCode === code)) {
      throw new Error("That M-Pesa code was already used. Enter a different confirmation code.");
    }
    const token = getToken();
    const existing = this.state.payments.find(
      (p) =>
        p.purpose === "unlock" &&
        p.profileCode === parsed.code &&
        p.requesterToken === token &&
        p.status === "pending",
    );
    if (existing) {
      throw new Error("You already have a request pending for this profile.");
    }
    const payment: MockPayment = {
      id: uid("pay"),
      purpose: "unlock",
      profileCode: parsed.code,
      amountKes: this.state.settings.unlockFee,
      mpesaCode: code,
      payerPhone: parsed.payerPhone,
      requesterToken: token,
      requesterHandle: parsed.handle.startsWith("@")
        ? parsed.handle
        : `@${parsed.handle}`,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    this.state.payments.push(payment);
    this.persist();
    return { paymentId: payment.id };
  }

  async getMyActivity(): Promise<MyActivity> {
    this.refresh();
    const token = getToken();
    const mine = this.state.payments.filter((p) => p.requesterToken === token);
    const unlocks = mine
      .filter((p) => p.purpose === "unlock")
      .map((p) => {
        const profile = this.state.profiles.find((x) => x.code === p.profileCode)!;
        return {
          id: p.id,
          code: p.profileCode,
          alias: profile?.alias ?? p.profileCode,
          kind: profile?.kind ?? ("love" as const),
          status: p.status,
          purpose: "unlock" as const,
          rejectReason: p.rejectReason,
          headline: profile?.headline ?? "",
        };
      });
    const listings = mine
      .filter((p) => p.purpose === "listing")
      .map((p) => {
        const profile = this.state.profiles.find((x) => x.code === p.profileCode);
        const status =
          p.status === "pending"
            ? ("pending_review" as const)
            : p.status === "rejected"
              ? ("rejected" as const)
              : (profile?.status ?? ("pending_review" as const));
        return {
          id: p.id,
          code: p.profileCode,
          alias: profile?.alias ?? p.profileCode,
          kind: profile?.kind ?? ("love" as const),
          status,
          purpose: "listing" as const,
          rejectReason: p.rejectReason,
          headline: profile?.headline ?? "",
        };
      });
    const pendingCount =
      unlocks.filter((u) => u.status === "pending").length +
      listings.filter((l) => l.status === "pending_review").length;
    return { unlocks, listings, pendingCount };
  }

  async getMyContact(code: string): Promise<Contact | null> {
    this.refresh();
    const token = getToken();
    const ok = this.state.payments.find(
      (p) =>
        p.purpose === "unlock" &&
        p.profileCode === code &&
        p.requesterToken === token &&
        p.status === "approved",
    );
    if (!ok) return null;
    const profile = this.state.profiles.find((p) => p.code === code);
    return profile ? { ...profile.private } : null;
  }

  async getUnlockStatus(code: string) {
    this.refresh();
    const token = getToken();
    const payments = this.state.payments
      .filter(
        (p) =>
          p.purpose === "unlock" &&
          p.profileCode === code &&
          p.requesterToken === token,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const latest = payments[0];
    if (!latest) return { status: "none" as const };
    return { status: latest.status, rejectReason: latest.rejectReason };
  }

  async adminStats(): Promise<AdminStats> {
    this.refresh();
    const approved = this.state.payments.filter((p) => p.status === "approved");
    const byDay = new Map<string, number>();
    for (let i = 13; i >= 0; i--) byDay.set(daysAgo(i), 0);
    let revenue14d = 0;
    for (const p of approved) {
      const day = (p.reviewedAt ?? p.createdAt).slice(0, 10);
      if (byDay.has(day)) {
        byDay.set(day, (byDay.get(day) ?? 0) + p.amountKes);
        revenue14d += p.amountKes;
      }
    }
    return {
      revenue14d,
      toReview: this.state.payments.filter((p) => p.status === "pending").length,
      liveProfiles: this.state.profiles.filter((p) => p.status === "live").length,
      contactsUnlocked: approved.filter((p) => p.purpose === "unlock").length,
      revenueByDay: Array.from(byDay.entries()).map(([day, total]) => ({
        day,
        total,
      })),
    };
  }

  async adminQueue(f: QueueFilter): Promise<QueueItem[]> {
    this.refresh();
    return this.state.payments
      .filter((p) => {
        if (f.status && f.status !== "all" && p.status !== f.status) return false;
        if (f.purpose && f.purpose !== "all" && p.purpose !== f.purpose) return false;
        if (f.q?.trim()) {
          const profile = this.state.profiles.find((x) => x.code === p.profileCode);
          const hay = [
            p.mpesaCode,
            p.profileCode,
            p.requesterHandle ?? "",
            p.payerPhone,
            profile?.alias ?? "",
          ]
            .join(" ")
            .toLowerCase();
          const words = f.q.trim().toLowerCase().split(/\s+/);
          if (!words.every((w) => hay.includes(w))) return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((p) => {
        const profile = this.state.profiles.find((x) => x.code === p.profileCode);
        const pub = profile
          ? toPublic(profile)
          : {
              code: p.profileCode,
              kind: "love" as const,
              alias: "Unknown",
              age: 0,
              gender: "",
              area: "",
              headline: "",
              seek: "",
              body: [],
              tags: [],
            };
        return {
          id: p.id,
          purpose: p.purpose,
          status: p.status,
          amountKes: p.amountKes,
          mpesaCode: p.mpesaCode,
          payerPhoneMasked: maskPhone(p.payerPhone),
          createdAt: p.createdAt,
          requesterHandle: p.requesterHandle,
          profile: pub,
          privateContact: profile
            ? { ...profile.private }
            : { instagram: "", phone: "" },
          rejectReason: p.rejectReason,
          dmSentAt: p.dmSentAt,
          releasedAt: p.releasedAt,
        };
      });
  }

  async approvePayment(id: string) {
    this.refresh();
    const p = this.state.payments.find((x) => x.id === id);
    if (!p || p.status !== "pending") throw new Error("Payment not found.");
    p.status = "approved";
    p.reviewedAt = new Date().toISOString();
    if (p.purpose === "listing") {
      const profile = this.state.profiles.find((x) => x.code === p.profileCode);
      if (profile) {
        profile.status = "live";
        profile.publishedAt = new Date().toISOString();
      }
    } else {
      p.releasedAt = new Date().toISOString();
    }
    this.persist();
  }

  async rejectPayment(id: string, reason: string) {
    this.refresh();
    const p = this.state.payments.find((x) => x.id === id);
    if (!p || p.status !== "pending") throw new Error("Payment not found.");
    p.status = "rejected";
    p.rejectReason = reason.trim() || "Payment not found";
    p.reviewedAt = new Date().toISOString();
    if (p.purpose === "listing") {
      const profile = this.state.profiles.find((x) => x.code === p.profileCode);
      if (profile) profile.status = "rejected";
    }
    this.persist();
  }

  async markDmSent(id: string) {
    this.refresh();
    const p = this.state.payments.find((x) => x.id === id);
    if (!p || p.status !== "approved") throw new Error("Payment not ready.");
    p.dmSentAt = new Date().toISOString();
    this.persist();
  }

  async adminProfiles(): Promise<AdminProfile[]> {
    this.refresh();
    return this.state.profiles
      .filter((p) => !["rejected", "removed"].includes(p.status))
      .map((p) => ({
        ...toPublic(p),
        status: p.status,
        privateContact: { ...p.private },
      }));
  }

  async setProfileStatus(code: string, s: ProfileStatus) {
    this.refresh();
    const p = this.state.profiles.find((x) => x.code === code);
    if (!p) throw new Error("Profile not found.");
    p.status = s;
    this.persist();
  }

  async getSettings() {
    this.refresh();
    return { ...this.state.settings };
  }

  async updateSettings(partial: Partial<Settings>) {
    this.refresh();
    this.state.settings = { ...this.state.settings, ...partial };
    this.persist();
  }

  async getAdminContact(code: string) {
    this.refresh();
    const p = this.state.profiles.find((x) => x.code === code);
    return p ? { ...p.private } : null;
  }
}

export const mockRepo: Repo = new MockRepo();

/** Demo helper: reset local mock state */
export function resetMockState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STATE_KEY);
}

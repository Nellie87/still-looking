import type { Contact, Kind, ProfileStatus } from "@/lib/data/repo";

export interface MockProfile {
  code: string;
  kind: Kind;
  alias: string;
  birthYear: number;
  gender: string;
  area: string;
  seekMin?: number;
  seekMax?: number;
  headline: string;
  seek: string;
  body: string[];
  tags: string[];
  status: ProfileStatus;
  publishedAt?: string;
  private: Contact;
}

/** Invented sample profiles only — never real people. */
export const MOCK_PROFILES: MockProfile[] = [
  {
    code: "SL-0101",
    kind: "love",
    alias: "Sunbird",
    birthYear: 1994,
    gender: "Woman",
    area: "Kilimani",
    seekMin: 28,
    seekMax: 38,
    headline: "Soft evenings, strong opinions, and Sunday markets",
    seek: "Looking for a grounded partner who laughs easily and texting is not a sport.",
    body: [
      "I work in media, keep a small plant army, and escape to Naivasha when the city gets loud.",
      "I want someone kind, curious, and okay with slow mornings. Faith matters to me; pressure does not.",
    ],
    tags: ["faith", "markets", "plants", "film"],
    status: "live",
    publishedAt: "2026-09-20T10:00:00.000Z",
    private: {
      instagram: "@demo_contact_101",
      phone: "+254700000101",
      realName: "Demo One",
    },
  },
  {
    code: "SL-0102",
    kind: "friend",
    alias: "Baobab",
    birthYear: 1990,
    gender: "Man",
    area: "Westlands",
    seekMin: 25,
    seekMax: 45,
    headline: "Hikes, board games, and honest coffee chats",
    seek: "Looking for friends who show up — for trails, trivia nights, or just a long walk.",
    body: [
      "I moved back to Nairobi last year and rebuilt my circle from scratch. I cook for too many people and never mind leftovers.",
      "If you are into Ngong Hills or quiet bookshops, we will get along.",
    ],
    tags: ["hiking", "boards", "coffee"],
    status: "live",
    publishedAt: "2026-09-22T12:00:00.000Z",
    private: {
      instagram: "@demo_contact_102",
      phone: "+254700000102",
    },
  },
  {
    code: "SL-0103",
    kind: "love",
    alias: "Kite",
    birthYear: 1998,
    gender: "Woman",
    area: "Lavington",
    seekMin: 24,
    seekMax: 32,
    headline: "Design by day, vinyl and tacos by night",
    seek: "Someone warm, a little nerdy, and ready to try a new restaurant without overthinking it.",
    body: [
      "I design brand systems and collect mid-century chairs I cannot afford. I want a partner who listens and plans a little adventure now and then.",
    ],
    tags: ["design", "vinyl", "food"],
    status: "live",
    publishedAt: "2026-09-25T09:00:00.000Z",
    private: {
      instagram: "@demo_contact_103",
      phone: "+254700000103",
    },
  },
  {
    code: "SL-0104",
    kind: "friend",
    alias: "Acacia",
    birthYear: 1987,
    gender: "Woman",
    area: "Karen",
    seekMin: 30,
    seekMax: 50,
    headline: "Garden clubs, choir practice, and early bedtimes",
    seek: "Friends for weekend markets, plant swaps, and the occasional concert.",
    body: [
      "I run a small nursery and sing on Sundays. Looking for calm company — no drama, plenty of tea.",
    ],
    tags: ["garden", "choir", "tea"],
    status: "live",
    publishedAt: "2026-09-28T14:00:00.000Z",
    private: {
      instagram: "@demo_contact_104",
      phone: "+254700000104",
    },
  },
  {
    code: "SL-0105",
    kind: "love",
    alias: "Mango",
    birthYear: 1992,
    gender: "Man",
    area: "South B",
    seekMin: 26,
    seekMax: 36,
    headline: "Football Sundays and late-night chai",
    seek: "A partner who can argue about formations and still share the last mandazi.",
    body: [
      "I coach kids on Saturdays and work in logistics. Family is everything. Looking for someone steady who likes home as much as going out.",
    ],
    tags: ["football", "family", "chai"],
    status: "live",
    publishedAt: "2026-10-01T11:00:00.000Z",
    private: {
      instagram: "@demo_contact_105",
      phone: "+254700000105",
    },
  },
  {
    code: "SL-0106",
    kind: "friend",
    alias: "Twiga",
    birthYear: 1996,
    gender: "Non-binary",
    area: "Parklands",
    seekMin: 22,
    seekMax: 35,
    headline: "Gallery openings and terrible karaoke",
    seek: "Creative friends who do not mind awkward first hangs.",
    body: [
      "I work in arts admin and make zines on the side. Looking for people to see shows with and complain about parking afterwards.",
    ],
    tags: ["art", "karaoke", "zines"],
    status: "live",
    publishedAt: "2026-10-02T16:00:00.000Z",
    private: {
      instagram: "@demo_contact_106",
      phone: "+254700000106",
    },
  },
  {
    code: "SL-0107",
    kind: "love",
    alias: "Jacaranda",
    birthYear: 1989,
    gender: "Woman",
    area: "Riverside",
    seekMin: 32,
    seekMax: 42,
    headline: "Law by day, novels by night, dogs always",
    seek: "Looking for a thoughtful partner who likes long walks and shorter emails.",
    body: [
      "I have two rescue dogs and a towering stack of unread books. Want someone kind, ambitious in a quiet way, and okay with dog hair on everything.",
    ],
    tags: ["dogs", "books", "walks"],
    status: "live",
    publishedAt: "2026-10-04T08:00:00.000Z",
    private: {
      instagram: "@demo_contact_107",
      phone: "+254700000107",
    },
  },
  {
    code: "SL-0108",
    kind: "friend",
    alias: "Nile",
    birthYear: 1995,
    gender: "Man",
    area: "Ngong Road",
    seekMin: 24,
    seekMax: 40,
    headline: "Run club and soft launches for side projects",
    seek: "Accountability friends for training plans and shipping small ideas.",
    body: [
      "I run thrice a week and build tiny apps the rest of the time. Looking for people who celebrate small wins.",
    ],
    tags: ["running", "builders", "coffee"],
    status: "live",
    publishedAt: "2026-10-05T13:00:00.000Z",
    private: {
      instagram: "@demo_contact_108",
      phone: "+254700000108",
    },
  },
  {
    code: "SL-0109",
    kind: "love",
    alias: "Ember",
    birthYear: 1997,
    gender: "Woman",
    area: "Kilimani",
    seekMin: 25,
    seekMax: 33,
    headline: "Jazz playlists and street food crawls",
    seek: "Someone playful who can keep a conversation going past the first date.",
    body: [
      "I teach primary school and paint watercolours on weekends. Looking for warmth, humour, and shared plates.",
    ],
    tags: ["jazz", "food", "art"],
    status: "live",
    publishedAt: "2026-10-07T10:00:00.000Z",
    private: {
      instagram: "@demo_contact_109",
      phone: "+254700000109",
    },
  },
  {
    code: "SL-0110",
    kind: "friend",
    alias: "Cedar",
    birthYear: 1985,
    gender: "Man",
    area: "Westlands",
    seekMin: 35,
    seekMax: 55,
    headline: "Chess in the park and slow travel stories",
    seek: "Friends for afternoon chess, podcast recommendations, and the odd road trip.",
    body: [
      "I consult in finance and escape to the coast whenever I can. Prefer deep talks over loud rooms.",
    ],
    tags: ["chess", "travel", "podcasts"],
    status: "live",
    publishedAt: "2026-10-08T15:00:00.000Z",
    private: {
      instagram: "@demo_contact_110",
      phone: "+254700000110",
    },
  },
  {
    code: "SL-0111",
    kind: "love",
    alias: "Dhow",
    birthYear: 1991,
    gender: "Man",
    area: "Lavington",
    seekMin: 27,
    seekMax: 37,
    headline: "Coastal roots, city life, quiet ambition",
    seek: "A partner who values family, Friday prayers, and trying a new recipe together.",
    body: [
      "I work in hospitality and miss the ocean every week. Looking for someone grounded, funny, and ready to build a calm home.",
    ],
    tags: ["faith", "food", "coast"],
    status: "live",
    publishedAt: "2026-10-10T09:00:00.000Z",
    private: {
      instagram: "@demo_contact_111",
      phone: "+254700000111",
    },
  },
];

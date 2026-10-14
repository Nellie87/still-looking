import { mockRepo } from "./mockRepo";
import type { Repo } from "./repo";

/** Phase A: always the mock. Screens import getRepo() only — never mockRepo. */
export function getRepo(): Repo {
  return mockRepo;
}

export type * from "./repo";

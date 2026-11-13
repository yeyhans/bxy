/**
 * History-i-guess videos to expose in the Studio. Each entry becomes the composition
 * `history-<brand>-<story>`. The same story can be listed under several brands:
 * the studio master is shared, only the brand tag changes.
 *
 * Add an entry only after `pnpm history:sync <story>` copied its master and meta.
 * Example: { story: "coffee", brand: "bxy" }
 */
export type HistoryGuessEntry = { story: string; brand: string };

export const historyGuessStories: HistoryGuessEntry[] = [];

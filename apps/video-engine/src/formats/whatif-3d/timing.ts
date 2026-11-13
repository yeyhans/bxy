/** Shape of `timing.json` written by `studios/whatif-3d/kit/voice.py`. Times in seconds. */
export type WhatIfWord = { w: string; s: number; e: number };
export type WhatIfLine = { i: number; text: string; start: number; end: number; words: WhatIfWord[] };
export type WhatIfTiming = { voice_end: number; engine: string; voice: string; lines: WhatIfLine[] };

export type CaptionSegment = { text: string; from: number; to: number };

/** Same tail the kit uses: the video lasts one second past the last word. */
export const whatIfTotalSeconds = (timing: WhatIfTiming) => timing.voice_end + 1;

/** A chunk closes after this many words, */
const MAX_WORDS = 3;
/** or before it would exceed this many characters (one line at the caption size), */
const MAX_CHARS = 18;
/** or when the voice pauses at least this long (seconds). */
const LONG_GAP = 0.45;
/** After a long pause the chunk leaves this long after its last word. */
const LINGER = 0.25;

const cleanWord = (raw: string) => raw.replace(/[^\p{L}\p{N}'%-]/gu, "").replace(/^'+|'+$/g, "");
const endsClause = (raw: string) => /[.,;:?!…]["'»)]*$/.test(raw.trim());

/**
 * Short chunks of 1-3 words, so no caption is a lone article or preposition.
 * A chunk closes at a script line end, at punctuation, at a long pause, or when it is full.
 * It stays until the next chunk starts, unless a long pause follows.
 */
export const captionSegments = (timing: WhatIfTiming): CaptionSegment[] => {
  const total = whatIfTotalSeconds(timing);
  const chunks: { words: string[]; start: number; end: number }[] = [];
  let open: { words: string[]; start: number; end: number } | null = null;

  for (const line of timing.lines) {
    for (const word of line.words) {
      const text = cleanWord(word.w);
      if (!text) continue;

      // Spelled-out initials ("P K") stay together even past the word limit.
      const spelledPair = open !== null && text.length === 1 && open.words[open.words.length - 1].length === 1;
      const wouldOverflow =
        open !== null &&
        ((open.words.length >= MAX_WORDS && !spelledPair) ||
          open.words.join(" ").length + 1 + text.length > MAX_CHARS ||
          word.s - open.end >= LONG_GAP);
      if (open && wouldOverflow) {
        chunks.push(open);
        open = null;
      }

      if (open) {
        open.words.push(text);
        open.end = word.e;
      } else {
        open = { words: [text], start: word.s, end: word.e };
      }

      if (endsClause(word.w)) {
        chunks.push(open);
        open = null;
      }
    }
    if (open) {
      chunks.push(open);
      open = null;
    }
  }

  return chunks.map((chunk, index) => {
    const next = index + 1 < chunks.length ? chunks[index + 1].start : total;
    return {
      text: chunk.words.join(" "),
      from: index === 0 ? 0 : chunk.start,
      to: next - chunk.end < LONG_GAP ? next : chunk.end + LINGER,
    };
  });
};

export const activeCaption = (segments: CaptionSegment[], seconds: number) =>
  segments.find((segment) => seconds >= segment.from && seconds < segment.to);

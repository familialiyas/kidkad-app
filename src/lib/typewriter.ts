// Pure helpers for the dialogue typewriter effect. Content is authored as
// segments (plain conversational text vs. highlighted data values) so the
// revealed-so-far slice can preserve which characters belong to which style
// without re-parsing a rendered string.
export interface DialogueSegment {
  text: string;
  /** Data pulled from the order (date/time/venue/dress code) vs. surrounding chat text. */
  highlight?: boolean;
}

export function segmentsFullLength(segments: DialogueSegment[]): number {
  return segments.reduce((n, s) => n + s.text.length, 0);
}

export function sliceSegments(
  segments: DialogueSegment[],
  revealedCount: number
): { text: string; highlight: boolean }[] {
  let remaining = revealedCount;
  const result: { text: string; highlight: boolean }[] = [];
  for (const seg of segments) {
    if (remaining <= 0) break;
    const take = Math.min(seg.text.length, remaining);
    if (take > 0) result.push({ text: seg.text.slice(0, take), highlight: !!seg.highlight });
    remaining -= take;
  }
  return result;
}

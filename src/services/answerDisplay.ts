/** Presentation only: preserve stored/reviewed answers, source text and arithmetic. */
export function answerDisplayText(text: string): string {
  return text
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/(^|\s)\*([\p{L}][^*\n]*[\p{L}\p{N}.!?]|[\p{L}])\*(?=\s|[,.!?;:]|$)/gu, '$1$2')
    .replace(/^(\s*)\*\s+/gm, '$1- ');
}

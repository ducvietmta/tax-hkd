import library from '../data/documentLibrary.json';
import { foldText } from '../utils/text';

export interface LegalMarkdownHit {
  doc_id: string;
  code: string;
  section_id: string;
  section_title: string;
  score: number;
}

const STOP = new Set('la va cua cho co khong nhung cac mot nhu the nao thi duoc bi ma khi nay do de toi minh ban o tai voi tu den trong ve'.split(' '));
let index: Array<{doc_id:string;code:string;section_id:string;section_title:string;title:string;text:string}> | null = null;

function searchIndex() {
  if (index) return index;
  index = library.flatMap((doc) => doc.sections.map((section) => ({
    doc_id: doc.id,
    code: doc.code,
    section_id: section.id,
    section_title: section.title,
    title: foldText(`${doc.id} ${doc.code} ${doc.title} ${section.title}`),
    text: foldText(section.text),
  })));
  return index;
}

/**
 * Cross-document lookup over the local Markdown corpus. Hits are routing hints
 * only: the main retriever uses them to boost already-reviewed canonical cards;
 * raw Markdown never becomes a legal conclusion by itself.
 */
export function searchLegalMarkdown(query: string, limit = 6): LegalMarkdownHit[] {
  const folded = foldText(query);
  const terms = [...new Set(folded.split(' ').filter((term) => term.length >= 2 && !STOP.has(term)))];
  if (!terms.length) return [];
  const byDocument = new Map<string, LegalMarkdownHit>();
  for (const row of searchIndex()) {
    let score = row.title.includes(folded) && folded.length >= 5 ? 16 : 0;
    let matched = 0;
    for (const term of terms) {
      if (row.title.includes(term)) { score += 5; matched += 1; }
      else if (row.text.includes(term)) { score += 1; matched += 1; }
    }
    if (!score || matched < Math.max(1, Math.ceil(terms.length * 0.3))) continue;
    const hit = { doc_id: row.doc_id, code: row.code, section_id: row.section_id, section_title: row.section_title, score };
    const previous = byDocument.get(row.doc_id);
    if (!previous || hit.score > previous.score) byDocument.set(row.doc_id, hit);
  }
  return [...byDocument.values()].sort((a, b) => b.score - a.score || a.doc_id.localeCompare(b.doc_id)).slice(0, limit);
}

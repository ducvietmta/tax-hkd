/** Ignore retail terms when the user explicitly denies that activity. */
export function activeSectorText(question: string): string {
  return question.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\b(?:khong|ko|chua)\s+(?:co\s+)?(?:kinh doanh\s+)?(?:ban le|ban hang hoa|ban hang|tap hoa|phan phoi)(?:\s+(?:tap hoa|hang hoa))?\b/g, ' ')
    .replace(/\b(?:khong|ko)\s+(?:duoc\s+)?(?:doi|chuyen)\s+thanh\s+(?:nganh\s+)?(?:ban le|ban hang hoa|ban hang|tap hoa)\b/g, ' ');
}

export function hasActiveRetailActivity(question: string): boolean {
  return /\b(tap hoa|phan phoi|ban hang hoa|hang hoa|ban hang|ban le|shopee|ban online)\b/
    .test(activeSectorText(question));
}

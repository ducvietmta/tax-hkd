export interface PendingTopic {
  id: string;
  keywords: string[];
  keywordGroups?: string[][];
  disclaimer: string;
}

export const PENDING_TOPICS: PendingTopic[] = [
  {
    id: 'rental_business_threshold_split',
    keywords: ['cho thue', 'thue nha', 'cong', 'tach', 'gop', 'nguong', '1 ty'],
    keywordGroups: [
      ['cho thue', 'thue nha', 'thue mat bang', 'cho thue tai san'],
      ['cong', 'tach', 'gop', 'nguong', '1 ty', 'mot ty', 'vua', 'dong thoi', 'moi thu', 'ca phe', 'ban hang', 'tap hoa', 'kinh doanh khac'],
    ],
    disclaimer: 'Cách cộng/tách doanh thu cho thuê tài sản với doanh thu kinh doanh khác khi xét ngưỡng 1 tỷ hiện chưa có hướng dẫn chính thức rõ ràng trong tài liệu hệ thống.',
  },
];

export function matchPendingTopics(query: string): PendingTopic[] {
  const norm = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

  return PENDING_TOPICS.filter((topic) => {
    if (topic.keywordGroups && topic.keywordGroups.length > 0) {
      return topic.keywordGroups.every((group) => group.some((kw) => norm.includes(kw)));
    }
    return topic.keywords.every((kw) => norm.includes(kw));
  });
}

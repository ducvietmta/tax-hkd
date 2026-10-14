export interface PendingTopic {
  id: string;
  /** mỗi nhóm ít nhất 1 từ phải xuất hiện (AND giữa các nhóm) */
  groups: string[][];
  /** số nhóm tối thiểu phải match (mặc định = tất cả các nhóm) */
  minGroups?: number;
  disclaimer: string;
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

export const PENDING_TOPICS: PendingTopic[] = [
  {
    id: 'rental_business_threshold_split',
    groups: [
      ['cho thue', 'thue nha', 'thue tai san'],
      ['cong', 'gop', 'tach', 'rieng', 'chung', 'vua', 'ca phe', 'kinh doanh khac'],
      ['nguong', '1 ty', '1ty', 'moi thu', '600 trieu'],
    ],
    minGroups: 2,
    disclaimer:
      'Cách cộng/tách doanh thu cho thuê tài sản với doanh thu kinh doanh khác khi xét ngưỡng 1 tỷ ' +
      'hiện chưa có hướng dẫn chính thức rõ ràng trong tài liệu hệ thống.',
  },
];

/** Trả về các topic PENDING mà câu hỏi chạm tới. */
export function matchPendingTopics(message: string): PendingTopic[] {
  const f = ' ' + normalize(message) + ' ';
  return PENDING_TOPICS.filter((t) => {
    const matched = t.groups.filter((g) => g.some((k) => f.includes(k))).length;
    return matched >= (t.minGroups ?? t.groups.length);
  });
}

import { BookOpen, Calculator, History, MessageSquare } from 'lucide-react';

export type MobileSection = 'ask' | 'calculator' | 'library';

export function MobileNavigation({ active, onHistory }: { active: MobileSection | null; onHistory: () => void }) {
  const items = [
    { key: 'ask', href: '#ai-assistant', label: 'Hỏi AI', icon: MessageSquare },
    { key: 'calculator', href: '#tax-calculator', label: 'Tính thuế', icon: Calculator },
    { key: 'library', href: '#legal-base', label: 'Văn bản', icon: BookOpen },
  ] as const;
  return (
    <nav aria-label="Điều hướng trên điện thoại" className="mobile-bottom-nav md:hidden">
      {items.map(({ key, href, label, icon: Icon }) => (
        <a key={key} href={href} aria-current={active === key ? 'page' : undefined} className={active === key ? 'is-active' : ''}>
          <Icon aria-hidden="true" size={21} strokeWidth={active === key ? 2.5 : 1.8} />
          <span>{label}</span>
        </a>
      ))}
      <button type="button" onClick={onHistory}>
        <History aria-hidden="true" size={21} strokeWidth={1.8} /><span>Lịch sử</span>
      </button>
    </nav>
  );
}

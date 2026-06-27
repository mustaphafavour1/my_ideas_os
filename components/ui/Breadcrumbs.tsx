import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-[10px] font-mono">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-[#252540]">/</span>}
          {item.href ? (
            <Link href={item.href} className="text-[#3A3A55] hover:text-[#6A6A80] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[#5E5E7A]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

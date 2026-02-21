'use client';

import React, { useEffect, useMemo, useState } from 'react';

interface TocItem {
  id: string;
  title: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\t\n\r]+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-');
}

interface ArticleTocProps {
  onItemClick?: () => void;
}

export default function ArticleToc({ onItemClick }: ArticleTocProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const headingElsRef = React.useRef<HTMLElement[]>([]);

  useEffect(() => {
    const contentEl = document.querySelector('.article-content');
    if (!contentEl) return;

    const collectHeadings = () => {
      const headingEls = Array.from(
        contentEl.querySelectorAll('h3')
      ) as HTMLElement[];

      const newItems: TocItem[] = headingEls.map((el) => {
        if (!el.id) {
          const derivedId = slugify(el.textContent || '');
          if (derivedId) el.id = derivedId;
        }
        return {
          id: el.id,
          title: (el.textContent || '').trim(),
          level: 3,
        };
      });

      headingElsRef.current = headingEls;
      setItems(newItems.filter((i) => i.id && i.title));
    };

    // Initial collection and watch for content changes
    const initTimer = setTimeout(collectHeadings, 50);
    const mo = new MutationObserver(() => collectHeadings());
    mo.observe(contentEl, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Scroll spy (fallback alongside IntersectionObserver)
    const TOP_OFFSET_PX = 136;
    const onScroll = () => {
      const headings = headingElsRef.current;
      if (!headings || headings.length === 0) return;
      const scrollY = window.scrollY + TOP_OFFSET_PX + 1;
      let currentId = headings[0].id;
      for (const h of headings) {
        const top = h.getBoundingClientRect().top + window.scrollY;
        if (top <= scrollY) currentId = h.id;
        else break;
      }
      setActiveId(currentId);
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // IntersectionObserver for precise activation
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).id;
            if (id) setActiveId(id);
          }
        });
      },
      {
        rootMargin: `-${TOP_OFFSET_PX}px 0px -70% 0px`,
        threshold: 0.1,
      }
    );

    const attachObserver = () => {
      observer.disconnect();
      headingElsRef.current.forEach((el) => observer.observe(el));
      onScroll();
    };
    const attachTimer = setTimeout(attachObserver, 100);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(attachTimer);
      observer.disconnect();
      mo.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const grouped = useMemo(() => items, [items]);

  const scrollTo = (id: string) => {
    // Call the callback immediately when clicked
    onItemClick?.();

    const el = document.getElementById(id);
    if (el) {
      const TOP_OFFSET_PX = 136;
      const y = el.getBoundingClientRect().top + window.scrollY - TOP_OFFSET_PX;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveId(id);
    }
  };

  if (grouped.length === 0) return null;

  return (
    <nav className="space-y-1">
      {grouped.map((item) => (
        <button
          key={item.id}
          onClick={() => scrollTo(item.id)}
          aria-current={activeId === item.id ? 'true' : undefined}
          className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${activeId === item.id ? 'text-white' : 'text-white/70 hover:text-white'}`}
        >
          {item.title}
        </button>
      ))}
    </nav>
  );
}

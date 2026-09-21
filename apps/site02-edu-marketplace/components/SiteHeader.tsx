"use client";

import Link from "next/link";

const nav = [
  { href: "/courses", label: "Каталог" },
  { href: "/cart", label: "Корзина" },
  { href: "/login", label: "Войти" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[var(--color-bg)]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-heading text-lg italic">
          Курсы Path
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-[var(--color-primary)]">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

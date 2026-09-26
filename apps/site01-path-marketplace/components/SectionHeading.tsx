"use client";

import { useT, type MessageKey } from "@/lib/i18n";
import Link from "next/link";
import type { ReactNode } from "react";

export interface SectionHeadingProps {
  eyebrow?: MessageKey;
  title?: MessageKey;
  // Raw title (e.g. a character or collection name) used instead of `title`.
  titleText?: string;
  viewAllHref?: string;
  as?: "h1" | "h2";
  tone?: "light" | "dark";
  children?: ReactNode;
}

// Pink-dot eyebrow + heavy Fraunces title + optional "View All →" link — the
// header used by every home section and catalog page.
export function SectionHeading({
  eyebrow,
  title,
  titleText,
  viewAllHref,
  as: Heading = "h2",
  tone = "light",
  children,
}: SectionHeadingProps) {
  const { t } = useT();

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className={`eyebrow flex items-center gap-2 ${tone === "dark" ? "text-pink" : "text-black/50"}`}>
            <span className="inline-block h-2 w-2 rounded-full bg-pink" aria-hidden="true" />
            {t(eyebrow)}
          </p>
        )}
        <Heading
          className={`font-display mt-2 text-4xl leading-[1.05] md:text-5xl ${tone === "dark" ? "text-white" : "text-ink"}`}
        >
          {titleText ?? (title ? t(title) : null)}
        </Heading>
        {children}
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="text-sm font-semibold text-pink underline-offset-4 transition-colors hover:text-pink-dark hover:underline"
        >
          {t("section.viewAll")}
        </Link>
      )}
    </div>
  );
}

import type { MessageKey } from "@/lib/i18n";
import type { ReactNode } from "react";
import { SectionHeading } from "./SectionHeading";
import { Shape } from "./Shape";

export interface PageHeaderProps {
  eyebrow?: MessageKey;
  title?: MessageKey;
  titleText?: string;
  children?: ReactNode;
}

// Cream banner with Memphis accents and the page's <h1> — shared top of every
// catalog page.
export function PageHeader({ eyebrow = "page.catalog", title, titleText, children }: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden bg-cream">
      <Shape kind="circle" className="-right-16 -top-16 h-56 w-56 text-pink/15" />
      <Shape kind="triangle" className="right-[22%] top-8 h-10 w-10 text-sun animate-float" />
      <Shape kind="dots" className="bottom-4 right-[8%] h-14 w-14 text-electric/30" />
      <Shape kind="squiggle" className="bottom-6 left-[55%] hidden h-8 w-20 text-pink/40 md:block" />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading as="h1" eyebrow={eyebrow} title={title} titleText={titleText}>
          {children}
        </SectionHeading>
      </div>
    </div>
  );
}

"use client";

import { ProductCard } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import type { CardItem } from "@/lib/catalog";
import { useT } from "@/lib/i18n";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

export interface CharacterTab {
  key: string; // compared against CardItem.characterKey
  name: string;
}

export interface CharacterShowcaseProps {
  items: CardItem[];
  tabs: CharacterTab[];
}

// "Discover Your Character": pill tabs (All + one per IP) that live-filter a
// product grid (3 columns from md up, so cards stay large on desktop) client-side — no refetch, cards animate in and out.
export function CharacterShowcase({ items, tabs }: CharacterShowcaseProps) {
  const { t } = useT();
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<string>("all");
  const visible = active === "all" ? items : items.filter((item) => item.characterKey === active);

  const pillClass = (isActive: boolean) =>
    `rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
      isActive ? "bg-ink text-white" : "bg-black/5 text-ink hover:bg-pink-soft hover:text-pink"
    }`;

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="section.characters.eyebrow" title="section.characters.title" viewAllHref="/characters" />

        {/* Character filter tabs */}
        <div className="mt-6 flex flex-wrap gap-2" role="tablist">
          <button type="button" role="tab" aria-selected={active === "all"} onClick={() => setActive("all")} className={pillClass(active === "all")}>
            {t("tab.all")}
          </button>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active === tab.key}
              onClick={() => setActive(tab.key)}
              className={pillClass(active === tab.key)}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Filtered grid */}
        <motion.div layout={!reduceMotion} className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:gap-x-8 lg:gap-y-14">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((item) => (
              <motion.div
                key={item.id}
                layout={!reduceMotion}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.25 }}
              >
                <ProductCard item={item} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { SectionHeading } from "@/components/SectionHeading";
import { Shape } from "@/components/Shape";
import { unsplash } from "@/lib/catalog";
import { useT, type MessageKey } from "@/lib/i18n";
import Image from "next/image";
import Link from "next/link";

interface Tile {
  key: MessageKey;
  href: string;
  photo: string;
  // Accent bar under the label — cycles the Memphis palette.
  accent: string;
}

const HERO: Tile = { key: "tile.blindBoxes", href: "/shop/collectible_toys", photo: "1775410632946-26f19376617e", accent: "bg-pink" };

const MEDIUM: Tile[] = [
  { key: "tile.figures", href: "/shop/figures", photo: "1781196208914-24e9fc9276aa", accent: "bg-sun" },
  { key: "tile.megaFigures", href: "/shop/figures", photo: "1779792495496-a26f748f57b0", accent: "bg-electric" },
  { key: "tile.books", href: "/shop/books", photo: "1634828221818-503587f33d02", accent: "bg-pink" },
  { key: "tile.constructors", href: "/shop/toys", photo: "1613792720457-4944d7156999", accent: "bg-sun" },
];

const BOTTOM: Tile[] = [
  { key: "tile.digital", href: "/shop/designs", photo: "1579958746164-e0adaf13ae50", accent: "bg-electric" },
  { key: "tile.plush", href: "/shop/toys", photo: "1622473541183-ddae2b015b9d", accent: "bg-pink" },
  { key: "tile.merch", href: "/shop/merch", photo: "1693275542358-29602edf6088", accent: "bg-sun" },
];

function TileCard({ tile, className = "", large = false }: { tile: Tile; className?: string; large?: boolean }) {
  const { t } = useT();
  return (
    <Link href={tile.href} className={`group relative block overflow-hidden bg-black/10 ${className}`}>
      <Image
        src={unsplash(tile.photo, large ? 900 : 600, large ? 800 : 480)}
        alt=""
        fill
        sizes={large ? "(min-width: 768px) 33vw, 100vw" : "(min-width: 768px) 33vw, 50vw"}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 p-4 md:p-5">
        <p className={large ? "font-display text-3xl text-white md:text-4xl" : "text-sm font-semibold text-white"}>
          {t(tile.key)}
        </p>
        <span className={`mt-2 block h-1 w-8 transition-all duration-300 group-hover:w-16 ${tile.accent}`} />
      </div>
    </Link>
  );
}

// Asymmetric category mosaic: one tall hero tile + a 2×2 of medium tiles, then
// a full-width row of three. Every tile zooms its photo on hover.
export function CategoryGrid() {
  return (
    <section className="relative overflow-hidden bg-cream py-20">
      <Shape kind="ring" className="-right-10 top-10 h-40 w-40 text-sun/60" />
      <Shape kind="dots" className="bottom-10 left-4 h-20 w-20 text-electric/30" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="section.categories.eyebrow" title="section.categories.title" viewAllHref="/shop" />

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:grid-rows-[repeat(2,200px)] lg:grid-rows-[repeat(2,240px)]">
          <TileCard tile={HERO} large className="col-span-2 aspect-[4/3] md:col-span-1 md:row-span-2 md:aspect-auto" />
          {MEDIUM.map((tile) => (
            <TileCard key={tile.key} tile={tile} className="aspect-[4/3] md:aspect-auto" />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {BOTTOM.map((tile) => (
            <TileCard key={tile.key} tile={tile} className="aspect-[4/3] md:aspect-[16/7]" />
          ))}
        </div>
      </div>
    </section>
  );
}

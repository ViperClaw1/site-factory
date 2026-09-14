import { Card } from "@repo/ui";
import Link from "next/link";
import type { ReactNode } from "react";

export interface PlaceholderCardProps {
  icon?: string;
  rounded?: boolean;
  // When set, the card becomes a link (to a placeholder detail page) and
  // shows real placeholder copy instead of grey skeleton bars — used for
  // product/character placeholders, which need somewhere to navigate to.
  // Collection placeholders (no detail page yet) omit these and keep the
  // plain skeleton look.
  href?: string;
  title?: string;
  description?: string;
}

function PlaceholderCardBody({ icon, rounded, title, description }: PlaceholderCardProps) {
  return (
    <Card className={`overflow-hidden transition-shadow group-hover:shadow-md ${rounded ? "rounded-full" : ""}`}>
      <div className="flex aspect-square w-full items-center justify-center bg-black/5">
        <i className={`${icon} text-4xl text-black/20`} aria-hidden="true" />
      </div>
      {!rounded &&
        (title ? (
          <div className="space-y-1 p-4">
            <h3 className="font-heading text-sm font-semibold text-black/70">{title}</h3>
            {description && <p className="text-sm text-black/50">{description}</p>}
          </div>
        ) : (
          <div className="space-y-2 p-4">
            <div className="h-3 w-3/4 rounded bg-black/10" />
            <div className="h-3 w-1/3 rounded bg-black/10" />
          </div>
        ))}
    </Card>
  );
}

export function PlaceholderCard({ icon = "fa-solid fa-gift", rounded = false, href, title, description }: PlaceholderCardProps) {
  const body = <PlaceholderCardBody icon={icon} rounded={rounded} title={title} description={description} />;
  const name: ReactNode = rounded && title && (
    <p className="mt-2 text-center font-heading text-sm font-semibold text-black/70">{title}</p>
  );

  if (href) {
    return (
      <Link href={href} className="group block">
        {body}
        {name}
      </Link>
    );
  }

  return (
    <div>
      {body}
      {name}
    </div>
  );
}

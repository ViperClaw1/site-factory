import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="Path — home">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand font-heading text-lg font-extrabold text-ink transition-transform group-hover:-rotate-6">
        P
      </span>
      <span className="hidden font-heading text-lg font-extrabold tracking-tight sm:inline">
        Path<span className="text-brand">.</span>courses
      </span>
    </Link>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand ${center ? "justify-center" : ""}`}>
        <span className="h-px w-6 bg-brand" />
        {eyebrow}
      </p>
      <h2 className="mt-4 font-heading text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{subtitle}</p>}
    </div>
  );
}

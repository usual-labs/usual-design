export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: string;
}) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">{eyebrow}</p>
      <h2 className="text-title font-semibold tracking-tight">{title}</h2>
      {children && <p className="mt-5 text-lg leading-relaxed text-muted">{children}</p>}
    </div>
  );
}

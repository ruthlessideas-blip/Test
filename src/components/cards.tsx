import clsx from "clsx";

export function Surface({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={clsx("rounded-lg border border-slate-200 bg-white p-4 shadow-sm", className)}>{children}</section>;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const nav = [
  ["Today", "/"],
  ["Universes", "/universes"],
  ["Worlds", "/worlds"],
  ["Dreams", "/dreams"],
  ["Prompt Library", "/prompt-library"],
  ["Archive", "/archive"],
  ["Settings", "/settings"]
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-slate-200 bg-white p-4 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <h1 className="mb-4 text-xl font-semibold">One Focus</h1>
      <nav className="flex flex-wrap gap-2 lg:flex-col">
        {nav.map(([label, href]) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "rounded-md px-3 py-2 text-sm",
                active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

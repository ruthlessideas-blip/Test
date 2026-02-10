import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Surface } from "@/components/cards";

export default async function ArchivePage() {
  const worlds = await prisma.world.findMany({ where: { OR: [{ status: "completed" }, { status: "archived" }] }, orderBy: { updatedAt: "desc" } });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Archive</h2>
      {worlds.map((world) => (
        <Surface key={world.id}>
          <Link href={`/worlds/${world.id}`} className="font-medium text-blue-700 underline">{world.title}</Link>
          <p className="text-sm text-slate-600">{world.status}</p>
        </Surface>
      ))}
      {worlds.length === 0 && <p className="text-sm text-slate-500">Nothing archived yet.</p>}
    </div>
  );
}

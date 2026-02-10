import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Surface } from "@/components/cards";

export default async function UniverseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const universe = await prisma.universe.findUnique({ where: { id }, include: { worlds: { orderBy: { updatedAt: "desc" } } } });
  if (!universe) notFound();

  const statuses = ["active", "paused", "completed", "archived"] as const;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{universe.name}</h2>
      <p>{universe.mission}</p>
      {statuses.map((status) => (
        <Surface key={status}>
          <h3 className="font-semibold capitalize">{status}</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {universe.worlds.filter((w) => w.status === status).map((world) => (
              <li key={world.id}><Link href={`/worlds/${world.id}`} className="text-blue-700 underline">{world.title}</Link></li>
            ))}
          </ul>
        </Surface>
      ))}
    </div>
  );
}

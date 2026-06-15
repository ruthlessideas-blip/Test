import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { activateWorld } from "@/server/world-service";
import { Surface } from "@/components/cards";

async function doActivate(worldId: string) {
  "use server";
  await activateWorld(prisma, worldId);
  revalidatePath("/worlds");
  revalidatePath("/");
}

const groups = ["active", "paused", "completed", "archived"] as const;

export default async function WorldsPage() {
  const worlds = await prisma.world.findMany({ include: { universe: true }, orderBy: { updatedAt: "desc" } });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Worlds</h2>
        <Link href="/worlds/new" className="rounded bg-slate-900 px-3 py-2 text-white">Create World</Link>
      </div>

      {groups.map((group) => (
        <Surface key={group}>
          <h3 className="mb-3 text-lg font-semibold capitalize">{group}</h3>
          <div className="space-y-2">
            {worlds.filter((world) => world.status === group).map((world) => (
              <div key={world.id} className="flex flex-wrap items-center justify-between rounded border p-3">
                <div>
                  <Link href={`/worlds/${world.id}`} className="font-medium text-blue-700 underline">{world.title}</Link>
                  <p className="text-sm text-slate-600">{world.universe.name} • {world.phaseLabel}</p>
                </div>
                {group !== "active" && group !== "completed" && group !== "archived" && (
                  <form action={doActivate.bind(null, world.id)}>
                    <button className="rounded bg-emerald-700 px-3 py-1 text-white" type="submit">Activate</button>
                  </form>
                )}
              </div>
            ))}
            {worlds.every((world) => world.status !== group) && <p className="text-sm text-slate-500">None</p>}
          </div>
        </Surface>
      ))}
    </div>
  );
}

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ProgressionStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Surface } from "@/components/cards";

async function createWorld(formData: FormData) {
  "use server";
  const title = (formData.get("title") as string) || "Untitled World";
  const seed = (formData.get("seed") as string) || title;
  const intent = (formData.get("intent") as string) || "Move this world forward intentionally.";
  const definitionOfDone = (formData.get("definitionOfDone") as string) || "Clear finishing condition defined.";
  const phaseLabel = (formData.get("phaseLabel") as string) || "Foundation";
  const progressionStage = formData.get("progressionStage") as ProgressionStage;
  const universeMode = formData.get("universeMode") as string;

  let universeId = formData.get("universeId") as string;

  if (universeMode === "quick") {
    const universe = await prisma.universe.create({
      data: {
        name: (formData.get("newUniverseName") as string) || "General",
        mission: (formData.get("newUniverseMission") as string) || "Meaningful work in progress",
        color: (formData.get("newUniverseColor") as string) || "#64748b"
      }
    });
    universeId = universe.id;
  }

  const world = await prisma.world.create({
    data: {
      universeId,
      title,
      seed,
      intent,
      definitionOfDone,
      phaseLabel,
      progressionStage,
      status: "paused"
    }
  });

  revalidatePath("/worlds");
  redirect(`/worlds/${world.id}`);
}

export default async function NewWorldPage({ searchParams }: { searchParams: Promise<{ seed?: string }> }) {
  const universes = await prisma.universe.findMany({ orderBy: { createdAt: "desc" } });
  const { seed } = await searchParams;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Create World</h2>
      <Surface>
        <form action={createWorld} className="grid gap-3">
          <input name="title" placeholder="World title" className="rounded border p-2" defaultValue={seed} required />
          <textarea name="seed" placeholder="Seed sentence" className="rounded border p-2" rows={2} defaultValue={seed} required />
          <select name="progressionStage" className="rounded border p-2" defaultValue="NOT_STARTED">
            {Object.values(ProgressionStage).map((stage) => <option key={stage} value={stage}>{stage}</option>)}
          </select>
          <input name="phaseLabel" placeholder="Phase label" className="rounded border p-2" defaultValue="Foundation" />
          <textarea name="intent" placeholder="Intent" className="rounded border p-2" rows={2} />
          <textarea name="definitionOfDone" placeholder="Definition of done" className="rounded border p-2" rows={2} />

          <label className="text-sm">Universe source</label>
          <select name="universeMode" className="rounded border p-2" defaultValue={universes.length ? "existing" : "quick"}>
            <option value="existing">Use existing</option>
            <option value="quick">Create quickly</option>
          </select>
          {universes.length > 0 ? (
            <select name="universeId" className="rounded border p-2" defaultValue={universes[0].id}>
              {universes.map((universe) => <option value={universe.id} key={universe.id}>{universe.name}</option>)}
            </select>
          ) : (
            <input type="hidden" name="universeMode" value="quick" />
          )}
          <input name="newUniverseName" placeholder="Quick universe name" className="rounded border p-2" />
          <textarea name="newUniverseMission" placeholder="Quick mission" className="rounded border p-2" rows={2} />
          <input name="newUniverseColor" placeholder="#64748b" className="rounded border p-2" />

          <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-white">Create</button>
        </form>
      </Surface>
    </div>
  );
}

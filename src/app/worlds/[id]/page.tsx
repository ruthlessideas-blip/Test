import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { generateAi } from "@/server/ai";
import { todayYmd } from "@/lib/dates";
import { createDailyStepIfMissing } from "@/server/world-service";
import { Surface } from "@/components/cards";

async function completeWorld(worldId: string) {
  "use server";
  await prisma.world.update({ where: { id: worldId }, data: { status: "completed", completedAt: new Date() } });
  revalidatePath("/worlds");
  revalidatePath("/archive");
}

async function runAi(formData: FormData) {
  "use server";
  const worldId = formData.get("worldId") as string;
  const type = formData.get("type") as "world_expand" | "summary" | "daily_step";
  const result = await generateAi(type, worldId, { from: "world-detail" });

  if (type === "daily_step") {
    await createDailyStepIfMissing(prisma, worldId, todayYmd(), result.text, result.reasoning);
  }

  revalidatePath(`/worlds/${worldId}`);
  revalidatePath("/");
}

async function editRun(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const outputText = formData.get("outputText") as string;
  await prisma.promptRun.update({ where: { id }, data: { outputText, edited: true } });
  revalidatePath(`/worlds/${formData.get("worldId") as string}`);
}

async function addMemory(formData: FormData) {
  "use server";
  const worldId = formData.get("worldId") as string;
  await prisma.worldMemoryLog.create({
    data: {
      worldId,
      type: formData.get("type") as "decision" | "assumption" | "lesson" | "direction_change" | "note",
      content: (formData.get("content") as string) || ""
    }
  });
  revalidatePath(`/worlds/${worldId}`);
}

export default async function WorldDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [world, settings] = await Promise.all([
    prisma.world.findUnique({
      where: { id },
      include: {
        universe: true,
        dailySteps: { orderBy: { createdAt: "desc" }, take: 1 },
        memoryLogs: { orderBy: { createdAt: "desc" }, take: 10 },
        promptRuns: { orderBy: { createdAt: "desc" }, take: 5 }
      }
    }),
    getSettings()
  ]);

  if (!world) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{world.title}</h2>
        {world.status !== "completed" && (
          <form action={completeWorld.bind(null, world.id)}>
            <button type="submit" className="rounded bg-amber-700 px-3 py-2 text-white">Mark Completed</button>
          </form>
        )}
      </div>

      <Surface>
        <p className="text-sm text-slate-600">{world.universe.name} • {world.phaseLabel}</p>
        <p className="mt-2">{world.intent}</p>
        <p className="mt-2 text-sm">Next step preview: {world.dailySteps[0]?.stepText ?? "No step generated yet."}</p>
      </Surface>

      {settings.mode === "gold" && (
        <>
          <Surface><h3 className="font-semibold">Vision / Intent</h3><p>{world.intent}</p></Surface>
          <Surface><h3 className="font-semibold">Systems</h3><p className="text-sm text-slate-600">Placeholder for routines and operating cadence.</p></Surface>
          <Surface><h3 className="font-semibold">Risks</h3><p className="text-sm text-slate-600">Placeholder for threats and mitigations.</p></Surface>
          <Surface>
            <h3 className="font-semibold">Memory Log</h3>
            <form action={addMemory} className="mt-2 flex flex-wrap gap-2">
              <input type="hidden" name="worldId" value={world.id} />
              <select name="type" className="rounded border p-1 text-sm">
                <option value="decision">decision</option><option value="assumption">assumption</option><option value="lesson">lesson</option><option value="direction_change">direction_change</option><option value="note">note</option>
              </select>
              <input name="content" className="flex-1 rounded border p-1 text-sm" placeholder="Capture memory" required />
              <button className="rounded bg-slate-900 px-2 py-1 text-white text-sm" type="submit">Add</button>
            </form>
            <ul className="mt-3 space-y-1 text-sm">{world.memoryLogs.map((log)=><li key={log.id}>• <strong>{log.type}</strong>: {log.content}</li>)}</ul>
          </Surface>
          <Surface>
            <h3 className="font-semibold">AI panel</h3>
            <div className="mt-2 flex gap-2">
              <form action={runAi}><input type="hidden" name="worldId" value={world.id} /><input type="hidden" name="type" value="world_expand" /><button className="rounded bg-slate-200 px-2 py-1 text-sm">Expand world</button></form>
              <form action={runAi}><input type="hidden" name="worldId" value={world.id} /><input type="hidden" name="type" value="summary" /><button className="rounded bg-slate-200 px-2 py-1 text-sm">Summary</button></form>
              <form action={runAi}><input type="hidden" name="worldId" value={world.id} /><input type="hidden" name="type" value="daily_step" /><button className="rounded bg-slate-900 px-2 py-1 text-sm text-white">Generate daily step</button></form>
            </div>
            <div className="mt-4 space-y-3">
              {world.promptRuns.map((run) => (
                <form key={run.id} action={editRun} className="rounded border p-2">
                  <input type="hidden" name="id" value={run.id} />
                  <input type="hidden" name="worldId" value={world.id} />
                  <p className="text-xs text-slate-500">Run {run.id.slice(0, 8)} {run.edited ? "(edited)" : ""}</p>
                  <textarea name="outputText" defaultValue={run.outputText} rows={4} className="mt-1 w-full rounded border p-1 text-sm" />
                  <button type="submit" className="mt-2 rounded bg-slate-800 px-2 py-1 text-xs text-white">Save output</button>
                </form>
              ))}
            </div>
          </Surface>
        </>
      )}
    </div>
  );
}

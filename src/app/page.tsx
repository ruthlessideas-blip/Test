import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { todayYmd } from "@/lib/dates";
import { getSettings } from "@/lib/settings";
import { generateAi } from "@/server/ai";
import { createDailyStepIfMissing } from "@/server/world-service";
import { Surface } from "@/components/cards";

async function generateStep(worldId: string) {
  "use server";
  const today = todayYmd();
  const ai = await generateAi("daily_step", worldId, { date: today });
  const world = await prisma.world.findUniqueOrThrow({ where: { id: worldId } });
  await createDailyStepIfMissing(prisma, worldId, today, ai.text, ai.reasoning ?? world.intent);
  revalidatePath("/");
}

async function editStep(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const stepText = formData.get("stepText") as string;
  await prisma.dailyStep.update({ where: { id }, data: { stepText } });
  revalidatePath("/");
}

async function markDone(stepId: string) {
  "use server";
  await prisma.dailyStep.update({ where: { id: stepId }, data: { status: "done" } });
  const settings = await getSettings();
  revalidatePath("/");
  if (settings.closeOnDone) redirect("/?done=1");
}

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  const [{ done }, settings] = await Promise.all([searchParams, getSettings()]);
  const activeWorld = await prisma.world.findFirst({ where: { status: "active" } });
  const today = todayYmd();
  const step = activeWorld
    ? await prisma.dailyStep.findUnique({ where: { worldId_date: { worldId: activeWorld.id, date: today } } })
    : null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Today</h2>
      {done ? (
        <div className="fixed inset-0 z-10 grid place-items-center bg-white/95 p-6">
          <Surface className="max-w-md text-center">
            <h3 className="text-xl font-semibold">Done.</h3>
            <p className="mt-2 text-sm text-slate-600">Nice work. You can close this tab now to protect your focus.</p>
            <Link href="/" className="mt-4 inline-block rounded bg-slate-900 px-4 py-2 text-white">Back to Today</Link>
          </Surface>
        </div>
      ) : null}

      {!activeWorld ? (
        <Surface>
          <p>No active world yet.</p>
          <Link className="mt-3 inline-block text-blue-700 underline" href="/worlds">Go activate a world</Link>
        </Surface>
      ) : (
        <>
          <Surface className="border-l-4 border-l-slate-700">
            <h3 className="text-lg font-semibold">{activeWorld.title}</h3>
            <p className="text-sm text-slate-600">{activeWorld.phaseLabel}</p>
            <p className="mt-2 text-sm">{activeWorld.intent}</p>
          </Surface>

          <Surface>
            <p className="text-xs uppercase tracking-wide text-slate-500">One step only</p>
            {step ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">This moves your World forward by {step.chosenReason ?? activeWorld.intent}.</p>
                <form action={editStep} className="space-y-2">
                  <input type="hidden" name="id" value={step.id} />
                  <textarea name="stepText" defaultValue={step.stepText} className="w-full rounded border p-2" rows={3} />
                  <button className="rounded bg-slate-200 px-3 py-1 text-sm" type="submit">Save Edit</button>
                </form>
                {step.status === "pending" && (
                  <form action={markDone.bind(null, step.id)}>
                    <button className="rounded bg-green-700 px-3 py-2 text-white" type="submit">Mark Complete</button>
                  </form>
                )}
              </div>
            ) : (
              <form action={generateStep.bind(null, activeWorld.id)}>
                <button className="mt-3 rounded bg-slate-900 px-4 py-2 text-white" type="submit">
                  {settings.mode === "gold" ? "Generate (show reasoning)" : "Generate Step"}
                </button>
              </form>
            )}
          </Surface>
        </>
      )}
    </div>
  );
}

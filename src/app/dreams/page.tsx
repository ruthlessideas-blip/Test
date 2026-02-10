import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Surface } from "@/components/cards";

async function saveDream(formData: FormData) {
  "use server";
  await prisma.dream.create({
    data: {
      content: (formData.get("content") as string) || "",
      universeId: ((formData.get("universeId") as string) || undefined) ?? null
    }
  });
  revalidatePath("/dreams");
}

export default async function DreamsPage() {
  const [dreams, universes] = await Promise.all([
    prisma.dream.findMany({ include: { universe: true }, orderBy: { createdAt: "desc" } }),
    prisma.universe.findMany({ orderBy: { createdAt: "desc" } })
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Dreams</h2>
      <Surface>
        <form action={saveDream} className="space-y-2">
          <textarea name="content" rows={3} required className="w-full rounded border p-2" placeholder="Capture dream (non-actionable)" />
          <select name="universeId" className="rounded border p-2 text-sm">
            <option value="">No universe</option>
            {universes.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button className="rounded bg-slate-900 px-3 py-2 text-white" type="submit">Save Dream</button>
        </form>
      </Surface>

      <div className="space-y-2">
        {dreams.map((dream) => (
          <Surface key={dream.id}>
            <p>{dream.content}</p>
            <p className="mt-1 text-xs text-slate-500">{dream.universe?.name ?? "No universe"}</p>
            <Link href={`/worlds/new?seed=${encodeURIComponent(dream.content)}`} className="mt-2 inline-block text-blue-700 underline">Promote to World</Link>
          </Surface>
        ))}
      </div>
    </div>
  );
}

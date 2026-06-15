import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Surface } from "@/components/cards";

async function createUniverse(formData: FormData) {
  "use server";
  await prisma.universe.create({
    data: {
      name: (formData.get("name") as string) || "New Universe",
      mission: (formData.get("mission") as string) || "A focused mission.",
      icon: (formData.get("icon") as string) || null,
      color: (formData.get("color") as string) || "#64748b"
    }
  });
  revalidatePath("/universes");
}

export default async function UniversesPage() {
  const universes = await prisma.universe.findMany({ include: { worlds: true }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Universes</h2>
      <Surface>
        <form action={createUniverse} className="grid gap-2 md:grid-cols-2">
          <input className="rounded border p-2" name="name" placeholder="Name" required />
          <input className="rounded border p-2" name="icon" placeholder="Icon (optional)" />
          <input className="rounded border p-2 md:col-span-2" name="mission" placeholder="Mission" required />
          <input className="rounded border p-2" name="color" placeholder="#64748b" />
          <button className="rounded bg-slate-900 px-3 py-2 text-white" type="submit">Create Universe</button>
        </form>
      </Surface>
      <div className="grid gap-3 md:grid-cols-2">
        {universes.map((universe) => (
          <Surface key={universe.id} className="border-l-4" >
            <Link href={`/universes/${universe.id}`} className="text-lg font-medium text-blue-700 underline">{universe.icon} {universe.name}</Link>
            <p className="mt-1 text-sm text-slate-600">{universe.mission}</p>
            <p className="mt-2 text-sm">{universe.worlds.length} worlds</p>
          </Surface>
        ))}
      </div>
    </div>
  );
}

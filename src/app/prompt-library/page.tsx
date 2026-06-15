import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Surface } from "@/components/cards";

async function saveTemplate(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const existing = await prisma.promptTemplate.findUniqueOrThrow({ where: { id } });
  await prisma.promptTemplate.create({
    data: {
      name: existing.name,
      scope: existing.scope,
      universeId: existing.universeId,
      worldId: existing.worldId,
      version: existing.version + 1,
      templateText: formData.get("templateText") as string,
      isDefault: false
    }
  });
  revalidatePath("/prompt-library");
}

async function resetDefault(formData: FormData) {
  "use server";
  const name = formData.get("name") as string;
  const defaultTemplate = await prisma.promptTemplate.findFirst({ where: { name, isDefault: true } });
  const latest = await prisma.promptTemplate.findFirst({ where: { name, scope: "global" }, orderBy: { version: "desc" } });
  if (defaultTemplate && latest) {
    await prisma.promptTemplate.create({
      data: {
        name: defaultTemplate.name,
        scope: defaultTemplate.scope,
        universeId: defaultTemplate.universeId,
        worldId: defaultTemplate.worldId,
        version: latest.version + 1,
        templateText: defaultTemplate.templateText,
        isDefault: false
      }
    });
  }
  revalidatePath("/prompt-library");
}

export default async function PromptLibraryPage() {
  const templates = await prisma.promptTemplate.findMany({ orderBy: [{ name: "asc" }, { version: "desc" }] });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Prompt Library</h2>
      <p className="text-sm text-slate-600">How your AI thinks.</p>
      {templates.map((template) => (
        <Surface key={template.id}>
          <p className="font-medium">{template.name} <span className="text-xs text-slate-500">v{template.version} • {template.scope}</span></p>
          <form action={saveTemplate} className="mt-2 space-y-2">
            <input type="hidden" name="id" value={template.id} />
            <textarea name="templateText" defaultValue={template.templateText} className="w-full rounded border p-2 text-sm" rows={3} />
            <button type="submit" className="rounded bg-slate-900 px-2 py-1 text-white text-sm">Save + bump version</button>
          </form>
          <form action={resetDefault} className="mt-2">
            <input type="hidden" name="name" value={template.name} />
            <button type="submit" className="rounded bg-slate-200 px-2 py-1 text-xs">Reset to default</button>
          </form>
        </Surface>
      ))}
    </div>
  );
}

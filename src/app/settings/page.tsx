import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { Surface } from "@/components/cards";

async function updateSettings(formData: FormData) {
  "use server";
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {
      mode: formData.get("mode") as "calm" | "gold",
      closeOnDone: formData.get("closeOnDone") === "on"
    },
    create: {
      id: 1,
      mode: formData.get("mode") as "calm" | "gold",
      closeOnDone: formData.get("closeOnDone") === "on"
    }
  });
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/worlds/[id]", "page");
}

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Settings</h2>
      <Surface>
        <form action={updateSettings} className="space-y-3">
          <label className="block">
            <span className="text-sm">Mode</span>
            <select name="mode" defaultValue={settings.mode} className="mt-1 block rounded border p-2">
              <option value="calm">Calm</option>
              <option value="gold">Gold</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="closeOnDone" defaultChecked={settings.closeOnDone} />
            Close-on-done confirmation
          </label>
          <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-white">Save settings</button>
        </form>
      </Surface>
    </div>
  );
}

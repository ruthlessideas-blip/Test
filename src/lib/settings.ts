import { prisma } from "@/lib/prisma";

export async function getSettings() {
  return prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, mode: "calm", closeOnDone: true }
  });
}

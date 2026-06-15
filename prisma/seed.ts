import { PrismaClient, PromptScope } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, mode: "calm", closeOnDone: true }
  });

  const defaults = [
    {
      name: "World Expansion",
      scope: PromptScope.global,
      version: 1,
      templateText: "Expand this world into a clearer strategy with practical scope.",
      isDefault: true
    },
    {
      name: "Daily Step Curator",
      scope: PromptScope.global,
      version: 1,
      templateText: "Select exactly one meaningful next step for today and why it matters.",
      isDefault: true
    },
    {
      name: "World Summary",
      scope: PromptScope.global,
      version: 1,
      templateText: "Summarize world status, risks, and next leverage moves.",
      isDefault: true
    }
  ];

  for (const template of defaults) {
    await prisma.promptTemplate.upsert({
      where: { id: `${template.name.toLowerCase().replace(/\s+/g, "-")}-default` },
      update: {},
      create: { id: `${template.name.toLowerCase().replace(/\s+/g, "-")}-default`, ...template }
    });
  }
}

main().finally(async () => prisma.$disconnect());

import { ProgressionStage, PromptTemplate } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stageGuidance } from "@/server/world-service";

export type GenerateType = "world_expand" | "daily_step" | "summary";

function templateNameForType(type: GenerateType): string {
  if (type === "world_expand") return "World Expansion";
  if (type === "daily_step") return "Daily Step Curator";
  return "World Summary";
}

function buildOutput(type: GenerateType, stage: ProgressionStage, title: string, intent: string) {
  const guidance = stageGuidance(stage);

  if (type === "daily_step") {
    return {
      text: `Draft one concrete step for ${title}: ${intent.slice(0, 90)}. Action: block 45 focused minutes and deliver one artifact that proves progress.`,
      reasoning: `${guidance} This step is small enough for today but meaningful enough to reduce uncertainty.`
    };
  }

  if (type === "world_expand") {
    return {
      text: `World expansion for ${title}:\n1) Clarify scope in one sentence.\n2) Name top 3 constraints.\n3) Define a one-week proof milestone.`,
      reasoning: `${guidance} Expansion prioritizes decisions that unlock execution.`
    };
  }

  return {
    text: `Summary for ${title}: Focus remains ${intent}. Current priority is to remove the next blocker and maintain single-threaded momentum.`,
    reasoning: `${guidance} Summary emphasizes direction and sequencing.`
  };
}

async function resolveTemplate(type: GenerateType, worldId?: string): Promise<PromptTemplate> {
  const name = templateNameForType(type);
  const world = worldId ? await prisma.world.findUnique({ where: { id: worldId } }) : null;

  if (worldId) {
    const worldScoped = await prisma.promptTemplate.findFirst({
      where: { name, scope: "world", worldId },
      orderBy: { version: "desc" }
    });
    if (worldScoped) return worldScoped;

    const universeScoped = await prisma.promptTemplate.findFirst({
      where: { name, scope: "universe", universeId: world?.universeId },
      orderBy: { version: "desc" }
    });
    if (universeScoped) return universeScoped;
  }

  const globalTemplate = await prisma.promptTemplate.findFirst({
    where: { name, scope: "global" },
    orderBy: { version: "desc" }
  });

  if (!globalTemplate) throw new Error(`Missing default prompt template: ${name}`);
  return globalTemplate;
}

export async function generateAi(type: GenerateType, worldId?: string, extras?: Record<string, unknown>) {
  const world = worldId
    ? await prisma.world.findUnique({ where: { id: worldId } })
    : null;

  const template = await resolveTemplate(type, worldId);
  const output = buildOutput(
    type,
    world?.progressionStage ?? "NOT_STARTED",
    world?.title ?? "Untitled world",
    world?.intent ?? "Define intent"
  );

  const run = await prisma.promptRun.create({
    data: {
      templateId: template.id,
      worldId,
      inputsJson: JSON.stringify({ type, worldId, extras: extras ?? {} }),
      outputText: output.text,
      edited: false
    }
  });

  return {
    text: output.text,
    reasoning: output.reasoning,
    templateIdUsed: template.id,
    runId: run.id
  };
}

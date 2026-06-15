import { PrismaClient, ProgressionStage, WorldStatus } from "@prisma/client";

export async function activateWorld(prisma: PrismaClient, worldId: string) {
  return prisma.$transaction(async (tx) => {
    const existingActive = await tx.world.findFirst({ where: { status: WorldStatus.active } });

    if (existingActive && existingActive.id !== worldId) {
      await tx.world.update({ where: { id: existingActive.id }, data: { status: WorldStatus.paused } });
    }

    return tx.world.update({ where: { id: worldId }, data: { status: WorldStatus.active } });
  });
}

export async function createDailyStepIfMissing(
  prisma: PrismaClient,
  worldId: string,
  date: string,
  stepText: string,
  chosenReason?: string
) {
  return prisma.dailyStep.upsert({
    where: { worldId_date: { worldId, date } },
    create: { worldId, date, stepText, chosenReason },
    update: { stepText, chosenReason }
  });
}

export function stageGuidance(stage: ProgressionStage): string {
  switch (stage) {
    case "NOT_STARTED":
      return "Create clarity and prove momentum with the first tangible move.";
    case "BARELY_STARTED":
      return "Add structure, organize workstreams, and validate assumptions quickly.";
    case "IN_DEPTH":
      return "Resolve bottlenecks through explicit decisions and strong sequencing.";
    case "ITS_MY_JOB":
      return "Prioritize leverage and operational systems that compound results.";
    default:
      return "Move the world forward with the most meaningful single action.";
  }
}

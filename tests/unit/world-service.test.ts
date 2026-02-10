import { activateWorld, createDailyStepIfMissing } from "@/server/world-service";

describe("world service", () => {
  it("enforces one active world (pauses existing active)", async () => {
    const update = jest.fn(async ({ where, data }) => ({ id: where.id, ...data }));
    const tx = {
      world: {
        findFirst: jest.fn(async () => ({ id: "a1", status: "active" })),
        update
      }
    };
    const prisma = { $transaction: async (cb: (tx: any) => Promise<unknown>) => cb(tx) } as any;

    await activateWorld(prisma, "a2");

    expect(update).toHaveBeenCalledWith({ where: { id: "a1" }, data: { status: "paused" } });
    expect(update).toHaveBeenCalledWith({ where: { id: "a2" }, data: { status: "active" } });
  });

  it("allows exactly one daily step per world/day via upsert", async () => {
    const upsert = jest.fn();
    const prisma = { dailyStep: { upsert } } as any;

    await createDailyStepIfMissing(prisma, "w1", "2026-02-10", "Do one thing", "because");

    expect(upsert).toHaveBeenCalledWith({
      where: { worldId_date: { worldId: "w1", date: "2026-02-10" } },
      create: {
        worldId: "w1",
        date: "2026-02-10",
        stepText: "Do one thing",
        chosenReason: "because"
      },
      update: { stepText: "Do one thing", chosenReason: "because" }
    });
  });
});

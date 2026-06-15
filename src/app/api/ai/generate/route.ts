import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAi } from "@/server/ai";

const schema = z.object({
  type: z.enum(["world_expand", "daily_step", "summary"]),
  worldId: z.string().optional(),
  extras: z.record(z.unknown()).optional()
});

export async function POST(req: Request) {
  const body = schema.parse(await req.json());
  const result = await generateAi(body.type, body.worldId, body.extras);
  return NextResponse.json(result);
}

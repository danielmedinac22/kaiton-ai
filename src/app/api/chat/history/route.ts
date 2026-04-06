import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatHistory } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select()
    .from(chatHistory)
    .orderBy(desc(chatHistory.createdAt))
    .limit(50);

  const messages = rows.reverse().map((r) => ({
    id: r.id,
    role: r.role,
    content: r.content,
  }));

  return NextResponse.json({ messages });
}

export async function DELETE() {
  await db.delete(chatHistory);
  return NextResponse.json({ ok: true });
}

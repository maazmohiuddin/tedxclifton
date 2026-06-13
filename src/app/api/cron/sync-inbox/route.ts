import { NextResponse } from "next/server";
import { syncInboxEmails } from "@/lib/imap-sync";

export const runtime = "nodejs";
export const maxDuration = 55;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncInboxEmails();
  return NextResponse.json(result, { status: result.error ? 500 : 200 });
}

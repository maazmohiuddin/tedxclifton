/**
 * POST /api/admin/bulk-email/validate
 * Checks MX DNS records for a list of email addresses.
 * Groups by domain so each domain is only looked up once.
 * Admin-only.
 */
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveMx } from "dns/promises";

export const runtime = "nodejs";

export interface ValidationResult {
  email: string;
  domain: string;
  mx: boolean;
  reason?: string;
}

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { emails?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const emails = body.emails;
  if (!Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: "emails must be a non-empty array" }, { status: 400 });
  }

  // Group by domain — only look up each domain once
  const domainMap = new Map<string, string[]>();
  for (const e of emails) {
    if (typeof e !== "string") continue;
    const domain = e.split("@")[1]?.toLowerCase().trim();
    if (domain) {
      const arr = domainMap.get(domain) ?? [];
      arr.push(e.toLowerCase().trim());
      domainMap.set(domain, arr);
    }
  }

  const results: ValidationResult[] = [];

  await Promise.all(
    Array.from(domainMap.entries()).map(async ([domain, addrs]) => {
      let mx = false;
      let reason: string | undefined;
      try {
        const records = await Promise.race([
          resolveMx(domain),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("DNS timeout")), 5000)
          ),
        ]);
        mx = records.length > 0;
        if (!mx) reason = "No MX records for this domain";
      } catch (err) {
        reason = err instanceof Error ? err.message : "DNS lookup failed";
      }
      for (const email of addrs) {
        results.push({ email, domain, mx, reason: mx ? undefined : reason });
      }
    })
  );

  // Sort to match input order
  const emailOrder = new Map((emails as string[]).map((e, i) => [e.toLowerCase().trim(), i]));
  results.sort((a, b) => (emailOrder.get(a.email) ?? 0) - (emailOrder.get(b.email) ?? 0));

  return NextResponse.json({ results });
}

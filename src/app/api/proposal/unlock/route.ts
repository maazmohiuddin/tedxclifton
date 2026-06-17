import { NextResponse } from "next/server";
import {
  PROPOSAL_COOKIE,
  proposalToken,
  verifyPassword,
} from "@/lib/proposal-auth";

export const runtime = "nodejs";

/** Verify the password and, on success, set the access cookie. */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { password?: string };

    if (!verifyPassword(body.password)) {
      // Small delay to take the edge off brute-forcing.
      await new Promise((r) => setTimeout(r, 400));
      return NextResponse.json(
        { error: "Incorrect password. Please try again." },
        { status: 401 },
      );
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(PROPOSAL_COOKIE, proposalToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

/** Lock the proposal again (clear the cookie). */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PROPOSAL_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}

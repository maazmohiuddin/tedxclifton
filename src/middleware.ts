import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Skip static assets, API routes, and auth callback (handles itself).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|auth/callback|fonts/|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff|woff2)$).*)",
  ],
};

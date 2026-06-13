import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendContactNotification } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body as Record<string, string>;

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const svc = createServiceClient();
    const { data, error } = await svc
      .from("contact_messages")
      .insert({ name: name.trim(), email: email.trim().toLowerCase(), subject: subject.trim(), message: message.trim() })
      .select("id")
      .single();

    if (error) throw error;

    // Notify admin — fire-and-forget, don't block the response
    sendContactNotification({ name, email, subject, message, messageId: data.id }).catch(console.error);

    return NextResponse.json({ ok: true, id: data.id });
  } catch (e) {
    console.error("Contact route error:", e);
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }
}

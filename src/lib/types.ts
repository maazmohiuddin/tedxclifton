export type SubmissionStatus = "pending" | "approved" | "rejected";

export type RegistrationTrack =
  | "general"
  | "student"
  | "vip"
  | "partner";

export interface Registration {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  organisation: string | null;
  role: string;
  track: RegistrationTrack;
  referral: string | null;
  created_at: string;
  // Confirmation flow (migration 002)
  confirmed_at: string | null;
  confirmation_email_sent_at: string | null;
  confirmation_email_count: number;
  confirmed_by: string | null;
  admin_note: string | null;
}

export interface Submission {
  id: string;
  full_name: string;
  email: string;
  project: string;      // talk title
  category: string;     // talk theme / topic
  description: string;  // talk idea + speaker bio
  team_size: string | null;
  file_path: string | null;  // optional supporting deck / showreel
  status: SubmissionStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
  created_at: string;
}

export interface CardShare {
  id: string;
  slug: string;
  name: string | null;
  template: string;
  designation: string | null;
  created_at: string;
  ip_address?: string | null;
}

export type ContactStatus = "new" | "read" | "replied";

export type ContactSource = "contact_form" | "email";

export interface ContactReply {
  text: string;
  sent_at: string;
  /** Message-ID of the outbound reply (for RFC 5322 References chaining). */
  message_id?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  source: ContactSource;
  imap_message_id: string | null;
  reply_text: string | null;
  replied_at: string | null;
  replies: ContactReply[];
  important: boolean;
  archived: boolean;
  deleted_at: string | null;
  created_at: string;
}

/** Invitation send record for a single email address (from email_send_records). */
export interface InviteInfo {
  last_sent_at: string;
  times_sent: number;
  open_count: number;
}

// ── Testimonials ──────────────────────────────────────────
export type TestimonialStatus = "pending" | "approved" | "rejected";

/** Attendee verification tier, computed server-side against the attendee DB. */
export type VerificationTier = "vip" | "attendee" | "community";

/** Full row — admin only (includes PII like email). */
export interface Testimonial {
  id: string;
  full_name: string;
  email: string;
  designation: string | null;
  company: string | null;
  body: string;
  rating: number | null;
  avatar_path: string | null;
  status: TestimonialStatus;
  verification: VerificationTier;
  featured: boolean;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

/** Public-safe subset shown on the website (no email, resolved avatar URL). */
export interface PublicTestimonial {
  id: string;
  full_name: string;
  designation: string | null;
  company: string | null;
  body: string;
  rating: number | null;
  avatar_url: string | null;
  verification: VerificationTier;
  featured: boolean;
  created_at: string;
}

export const VERIFICATION_LABELS: Record<VerificationTier, string> = {
  vip: "Verified VIP",
  attendee: "Verified Attendee",
  community: "Community Member",
};

/**
 * The TEDxClifton experience pillars (rendered as the homepage "Experience" grid).
 * (Export name kept as DOMAINS so existing imports keep working.)
 */
export const DOMAINS = [
  { key: "ideas",      color: "#EB0028", title: "Ideas Worth Spreading", desc: "Big, bold, important ideas — distilled into talks that travel far beyond the stage." },
  { key: "talks",      color: "#E9B872", title: "18 Minutes on Stage",   desc: "The signature TED format: tight, powerful talks engineered to spark conversation." },
  { key: "speakers",   color: "#FF1F44", title: "Remarkable Speakers",   desc: "Innovators, makers, artists and changemakers from Karachi and across the world." },
  { key: "community",  color: "#F7F7F7", title: "A Curated Community",    desc: "Founders, creatives, students and leaders — one room, one unforgettable day." },
  { key: "experience", color: "#EB0028", title: "An Immersive Day",      desc: "Performances, installations and conversations between every single session." },
  { key: "impact",     color: "#E9B872", title: "Ideas Into Action",     desc: "Talks that don't just inspire — they move people to go build what's next." },
] as const;

export const TRACK_LABELS: Record<RegistrationTrack, string> = {
  general: "General Admission",
  student: "Student",
  vip:     "VIP / Patron",
  partner: "Partner / Sponsor",
};

import { redirect } from "next/navigation";

// Legacy short-URL route — permanently redirect to the canonical /go/ path
export default function LegacySlugPage({ params }: { params: { slug: string } }) {
  redirect(`/go/${params.slug}`);
}

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { PROPOSAL_COOKIE, isUnlocked } from "@/lib/proposal-auth";
import { ProposalGate } from "./ProposalGate";
import { ProposalViewer } from "./ProposalViewer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sponsorship Proposal — TEDxClifton",
  description: "Next is Now — TEDxClifton sponsorship proposal.",
  robots: { index: false, follow: false },
};

export default function ProposalPage() {
  const unlocked = isUnlocked(cookies().get(PROPOSAL_COOKIE)?.value);
  return unlocked ? <ProposalViewer /> : <ProposalGate />;
}

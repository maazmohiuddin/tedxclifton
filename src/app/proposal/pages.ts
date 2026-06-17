/**
 * Ordered manifest of the "Next is Now" sponsorship deck.
 *
 * Drop the exported Figma frames into /public/proposal as
 * page-01.jpg … page-21.jpg (A4, in reading order). The viewer renders
 * whatever is present and silently skips any that are missing, so the deck
 * can grow as pages are added. See /public/proposal/README.md.
 */

export interface ProposalPage {
  src: string;
  alt: string;
}

/** Number of page slots the viewer looks for (frames 1–20 + the "12.5" page). */
export const PROPOSAL_PAGE_COUNT = 21;

export const PROPOSAL_PAGES: ProposalPage[] = Array.from(
  { length: PROPOSAL_PAGE_COUNT },
  (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return {
      src: `/proposal/page-${n}.jpg`,
      alt: `TEDxClifton — Next is Now sponsorship proposal, page ${i + 1}`,
    };
  },
);

/** File name used when the deck is exported to PDF from the browser. */
export const PROPOSAL_PDF_NAME = "TEDxClifton-Next-is-Now-Proposal.pdf";

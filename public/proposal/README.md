# Proposal pages

The `/proposal` route renders the **"Next is Now" sponsorship deck** as an
animated, password-gated viewer with one-click PDF export. It displays the
images in this folder — drop the exported Figma frames here.

## Export from Figma

1. Open the deck in Figma → select the **Proposal** section frames (1–20, plus
   the "12.5" page).
2. **Export** each frame as **JPG** (2× scale gives crisp print/PDF quality).
3. Name them in reading order:

   ```
   page-01.jpg
   page-02.jpg
   …
   page-21.jpg
   ```

   (21 slots = frames 1–20 + the "12.5" page. The viewer skips any that are
   missing, so fewer is fine.)
4. Place the files in this folder (`public/proposal/`).

That's it. The viewer auto-detects the pages, animates them in on scroll, and
the **Download PDF** button assembles the same images into an A4 PDF in the
browser — no separate PDF export needed.

> Tip: keep each JPG reasonably sized (~200–500 KB) so the page and the
> generated PDF stay light.

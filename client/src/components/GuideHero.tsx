/**
 * GuideHero — Faded hero banner for guide page headers
 *
 * Renders a full-width photo strip above the sticky header.
 * The bottom of the image fades into the page background color
 * so it blends seamlessly into the content below.
 *
 * Usage: Place immediately inside the ec-page-bg div, BEFORE the sticky header.
 *
 *   <div className="ec-page-bg pb-24">
 *     <GuideHero imageUrl="/manus-storage/meats_v2_c0fc2ecd.jpg" />
 *     <div className="sticky top-0 z-10 ec-sticky-header ...">
 *       ...
 *     </div>
 *   </div>
 */
interface GuideHeroProps {
  imageUrl: string;
  alt?: string;
  /** Height of the hero strip in px (default 180) */
  height?: number;
}

export function GuideHero({ imageUrl, alt = "", height = 180 }: GuideHeroProps) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height }}
      aria-hidden="true"
    >
      {/* Photo */}
      <img
        src={imageUrl}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.60) saturate(1.1)" }}
        loading="eager"
      />

      {/* Bottom fade — light mode: warm cream #F7F5F0 */}
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          background:
            "linear-gradient(to bottom, rgba(247,245,240,0) 0%, rgba(247,245,240,0.05) 25%, rgba(247,245,240,0.65) 70%, rgba(247,245,240,1) 100%)",
        }}
      />

      {/* Bottom fade — dark mode: deep forest ~#0d1a12 */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background:
            "linear-gradient(to bottom, rgba(13,26,18,0) 0%, rgba(13,26,18,0.05) 25%, rgba(13,26,18,0.65) 70%, rgba(13,26,18,1) 100%)",
        }}
      />

      {/* Top vignette — softens the very top edge */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.40) 0%, transparent 35%)",
        }}
      />
    </div>
  );
}

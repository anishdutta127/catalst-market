/**
 * StoryCardSkeleton — same outer dimensions as a collapsed StoryCard, no
 * shimmer (per design-system/pages/feed.md §5: skeletons hold space, not
 * entertain). Renders solid `--color-rule` shapes that match the collapsed
 * layout: mood strip, square face placeholder, three rule bars at 60/40/30%
 * widths for the headline number area, type cassette stub, city pill stub.
 */

export interface StoryCardSkeletonProps {
  className?: string;
}

export function StoryCardSkeleton({ className }: StoryCardSkeletonProps) {
  return (
    <div
      data-story-skeleton=""
      role="status"
      aria-label="Loading story"
      aria-busy="true"
      className={[
        "bg-card border border-rule rounded-lg overflow-hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Mood strip — solid rule */}
      <div
        data-story-skeleton-mood=""
        className="w-full bg-rule"
        style={{ height: 12 }}
      />
      <div
        className="px-3 py-2.5 md:px-4 md:py-3 flex flex-col gap-1.5"
        style={{ minHeight: 98 }}
      >
        {/* Top row: square face stub + type stub */}
        <div className="flex items-start justify-between gap-2">
          <div
            data-story-skeleton-face=""
            className="bg-rule rounded-sm shrink-0"
            style={{ width: 32, height: 32 }}
          />
          <div
            data-story-skeleton-type=""
            className="bg-rule rounded-sm"
            style={{ width: 36, height: 14 }}
          />
        </div>
        {/* Headline + title bars: 60% / 40% / 30% widths */}
        <div className="flex flex-col gap-1.5 mt-auto">
          <div className="bg-rule rounded-sm" style={{ height: 22, width: "60%" }} />
          <div className="bg-rule rounded-sm" style={{ height: 12, width: "40%" }} />
          <div className="bg-rule rounded-sm" style={{ height: 10, width: "30%" }} />
        </div>
        {/* Bottom row: city pill stub */}
        <div className="flex items-center justify-between mt-1">
          <div
            data-story-skeleton-city=""
            className="bg-rule rounded-sm"
            style={{ width: 28, height: 12 }}
          />
          <div
            data-story-skeleton-chevron=""
            className="bg-rule rounded-sm"
            style={{ width: 10, height: 10 }}
          />
        </div>
      </div>
    </div>
  );
}

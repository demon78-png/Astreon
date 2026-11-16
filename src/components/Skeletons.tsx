import React from 'react';

export const HeroSkeleton: React.FC = () => (
  <div
    className="w-full min-h-[460px] sm:min-h-[580px] md:min-h-[620px] rounded-2xl border border-[#272B3A] bg-[#111421] mb-8 sm:mb-12 p-5 sm:p-8 md:p-12 flex flex-col justify-end animate-pulse"
    aria-hidden="true"
  >
    <div className="space-y-4 max-w-2xl">
      <div className="h-3 w-40 rounded bg-[#191D2B]" />
      <div className="h-10 sm:h-12 w-3/4 rounded-lg bg-[#191D2B]" />
      <div className="h-4 w-1/2 rounded bg-[#191D2B]" />
      <div className="space-y-2">
        <div className="h-3.5 w-full rounded bg-[#191D2B]" />
        <div className="h-3.5 w-5/6 rounded bg-[#191D2B]" />
      </div>
      <div className="flex gap-3 pt-2">
        <div className="h-11 w-36 rounded-xl bg-[#191D2B]" />
        <div className="h-11 w-32 rounded-xl bg-[#191D2B]" />
      </div>
    </div>
  </div>
);

export const MediaRailSkeleton: React.FC = () => (
  <div className="my-8 sm:my-10 space-y-4 animate-pulse" aria-hidden="true">
    <div className="flex items-end justify-between px-1">
      <div className="space-y-2">
        <div className="h-6 w-52 rounded bg-[#191D2B]" />
        <div className="h-3 w-72 max-w-[70vw] rounded bg-[#191D2B]" />
      </div>
      <div className="hidden sm:block h-4 w-16 rounded bg-[#191D2B]" />
    </div>
    <div className="flex gap-3.5 sm:gap-4 overflow-hidden px-1">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div
          key={n}
          className="w-[164px] sm:w-[202px] md:w-[230px] shrink-0 rounded-xl border border-[#272B3A] bg-[#111421] overflow-hidden"
        >
          <div className="aspect-[2/3] w-full bg-[#191D2B]" />
          <div className="p-3.5 space-y-2">
            <div className="h-4 w-3/4 rounded bg-[#191D2B]" />
            <div className="h-3 w-1/2 rounded bg-[#191D2B]" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const TrailersGridSkeleton: React.FC = () => (
  <div className="my-10 space-y-4 animate-pulse" aria-hidden="true">
    <div className="space-y-2 px-1">
      <div className="h-6 w-60 rounded bg-[#191D2B]" />
      <div className="h-3 w-80 max-w-[75vw] rounded bg-[#191D2B]" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className="rounded-xl bg-[#111421] border border-[#272B3A] overflow-hidden"
        >
          <div className="aspect-video w-full bg-[#191D2B]" />
          <div className="p-3 space-y-1.5">
            <div className="h-3.5 w-3/4 rounded bg-[#191D2B]" />
            <div className="h-3 w-1/2 rounded bg-[#191D2B]" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const EditorialPreviewSkeleton: React.FC = () => (
  <div
    className="my-10 sm:my-12 p-5 sm:p-8 rounded-2xl bg-[#111421] border border-[#272B3A] space-y-6 animate-pulse"
    aria-hidden="true"
  >
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="space-y-2">
        <div className="h-3 w-28 rounded bg-[#191D2B]" />
        <div className="h-7 w-72 max-w-[75vw] rounded bg-[#191D2B]" />
      </div>
      <div className="h-4 w-28 rounded bg-[#191D2B]" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
      {[1, 2, 3].map((n) => (
        <div key={n} className="space-y-2.5">
          <div className="aspect-[16/9] w-full rounded-xl bg-[#191D2B]" />
          <div className="h-3 w-24 rounded bg-[#191D2B]" />
          <div className="h-4 w-5/6 rounded bg-[#191D2B]" />
          <div className="h-3 w-full rounded bg-[#191D2B]" />
        </div>
      ))}
    </div>
  </div>
);

export const DiscoverSkeleton: React.FC = () => (
  <div
    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
    role="status"
    aria-busy="true"
    aria-label="Loading featured titles and curated rails"
    data-testid="discover-skeleton"
  >
    <HeroSkeleton />
    <MediaRailSkeleton />
    <MediaRailSkeleton />
    <MediaRailSkeleton />
    <TrailersGridSkeleton />
    <EditorialPreviewSkeleton />
  </div>
);

export const CatalogCardGridSkeleton: React.FC<{ count?: number }> = ({ count = 10 }) => (
  <div
    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5 lg:gap-6 animate-pulse"
    aria-hidden="true"
  >
    {Array.from({ length: count }, (_, idx) => (
      <div
        key={idx}
        className="rounded-xl border border-[#272B3A] bg-[#111421] overflow-hidden"
      >
        <div className="aspect-[2/3] w-full bg-[#191D2B]" />
        <div className="p-3.5 space-y-2">
          <div className="h-4 w-4/5 rounded bg-[#191D2B]" />
          <div className="h-3 w-1/2 rounded bg-[#191D2B]" />
          <div className="flex items-center justify-between pt-1">
            <div className="h-3 w-12 rounded bg-[#191D2B]" />
            <div className="h-3 w-14 rounded bg-[#191D2B]" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const CatalogGridSkeleton: React.FC = () => (
  <div
    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse"
    role="status"
    aria-busy="true"
    aria-label="Loading media catalog"
    data-testid="catalog-skeleton"
  >
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="space-y-2.5">
        <div className="h-3 w-36 rounded bg-[#191D2B]" />
        <div className="h-9 sm:h-10 w-64 sm:w-80 rounded-lg bg-[#191D2B]" />
        <div className="h-3.5 w-96 max-w-[85vw] rounded bg-[#191D2B]" />
      </div>
      <div className="h-4 w-24 rounded bg-[#191D2B]" />
    </div>

    {/* Filter Toolbar */}
    <div className="p-4 rounded-2xl bg-[#111421] border border-[#272B3A]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex items-center gap-2">
          <div className="h-9 lg:w-28 rounded-lg bg-[#191D2B]" />
          <div className="h-9 lg:w-24 rounded-lg bg-[#191D2B]" />
          <div className="h-9 lg:w-28 rounded-lg bg-[#191D2B]" />
          <div className="h-9 lg:w-32 rounded-lg bg-[#191D2B]" />
        </div>
        <div className="h-9 w-full lg:w-48 rounded-lg bg-[#191D2B]" />
      </div>
    </div>

    {/* Card Grid */}
    <CatalogCardGridSkeleton count={10} />
  </div>
);

export const EditorialSkeleton: React.FC = () => (
  <div
    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse"
    role="status"
    aria-busy="true"
    aria-label="Loading editorial dispatches"
    data-testid="editorial-skeleton"
  >
    <div className="space-y-2.5">
      <div className="h-3 w-32 rounded bg-[#191D2B]" />
      <div className="h-9 sm:h-10 w-72 sm:w-96 rounded-lg bg-[#191D2B]" />
      <div className="h-3.5 w-80 max-w-[85vw] rounded bg-[#191D2B]" />
    </div>

    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="h-8 w-24 rounded-lg bg-[#191D2B] border border-[#272B3A]" />
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 rounded-2xl border border-[#272B3A] bg-[#111421] p-5 sm:p-6">
      <div className="aspect-[16/9] rounded-xl bg-[#191D2B]" />
      <div className="flex flex-col justify-center space-y-3">
        <div className="h-3 w-28 rounded bg-[#191D2B]" />
        <div className="h-7 w-5/6 rounded bg-[#191D2B]" />
        <div className="h-4 w-full rounded bg-[#191D2B]" />
        <div className="h-4 w-3/4 rounded bg-[#191D2B]" />
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((n) => (
        <div key={n} className="rounded-xl border border-[#272B3A] bg-[#111421] overflow-hidden">
          <div className="aspect-[16/9] bg-[#191D2B]" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-24 rounded bg-[#191D2B]" />
            <div className="h-4 w-5/6 rounded bg-[#191D2B]" />
            <div className="h-3 w-full rounded bg-[#191D2B]" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const AccountSkeleton: React.FC = () => (
  <div
    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse"
    role="status"
    aria-busy="true"
    aria-label="Loading library and account workspace"
    data-testid="account-skeleton"
  >
    <div className="p-6 rounded-2xl border border-[#272B3A] bg-[#111421] flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-[#191D2B] shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-5 w-48 rounded bg-[#191D2B]" />
        <div className="h-3 w-64 max-w-full rounded bg-[#191D2B]" />
      </div>
    </div>
    <div className="flex gap-2 overflow-hidden">
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className="h-9 w-28 rounded-xl bg-[#191D2B] shrink-0" />
      ))}
    </div>
    <CatalogCardGridSkeleton count={5} />
  </div>
);

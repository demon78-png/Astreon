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
    <div className="space-y-2 px-1">
      <div className="h-6 w-52 rounded bg-[#191D2B]" />
      <div className="h-3 w-72 rounded bg-[#191D2B]" />
    </div>
    <div className="flex gap-3.5 sm:gap-4 overflow-hidden px-1">
      {[1, 2, 3, 4, 5].map((n) => (
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

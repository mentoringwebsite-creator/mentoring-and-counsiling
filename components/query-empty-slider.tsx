'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';

type Slide = {
  title: string;
  description: string;
};

type QueryEmptySliderProps = {
  slides: Slide[];
  accentClassName?: string;
};

export function QueryEmptySlider({ slides, accentClassName = 'text-sky-600' }: QueryEmptySliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  useEffect(() => {
    if (slides.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, [slides.length]);

  const goPrev = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchEndX(null);
    setTouchStartX(event.targetTouches[0].clientX);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchEndX(event.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null || slides.length <= 1) return;

    const swipeDistance = touchStartX - touchEndX;
    const minSwipeDistance = 40;

    if (swipeDistance > minSwipeDistance) {
      goNext();
    }

    if (swipeDistance < -minSwipeDistance) {
      goPrev();
    }
  };

  if (slides.length === 0) return null;

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white/60 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white/60 to-transparent" />

      <div className="flex h-full flex-1 items-center justify-center px-6 py-10 text-center sm:px-10">
        <div key={activeIndex} className="animate-fadeIn">
          <div className="mb-5 flex items-center justify-center">
            <div className={`rounded-2xl bg-white p-3 shadow-sm ${accentClassName}`}>
              <MessageSquare className="h-9 w-9 stroke-1.5" />
            </div>
          </div>

          <h4 className="text-2xl font-bold text-slate-800 sm:text-3xl">{slides[activeIndex].title}</h4>
          <p className="mx-auto mt-3 max-w-[560px] text-sm leading-relaxed text-slate-500 sm:text-base">
            {slides[activeIndex].description}
          </p>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 p-2 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800 sm:inline-flex"
            aria-label="Previous hint"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 p-2 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800 sm:inline-flex"
            aria-label="Next hint"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800 sm:hidden"
              aria-label="Previous hint"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>

            <div className="mx-1 flex items-center gap-1.5 rounded-full bg-white/80 px-2 py-1">
              {slides.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-5 bg-slate-700' : 'w-1.5 bg-slate-300'}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800 sm:hidden"
              aria-label="Next hint"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

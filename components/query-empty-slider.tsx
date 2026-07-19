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
    <div className="flex h-full items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 sm:p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-center">
          <div className={`rounded-2xl bg-white p-3 shadow-sm ${accentClassName}`}>
            <MessageSquare className="h-8 w-8 stroke-1.5" />
          </div>
        </div>

        <div
          className="relative min-h-[120px] touch-pan-y text-center sm:min-h-[112px]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div key={activeIndex} className="animate-fadeIn">
            <h4 className="text-base font-bold text-slate-800">{slides[activeIndex].title}</h4>
            <p className="mx-auto mt-2 max-w-[300px] text-xs leading-relaxed text-slate-500 sm:text-sm">
              {slides[activeIndex].description}
            </p>
          </div>
        </div>

        {slides.length > 1 && (
          <div className="mt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
              aria-label="Previous hint"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>

            <div className="flex items-center gap-1.5">
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
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
              aria-label="Next hint"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

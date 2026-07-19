'use client';

import { MessageSquare } from 'lucide-react';

type Slide = {
  title: string;
  description: string;
};

type QueryEmptySliderProps = {
  slides: Slide[];
  accentClassName?: string;
};

export function QueryEmptySlider({ slides, accentClassName = 'text-sky-600' }: QueryEmptySliderProps) {
  if (slides.length === 0) return null;

  const currentSlide = slides[0];

  return (
    <div className="flex h-full w-full items-center justify-center px-4 py-8 text-center sm:px-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-4 flex items-center justify-center">
          <div className={`rounded-2xl bg-slate-100 p-3 ${accentClassName}`}>
            <MessageSquare className="h-9 w-9 stroke-1.5" />
          </div>
        </div>
        <h4 className="text-xl font-bold text-slate-800 sm:text-2xl">{currentSlide.title}</h4>
        <p className="mx-auto mt-2 max-w-[560px] text-sm leading-relaxed text-slate-500 sm:text-base">
          {currentSlide.description}
        </p>
      </div>
    </div>
  );
}

// Booking Widget > Calendar Grid (dark-themed month picker)
"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface BookingCalendarProps {
  currentMonth: Date;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onChangeMonth: (direction: "prev" | "next") => void;
  availableDays: number[];
  maxAdvanceDays: number;
}

export default function BookingCalendar({
  currentMonth,
  selectedDate,
  onSelectDate,
  onChangeMonth,
  availableDays,
  maxAdvanceDays,
}: BookingCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + maxAdvanceDays);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [maxAdvanceDays]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const canGoPrev = useMemo(() => {
    const lastDayPrev = new Date(year, month, 0);
    return (
      lastDayPrev >= today &&
      new Date(year, month - 1, 1) >=
        new Date(today.getFullYear(), today.getMonth(), 1)
    );
  }, [year, month, today]);

  const canGoNext = useMemo(() => {
    return new Date(year, month + 1, 1) <= maxDate;
  }, [year, month, maxDate]);

  function isAvailable(day: number): boolean {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    if (date < today) return false;
    if (date > maxDate) return false;
    if (!availableDays.includes(date.getDay())) return false;
    return true;
  }

  function isToday(day: number): boolean {
    return (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate()
    );
  }

  function dateKey(day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return (
    <div className="flex flex-col">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => onChangeMonth("prev")}
          disabled={!canGoPrev}
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-white">{monthLabel}</span>
        <button
          type="button"
          onClick={() => onChangeMonth("next")}
          disabled={!canGoNext}
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-medium text-gray-500 uppercase"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="w-10 h-10" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = dateKey(day);
          const available = isAvailable(day);
          const selected = selectedDate === key;
          const todayMark = isToday(day);

          return (
            <button
              key={key}
              type="button"
              disabled={!available}
              onClick={() => onSelectDate(key)}
              className={`
                w-10 h-10 rounded-full text-sm font-medium transition-all
                flex items-center justify-center
                ${
                  selected
                    ? "bg-[#DC2626] text-white font-bold"
                    : available
                    ? "text-white hover:bg-white/15 cursor-pointer"
                    : "text-gray-600 cursor-not-allowed"
                }
                ${todayMark && !selected ? "ring-1 ring-gray-500" : ""}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

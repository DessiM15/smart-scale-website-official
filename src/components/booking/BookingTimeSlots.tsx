// Booking Widget > Time Slot List
"use client";

interface Slot {
  start: string;
  end: string;
}

interface BookingTimeSlotsProps {
  date: string | null;
  slots: Slot[];
  isLoading: boolean;
  selectedSlot: string | null;
  onSelectSlot: (start: string) => void;
  timezone: string;
  serverTimezone: string;
  use24h: boolean;
  onToggle24h: () => void;
}

function convertTime(
  time24: string,
  date: string,
  fromTz: string,
  toTz: string,
  use24h: boolean
): string {
  const dateObj = new Date(`${date}T${time24}:00`);
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: !use24h,
    timeZone: toTz,
  };
  try {
    return new Intl.DateTimeFormat("en-US", options).format(dateObj);
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      ...options,
      timeZone: fromTz,
    }).format(dateObj);
  }
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", day: "2-digit" });
}

export default function BookingTimeSlots({
  date,
  slots,
  isLoading,
  selectedSlot,
  onSelectSlot,
  timezone,
  serverTimezone,
  use24h,
  onToggle24h,
}: BookingTimeSlotsProps) {
  if (!date) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">
        Select a date to view available times
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-white">
          {formatDateHeader(date)}
        </span>
        <div className="flex rounded-md overflow-hidden border border-white/20">
          <button
            type="button"
            onClick={() => !use24h || onToggle24h()}
            className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
              !use24h
                ? "bg-white/20 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            12h
          </button>
          <button
            type="button"
            onClick={() => use24h || onToggle24h()}
            className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
              use24h
                ? "bg-white/20 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            24h
          </button>
        </div>
      </div>

      {/* Slots */}
      <div className="flex-1 overflow-y-auto space-y-2 max-h-[280px] pr-1">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-lg bg-white/5 animate-pulse"
            />
          ))
        ) : slots.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-8">
            No available times for this date
          </div>
        ) : (
          slots.map((slot) => {
            const displayTime = convertTime(
              slot.start,
              date,
              serverTimezone,
              timezone,
              use24h
            );
            const isSelected = selectedSlot === slot.start;

            return (
              <button
                key={slot.start}
                type="button"
                onClick={() => onSelectSlot(slot.start)}
                className={`
                  w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all
                  border text-center
                  ${
                    isSelected
                      ? "bg-[#DC2626] text-white border-[#DC2626] font-bold"
                      : "border-white/20 text-white hover:border-[#DC2626]/60 hover:bg-[#DC2626]/10"
                  }
                `}
              >
                {displayTime}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

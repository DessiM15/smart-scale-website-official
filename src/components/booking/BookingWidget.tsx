// Booking Widget > 3-Panel Orchestrator (Cal.com-style)
"use client";

import { useState, useCallback, useEffect } from "react";
import { Clock, Video, CheckCircle2, Globe } from "lucide-react";
import BookingCalendar from "./BookingCalendar";
import BookingTimeSlots from "./BookingTimeSlots";
import BookingForm from "./BookingForm";

const API_BASE = process.env.NEXT_PUBLIC_BOOKING_API_URL || "";

type Step = "calendar" | "form" | "success";

interface Slot {
  start: string;
  end: string;
}

const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "America/Toronto", label: "Toronto (ET)" },
  { value: "America/Vancouver", label: "Vancouver (PT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

function detectTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (COMMON_TIMEZONES.some((t) => t.value === tz)) return tz;
    return "America/Chicago";
  } catch {
    return "America/Chicago";
  }
}

const SERVER_TIMEZONE = "America/Chicago";
const AVAILABLE_DAYS = [1, 2, 3, 4, 5];
const MAX_ADVANCE_DAYS = 30;

export default function BookingWidget() {
  const [step, setStep] = useState<Step>("calendar");
  const [timezone, setTimezone] = useState("America/Chicago");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [use24h, setUse24h] = useState(false);
  const [meetingLink, setMeetingLink] = useState<string | null>(null);

  useEffect(() => {
    setTimezone(detectTimezone());
  }, []);

  const fetchSlots = useCallback(
    async (date: string) => {
      setIsLoadingSlots(true);
      setSlots([]);
      setSelectedSlot(null);

      try {
        const res = await fetch(
          `${API_BASE}/api/booking/available-slots?date=${date}&timezone=${timezone}`
        );
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots ?? []);
        }
      } catch {
        setSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    },
    [timezone]
  );

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    fetchSlots(date);
  }

  function handleSelectSlot(start: string) {
    setSelectedSlot(start);
    setStep("form");
  }

  function handleChangeMonth(direction: "prev" | "next") {
    setCurrentMonth((prev) => {
      const y = prev.getFullYear();
      const m = prev.getMonth();
      return direction === "next"
        ? new Date(y, m + 1, 1)
        : new Date(y, m - 1, 1);
    });
  }

  function handleFormBack() {
    setStep("calendar");
    setSelectedSlot(null);
  }

  function handleFormSuccess(result: { meetingLink: string | null }) {
    setMeetingLink(result.meetingLink);
    setStep("success");
  }

  function handleReset() {
    setStep("calendar");
    setSelectedDate(null);
    setSelectedSlot(null);
    setSlots([]);
    setMeetingLink(null);
  }

  function handleTimezoneChange(tz: string) {
    setTimezone(tz);
    if (selectedDate) {
      setIsLoadingSlots(true);
      setSlots([]);
      setSelectedSlot(null);
      fetch(
        `${API_BASE}/api/booking/available-slots?date=${selectedDate}&timezone=${tz}`
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setSlots(data?.slots ?? []))
        .catch(() => setSlots([]))
        .finally(() => setIsLoadingSlots(false));
    }
  }

  // Success view
  if (step === "success") {
    const displayDate = selectedDate
      ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "";

    const displayTime =
      selectedSlot && selectedDate
        ? new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: timezone,
          }).format(new Date(`${selectedDate}T${selectedSlot}:00`))
        : "";

    return (
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 md:p-12 max-w-2xl mx-auto text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#DC2626]/10 mb-6">
          <CheckCircle2 className="h-8 w-8 text-[#DC2626]" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          Meeting Confirmed!
        </h3>
        <p className="text-gray-400 mb-6">
          {displayDate} at {displayTime}
        </p>
        {meetingLink && (
          <a
            href={meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#DC2626] text-white font-semibold hover:bg-red-700 transition-colors mb-4"
          >
            <Video className="w-4 h-4" />
            Join with Google Meet
          </a>
        )}
        <p className="text-sm text-gray-500 mb-6">
          Check your email for a confirmation with all the details.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-[#DC2626] hover:underline"
        >
          Book Another Call
        </button>
      </div>
    );
  }

  // Form step
  if (step === "form" && selectedDate && selectedSlot) {
    return (
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 md:p-8 max-w-lg mx-auto">
        <h3 className="text-lg font-semibold text-white mb-4">Your Details</h3>
        <BookingForm
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          timezone={timezone}
          serverTimezone={SERVER_TIMEZONE}
          onBack={handleFormBack}
          onSuccess={handleFormSuccess}
        />
      </div>
    );
  }

  // Calendar step — 3-panel layout
  return (
    <div className="bg-[#111827] border border-white/10 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr_240px] lg:grid-cols-[280px_1fr_280px]">
        {/* Left info panel — hidden on mobile */}
        <div className="hidden md:flex flex-col p-6 border-r border-white/10">
          <div className="mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#DC2626]/10 flex items-center justify-center mb-3">
              <span className="text-[#DC2626] font-bold text-sm">SS</span>
            </div>
            <h3 className="text-white font-semibold text-base mb-1">
              Discovery Call
            </h3>
            <p className="text-gray-500 text-xs">
              Discuss your project with our team
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2.5 text-sm text-gray-400">
              <Clock className="w-4 h-4 shrink-0" />
              <span>30 min</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-gray-400">
              <Video className="w-4 h-4 shrink-0" />
              <span>Google Meet</span>
            </div>
          </div>

          {/* Timezone picker */}
          <div className="mt-auto">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Globe className="w-3.5 h-3.5" />
              <span>Timezone</span>
            </div>
            <select
              value={timezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              className="w-full bg-white/5 border border-white/15 rounded-md px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-[#DC2626]/60"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option
                  key={tz.value}
                  value={tz.value}
                  className="bg-[#111827]"
                >
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center — Calendar grid */}
        <div className="p-6 border-b md:border-b-0 md:border-r border-white/10">
          {/* Mobile timezone picker */}
          <div className="md:hidden flex items-center gap-2 mb-4">
            <Globe className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={timezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              className="flex-1 bg-white/5 border border-white/15 rounded-md px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-[#DC2626]/60"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option
                  key={tz.value}
                  value={tz.value}
                  className="bg-[#111827]"
                >
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
          <BookingCalendar
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onChangeMonth={handleChangeMonth}
            availableDays={AVAILABLE_DAYS}
            maxAdvanceDays={MAX_ADVANCE_DAYS}
          />
        </div>

        {/* Right — Time slots */}
        <div className="p-6 min-h-[320px]">
          <BookingTimeSlots
            date={selectedDate}
            slots={slots}
            isLoading={isLoadingSlots}
            selectedSlot={selectedSlot}
            onSelectSlot={handleSelectSlot}
            timezone={timezone}
            serverTimezone={SERVER_TIMEZONE}
            use24h={use24h}
            onToggle24h={() => setUse24h((prev) => !prev)}
          />
        </div>
      </div>
    </div>
  );
}

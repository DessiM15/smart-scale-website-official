// Booking Widget > Booking Details Form
"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_BOOKING_API_URL || "";

interface BookingFormProps {
  selectedDate: string;
  selectedSlot: string;
  timezone: string;
  serverTimezone: string;
  onBack: () => void;
  onSuccess: (result: { meetingLink: string | null }) => void;
}

function formatSummaryDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatSummaryTime(slot: string, date: string, tz: string): string {
  const d = new Date(`${date}T${slot}:00`);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  }).format(d);
}

export default function BookingForm({
  selectedDate,
  selectedSlot,
  timezone,
  onBack,
  onSuccess,
}: BookingFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");

  const displayDate = formatSummaryDate(selectedDate);
  const displayTime = formatSummaryTime(selectedSlot, selectedDate, timezone);

  const tzLabel = (() => {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        timeZoneName: "short",
      }).formatToParts(new Date());
      return parts.find((p) => p.type === "timeZoneName")?.value ?? timezone;
    } catch {
      return timezone;
    }
  })();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setGlobalError("");
    setIsPending(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot
    if (formData.get("_hp")) {
      setIsPending(false);
      return;
    }

    const name = (formData.get("name") as string).trim();
    const email = (formData.get("email") as string).trim();
    const phone = (formData.get("phone") as string).trim();
    const company = (formData.get("company") as string).trim();
    const message = (formData.get("message") as string).trim();

    const clientErrors: Record<string, string> = {};
    if (!name || name.length < 2)
      clientErrors.name = "Name must be at least 2 characters";
    if (!email || !email.includes("@"))
      clientErrors.email = "Please enter a valid email";

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setIsPending(false);
      return;
    }

    const payload = {
      name,
      email,
      phone: phone || undefined,
      company: company || undefined,
      message: message || undefined,
      date: selectedDate,
      start_time: selectedSlot,
      timezone,
    };

    try {
      const res = await fetch(`${API_BASE}/api/booking/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        if (res.status === 429) {
          setGlobalError("Too many bookings. Please try again later.");
        } else {
          setGlobalError(
            result?.error ?? "Something went wrong. Please try again."
          );
        }
        setIsPending(false);
        return;
      }

      onSuccess({ meetingLink: result.meetingLink });
    } catch {
      setGlobalError(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Summary card */}
      <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">{displayDate}</p>
            <p className="text-xs text-gray-400">
              {displayTime} {tzLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-[#DC2626] hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Change
          </button>
        </div>
      </div>

      {globalError && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {globalError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        {/* Honeypot */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <input type="text" name="_hp" tabIndex={-1} autoComplete="off" />
        </div>

        <div>
          <label
            htmlFor="booking-name"
            className="block text-xs font-medium text-gray-300 mb-1.5"
          >
            Name *
          </label>
          <input
            id="booking-name"
            name="name"
            required
            placeholder="John Smith"
            className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#DC2626]/60 transition-colors"
          />
          {errors.name && (
            <p className="text-xs text-red-400 mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="booking-email"
            className="block text-xs font-medium text-gray-300 mb-1.5"
          >
            Email *
          </label>
          <input
            id="booking-email"
            name="email"
            type="email"
            required
            placeholder="john@company.com"
            className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#DC2626]/60 transition-colors"
          />
          {errors.email && (
            <p className="text-xs text-red-400 mt-1">{errors.email}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="booking-phone"
              className="block text-xs font-medium text-gray-300 mb-1.5"
            >
              Phone
            </label>
            <input
              id="booking-phone"
              name="phone"
              type="tel"
              placeholder="+1 555-123-4567"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#DC2626]/60 transition-colors"
            />
          </div>
          <div>
            <label
              htmlFor="booking-company"
              className="block text-xs font-medium text-gray-300 mb-1.5"
            >
              Company
            </label>
            <input
              id="booking-company"
              name="company"
              placeholder="Acme Inc."
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#DC2626]/60 transition-colors"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="booking-message"
            className="block text-xs font-medium text-gray-300 mb-1.5"
          >
            Anything you&apos;d like to discuss?
          </label>
          <textarea
            id="booking-message"
            name="message"
            rows={3}
            placeholder="Tell us about your project..."
            className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#DC2626]/60 resize-none transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 px-6 rounded-lg bg-[#DC2626] text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Booking...
            </>
          ) : (
            "Confirm Booking"
          )}
        </button>
      </form>
    </div>
  );
}

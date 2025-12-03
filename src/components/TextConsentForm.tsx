"use client";

import { useState } from "react";

interface TextConsentFormProps {
  onVerificationSent: (phone: string, name: string, email: string) => void;
}

export default function TextConsentForm({ onVerificationSent }: TextConsentFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/sms/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus({
          type: "success",
          message: "Verification code sent! Please check your phone.",
        });
        // Call the callback to open verification modal
        onVerificationSent(formData.phone, formData.name, formData.email);
      } else {
        setSubmitStatus({
          type: "error",
          message: result.error || "Something went wrong. Please try again later.",
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: "Failed to send verification code. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Subscribe to receive text message updates and notifications from Smart Scale.
        </p>
      </div>
      <div>
        <label htmlFor="consent-name" className="block text-sm font-medium mb-2">
          Name
        </label>
        <input
          type="text"
          id="consent-name"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626] outline-none"
        />
      </div>
      <div>
        <label htmlFor="consent-email" className="block text-sm font-medium mb-2">
          Email
        </label>
        <input
          type="email"
          id="consent-email"
          name="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626] outline-none"
        />
      </div>
      <div>
        <label htmlFor="consent-phone" className="block text-sm font-medium mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          id="consent-phone"
          name="phone"
          required
          value={formData.phone}
          onChange={handleChange}
          placeholder="(555) 123-4567"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626] outline-none"
        />
      </div>
      {submitStatus.type && (
        <div
          className={`p-4 rounded-lg ${
            submitStatus.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {submitStatus.message}
        </div>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-8 py-4 bg-[#DC2626] text-white rounded-full text-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Sending..." : "Send Verification Code"}
      </button>
    </form>
  );
}


"use client";

import { useState, useEffect } from "react";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  phone: string;
}

export default function VerificationModal({
  isOpen,
  onClose,
  onSuccess,
  phone,
}: VerificationModalProps) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCode("");
      setError(null);
    }
  }, [isOpen]);

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      const firstInput = document.getElementById("code-0");
      firstInput?.focus();
    }
  }, [isOpen]);

  const handleCodeChange = (value: string, index: number) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "");
    if (digit.length > 1) return;

    const newCode = code.split("");
    newCode[index] = digit;
    const updatedCode = newCode.join("").slice(0, 6);
    setCode(updatedCode);

    // Auto-focus next input
    if (digit && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }

    // Clear error when user types
    if (error) setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    // Handle backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setCode(pastedData);
    
    // Focus the last filled input or the first empty one
    const focusIndex = Math.min(pastedData.length, 5);
    const input = document.getElementById(`code-${focusIndex}`);
    input?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch("/api/sms/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          code,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || "Invalid verification code. Please try again.");
        setCode("");
        // Focus first input on error
        const firstInput = document.getElementById("code-0");
        firstInput?.focus();
      }
    } catch (error) {
      setError("Failed to verify code. Please try again.");
      setCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-black">Verify Your Phone Number</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          We sent a verification code to <span className="font-semibold">{phone}</span>.
          Please enter the 6-digit code below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={code[index] || ""}
                onChange={(e) => handleCodeChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626] outline-none"
              />
            ))}
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-50 text-red-800 border border-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || code.length !== 6}
              className="flex-1 px-6 py-3 bg-[#DC2626] text-white rounded-full font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </button>
          </div>
        </form>

        <p className="text-sm text-gray-500 text-center mt-4">
          Didn't receive the code?{" "}
          <button
            type="button"
            onClick={() => {
              // This would trigger a resend - for now just close and let user resubmit form
              onClose();
            }}
            className="text-[#DC2626] hover:underline"
          >
            Resend code
          </button>
        </p>
      </div>
    </div>
  );
}


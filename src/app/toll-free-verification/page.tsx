"use client";

import { useState } from "react";
import TextConsentForm from "@/components/TextConsentForm";
import VerificationModal from "@/components/VerificationModal";

export default function TollFreeVerification() {
  const phoneNumber = "+18335885916";
  const companyName = "Smart Scale";
  const companyEmail = "project@ssl-mail.com";
  
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationData, setVerificationData] = useState<{
    phone: string;
    name: string;
    email: string;
  } | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12">
          <h1 className="text-4xl font-bold text-black mb-6">
            Toll-Free Number Verification
          </h1>

          <div className="space-y-8">
            {/* Phone Number Display */}
            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">
                Our Toll-Free Number
              </h2>
              <p className="text-3xl font-bold text-[#DC2626] mb-2">
                {phoneNumber}
              </p>
              <p className="text-gray-600">
                This number is used by {companyName} for SMS verification and text message communications.
              </p>
            </section>

            {/* Purpose */}
            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">
                Purpose of This Number
              </h2>
              <p className="text-gray-700 mb-4">
                This toll-free number ({phoneNumber}) is used by {companyName} to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Send SMS verification codes for account verification</li>
                <li>Send important updates and notifications to subscribers</li>
                <li>Communicate project milestones and updates</li>
                <li>Send exclusive offers and promotions to opted-in subscribers</li>
              </ul>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">
                Contact Information
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <span className="font-semibold">Company:</span> {companyName}
                </p>
                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  <a
                    href={`mailto:${companyEmail}`}
                    className="text-[#DC2626] hover:underline"
                  >
                    {companyEmail}
                  </a>
                </p>
                <p>
                  <span className="font-semibold">Location:</span> Texas, United States
                </p>
              </div>
            </section>

            {/* Opt-Out Information */}
            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">
                Message Frequency & Opt-Out
              </h2>
              <p className="text-gray-700 mb-4">
                Message frequency varies. You may receive messages for verification codes, important updates, and promotional content if you have opted in.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>To opt-out:</strong> Reply STOP to {phoneNumber} to unsubscribe from promotional messages at any time. 
                You will still receive verification codes if needed for account security.
              </p>
              <p className="text-gray-700">
                <strong>For help:</strong> Reply HELP to {phoneNumber} for assistance.
              </p>
            </section>

            {/* Terms and Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">
                Terms of Service & Privacy Policy
              </h2>
              <p className="text-gray-700 mb-4">
                By using our SMS services, you agree to our terms of service and privacy policy.
              </p>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <strong>Carrier Charges:</strong> Message and data rates may apply. 
                  Check with your mobile carrier for details.
                </p>
                <p className="text-gray-700">
                  <strong>Supported Carriers:</strong> All major U.S. carriers are supported, 
                  including but not limited to AT&T, Verizon, T-Mobile, Sprint, and others.
                </p>
              </div>
            </section>

            {/* Opt-In Consent Form */}
            <section className="bg-gray-50 p-6 rounded-lg border-2 border-[#DC2626]">
              <h2 className="text-2xl font-semibold text-black mb-4">
                Opt-In to Receive Text Messages
              </h2>
              <p className="text-gray-700 mb-6">
                By filling out the form below, you are providing explicit consent to receive 
                text messages from {companyName} at {phoneNumber}. You agree to receive 
                automated text messages, including verification codes, updates, and promotional 
                messages. Message and data rates may apply.
              </p>
              
              {isVerified ? (
                <div className="p-6 rounded-lg bg-green-50 text-green-800 border border-green-200">
                  <div className="flex items-center gap-3 mb-2">
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <h3 className="text-xl font-semibold">Successfully Opted-In!</h3>
                  </div>
                  <p className="text-lg">
                    Thank you for subscribing! You have provided consent to receive text 
                    messages from {companyName} at {phoneNumber}. You can opt-out at any 
                    time by replying STOP.
                  </p>
                </div>
              ) : (
                <TextConsentForm
                  onVerificationSent={(phone, name, email) => {
                    setVerificationData({ phone, name, email });
                    setIsVerificationModalOpen(true);
                  }}
                />
              )}
            </section>

            {/* Compliance Notice */}
            <section className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-black mb-3">
                Compliance Notice
              </h2>
              <p className="text-gray-700 text-sm">
                This toll-free number is registered with Twilio and complies with 
                TCPA (Telephone Consumer Protection Act) regulations. We only send 
                messages to users who have explicitly opted in to receive SMS communications. 
                All messages include opt-out instructions.
              </p>
            </section>

            {/* Back to Site */}
            <div className="pt-6 border-t border-gray-200">
              <a
                href="/"
                className="inline-block px-6 py-3 bg-[#DC2626] text-white rounded-full font-semibold hover:bg-red-700 transition"
              >
                Return to Smart Scale Homepage
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {verificationData && (
        <VerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          onSuccess={() => {
            setIsVerified(true);
            setVerificationData(null);
          }}
          phone={verificationData.phone}
        />
      )}
    </div>
  );
}


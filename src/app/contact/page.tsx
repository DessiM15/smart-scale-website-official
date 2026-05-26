"use client";

import { useState } from "react";
import ContactForm from "@/components/ContactForm";
import TextConsentForm from "@/components/TextConsentForm";
import VerificationModal from "@/components/VerificationModal";
import Link from "next/link";

export default function Contact() {
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationData, setVerificationData] = useState<{
    phone: string;
    name: string;
    email: string;
  } | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Hero with gradient mesh */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 30% 40%, rgba(185, 28, 28, 0.07) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 70%, rgba(220, 38, 38, 0.05) 0%, transparent 45%),
              radial-gradient(ellipse at 60% 20%, rgba(139, 0, 0, 0.06) 0%, transparent 40%)
            `,
          }}
        />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl sm:text-6xl md:text-7xl mb-6 hero-headline">
            Start a Conversation
          </h1>
          <p className="text-lg sm:text-xl text-white/50 max-w-3xl mx-auto mb-8 hero-subheadline">
            Every great partnership begins with a conversation. Tell us about
            your vision and we&apos;ll explore how we can bring it to life.
          </p>
          <div className="flex justify-center">
            <Link
              href="#contact-form"
              className="inline-flex items-center gap-3 px-8 py-3.5 border border-white/20 rounded-full text-sm uppercase tracking-widest text-white/80 hover:text-white hover:border-white/40 transition-all duration-500"
            >
              Send Project Details
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Form and Info */}
      <section id="contact-form" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl mb-6 text-white">
                Send us a message
              </h2>
              <ContactForm />
            </div>

            <div>
              <h2 className="text-3xl mb-6 text-white">
                Contact Information
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm uppercase tracking-widest text-white/40 mb-2">
                    Email
                  </h3>
                  <a
                    href="mailto:project@ssl-mail.com"
                    className="text-white/70 hover:text-white transition-colors duration-300 text-lg"
                  >
                    project@ssl-mail.com
                  </a>
                </div>
                <div>
                  <h3 className="text-sm uppercase tracking-widest text-white/40 mb-2">
                    Phone
                  </h3>
                  <div className="space-y-2">
                    <a
                      href="tel:8324070773"
                      className="text-white/70 hover:text-white transition-colors duration-300 text-lg block"
                    >
                      Jay: 832.407.0773
                    </a>
                    <a
                      href="tel:8327905001"
                      className="text-white/70 hover:text-white transition-colors duration-300 text-lg block"
                    >
                      Dee: 832.790.5001
                    </a>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm uppercase tracking-widest text-white/40 mb-2">
                    Location
                  </h3>
                  <p className="text-white/50 text-lg">Texas, United States</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SMS Consent Form Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl bg-[#161616] border border-white/[0.06] p-8 sm:p-12">
            <h2 className="text-3xl mb-4 text-white">
              Subscribe to Updates
            </h2>
            <p className="text-white/50 mb-8">
              Stay connected with Smart Scale. Receive project milestones and
              updates via text message.
            </p>

            {isVerified ? (
              <div className="p-6 rounded-lg bg-green-900/20 text-green-400 border border-green-500/20">
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
                  <h3 className="text-xl font-semibold">
                    Successfully Verified
                  </h3>
                </div>
                <p className="text-lg">
                  Thank you for subscribing. You will now receive updates from
                  Smart Scale.
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
          </div>
        </div>
      </section>

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

"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "$99",
    period: "/mo",
    popular: false,
    features: [
      "Static ad displayed on screens",
      "1x per loop rotation",
      "Single screen placement",
      "Basic positioning",
    ],
  },
  {
    name: "Standard",
    price: "$199",
    period: "/mo",
    popular: true,
    features: [
      "Static ad with design included",
      "All screens in restaurant",
      "Priority positioning",
      "Monthly performance check-in",
    ],
  },
  {
    name: "Premium",
    price: "$399",
    period: "/mo",
    popular: false,
    features: [
      "Animated or video ad",
      "2x per loop rotation",
      "All screens, best positioning",
      "Monthly creative refresh",
    ],
  },
];

export default function AdvertisePage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.append("access_key", "YOUR_WEB3FORMS_ACCESS_KEY");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch {
      // Form submission failed silently
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Image
            src="/assets/mex-taco-logo.png"
            alt="Mex Taco House"
            width={140}
            height={50}
            className="h-10 w-auto"
          />
          <a
            href="#contact-form"
            className="px-6 py-2.5 bg-[#DC2626] text-white rounded-full text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Get Started
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 bg-[#DC2626]/10 text-[#DC2626] rounded-full text-sm font-semibold mb-6">
            Only 10 Spots Available
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#111111] mb-6 leading-tight" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Advertise at Mex Taco House
          </h1>
          <p className="text-lg sm:text-xl text-black/60 max-w-2xl mx-auto mb-10">
            Put your business in front of a captive audience. Our in-restaurant
            TV screens reach hundreds of hungry diners every single week.
          </p>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#DC2626] text-white rounded-full text-lg font-semibold hover:bg-red-700 transition-all duration-300 hover:scale-105"
          >
            View Plans & Pricing
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" className="w-5 h-5">
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </section>

      {/* Stats - Dark */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#111111]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl sm:text-6xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>500+</div>
              <p className="text-white/50 text-lg">Diners per week</p>
            </div>
            <div>
              <div className="text-5xl sm:text-6xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>45+</div>
              <p className="text-white/50 text-lg">Min average dwell time</p>
            </div>
            <div>
              <div className="text-5xl sm:text-6xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>6</div>
              <p className="text-white/50 text-lg">Days per week</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Light */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111111] text-center mb-16" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { num: "1", title: "Pick a Plan", desc: "Choose the package that fits your budget and goals." },
              { num: "2", title: "We Design Your Ad", desc: "Our team creates a professional ad tailored to your business." },
              { num: "3", title: "You're On Screen", desc: "Your ad goes live on our in-restaurant TV screens within days." },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-14 h-14 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-xl font-bold mx-auto mb-5">
                  {step.num}
                </div>
                <h3 className="text-xl font-bold text-[#111111] mb-3">{step.title}</h3>
                <p className="text-black/50">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Tiers - Dark */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#111111]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Simple, Transparent Pricing
          </h2>
          <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">
            3-month initial commitment, then month-to-month. 30-day cancellation notice.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 relative ${
                  plan.popular
                    ? "bg-[#DC2626] text-white ring-2 ring-[#DC2626] scale-105"
                    : "bg-[#1A1A1A] text-white border border-white/[0.08]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-[#DC2626] rounded-full text-xs font-bold uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={plan.popular ? "text-white/70" : "text-white/50"}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${plan.popular ? "text-white" : "text-[#DC2626]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={plan.popular ? "text-white/90" : "text-white/60"}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact-form"
                  className={`block w-full py-3 rounded-full text-center font-semibold transition-colors ${
                    plan.popular
                      ? "bg-white text-[#DC2626] hover:bg-white/90"
                      : "bg-[#DC2626] text-white hover:bg-red-700"
                  }`}
                >
                  Get Started
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form - Light */}
      <section id="contact-form" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111111] text-center mb-4" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Reserve Your Spot
          </h2>
          <p className="text-black/50 text-center mb-10">
            Fill out the form below and we&apos;ll get back to you within 24 hours.
          </p>

          {isSubmitted ? (
            <div className="p-8 rounded-2xl bg-green-50 border border-green-200 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-green-800 mb-2">Thank You!</h3>
              <p className="text-green-700">
                We&apos;ve received your inquiry. A member of our team will reach out within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <input type="hidden" name="subject" value="New Mex Taco House Advertising Inquiry" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#111111] mb-1.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#F5F5F5] text-[#111111] placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]/30 transition"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="business" className="block text-sm font-medium text-[#111111] mb-1.5">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    id="business"
                    name="business_name"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#F5F5F5] text-[#111111] placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]/30 transition"
                    placeholder="Your business name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#111111] mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#F5F5F5] text-[#111111] placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]/30 transition"
                    placeholder="you@business.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[#111111] mb-1.5">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#F5F5F5] text-[#111111] placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]/30 transition"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="package" className="block text-sm font-medium text-[#111111] mb-1.5">
                  Package Interest *
                </label>
                <select
                  id="package"
                  name="package_interest"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#F5F5F5] text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]/30 transition"
                >
                  <option value="">Select a package</option>
                  <option value="Starter - $99/mo">Starter — $99/mo</option>
                  <option value="Standard - $199/mo">Standard — $199/mo</option>
                  <option value="Premium - $399/mo">Premium — $399/mo</option>
                </select>
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-[#111111] mb-1.5">
                  Industry / What do you sell? *
                </label>
                <input
                  type="text"
                  id="industry"
                  name="industry"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#F5F5F5] text-[#111111] placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]/30 transition"
                  placeholder="e.g., Auto Repair, Insurance, Real Estate..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="has_creative" className="block text-sm font-medium text-[#111111] mb-1.5">
                    Have ad creative already?
                  </label>
                  <select
                    id="has_creative"
                    name="has_creative"
                    className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#F5F5F5] text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]/30 transition"
                  >
                    <option value="No, need design">No, I need design</option>
                    <option value="Yes">Yes, I have creative ready</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="has_logos" className="block text-sm font-medium text-[#111111] mb-1.5">
                    Have logos/branding?
                  </label>
                  <select
                    id="has_logos"
                    name="has_logos"
                    className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#F5F5F5] text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]/30 transition"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-[#111111] mb-1.5">
                  Message (optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#F5F5F5] text-[#111111] placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]/30 transition resize-none"
                  placeholder="Anything else you'd like us to know?"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#DC2626] text-white rounded-full text-lg font-semibold hover:bg-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Inquiry"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-[#111111] text-center">
        <p className="text-white/40 text-sm">
          Advertising powered by{" "}
          <Link
            href="https://smartscaleagent.com"
            className="text-white/60 hover:text-white transition-colors underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            Smart Scale
          </Link>
        </p>
      </footer>
    </div>
  );
}

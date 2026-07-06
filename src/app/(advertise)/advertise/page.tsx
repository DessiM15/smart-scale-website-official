"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";

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
  const [errorMessage, setErrorMessage] = useState("");

  useGSAPAnimations();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    formData.append("access_key", "f9fd4eed-280e-4c3e-bf11-579f9ff00522");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    } catch {
      setErrorMessage("Failed to submit. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1210]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1210]/90 backdrop-blur-md border-b border-white/5">
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
            className="px-6 py-2.5 bg-[#DC2626] text-white rounded-full text-sm font-semibold hover:bg-red-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-900/30"
          >
            Get Started
          </a>
        </div>
      </header>

      {/* Hero — Full-bleed background image */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background image */}
        <Image
          src="/assets/mex-taco-expansion.webp"
          alt="Mex Taco House restaurant"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-block px-5 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-semibold mb-8 border border-white/20">
            Only 10 Spots Available
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-6 leading-tight"
            style={{ fontFamily: "var(--font-shadows), cursive" }}
          >
            Advertise at Mex Taco House
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10">
            Put your business in front of a captive audience. Our in-restaurant
            TV screens reach hundreds of hungry diners every single week.
          </p>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#DC2626] text-white rounded-full text-lg font-semibold hover:bg-red-700 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-900/40"
          >
            View Plans & Pricing
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" className="w-5 h-5">
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#1a1210]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div data-animate="fade-up">
              <div
                className="text-5xl sm:text-6xl font-bold text-white mb-2"
                style={{ fontFamily: "var(--font-shadows), cursive" }}
                data-animate="counter"
                data-count-to="500"
                data-count-suffix="+"
              >
                0+
              </div>
              <p className="text-white/50 text-lg">Diners per week</p>
            </div>
            <div data-animate="fade-up">
              <div
                className="text-5xl sm:text-6xl font-bold text-white mb-2"
                style={{ fontFamily: "var(--font-shadows), cursive" }}
                data-animate="counter"
                data-count-to="45"
                data-count-suffix="+"
              >
                0+
              </div>
              <p className="text-white/50 text-lg">Min average dwell time</p>
            </div>
            <div data-animate="fade-up">
              <div
                className="text-5xl sm:text-6xl font-bold text-white mb-2"
                style={{ fontFamily: "var(--font-shadows), cursive" }}
                data-animate="counter"
                data-count-to="6"
                data-count-suffix=""
              >
                0
              </div>
              <p className="text-white/50 text-lg">Days per week</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#221a17]">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-white text-center mb-16"
            style={{ fontFamily: "var(--font-shadows), cursive" }}
          >
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10" data-animate="stagger">
            {[
              { num: "1", title: "Pick a Plan", desc: "Choose the package that fits your budget and goals." },
              { num: "2", title: "We Design Your Ad", desc: "Our team creates a professional ad tailored to your business." },
              { num: "3", title: "You're On Screen", desc: "Your ad goes live on our in-restaurant TV screens within days." },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-14 h-14 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-xl font-bold mx-auto mb-5 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-900/40">
                  {step.num}
                </div>
                <h3
                  className="text-xl font-bold text-white mb-3"
                  style={{ fontFamily: "var(--font-shadows), cursive" }}
                >
                  {step.title}
                </h3>
                <p className="text-white/50">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#1a1210]">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-white text-center mb-4"
            style={{ fontFamily: "var(--font-shadows), cursive" }}
          >
            Simple, Transparent Pricing
          </h2>
          <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">
            3-month initial commitment, then month-to-month. 30-day cancellation notice.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-animate="stagger">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 relative transition-all duration-300 ${
                  plan.popular
                    ? "bg-[#DC2626] text-white ring-2 ring-[#DC2626] scale-105"
                    : "bg-[#221a17] text-white border border-white/[0.08] hover:border-white/[0.15]"
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
                  className={`block w-full py-3 rounded-full text-center font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    plan.popular
                      ? "bg-white text-[#DC2626] hover:bg-white/90 hover:shadow-white/20"
                      : "bg-[#DC2626] text-white hover:bg-red-700 hover:shadow-red-900/30"
                  }`}
                >
                  Get Started
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#221a17]">
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-white text-center mb-4"
            style={{ fontFamily: "var(--font-shadows), cursive" }}
          >
            Reserve Your Spot
          </h2>
          <p className="text-white/50 text-center mb-10">
            Fill out the form below and we&apos;ll get back to you within 24 hours.
          </p>

          {isSubmitted ? (
            <div className="relative p-10 rounded-2xl bg-gradient-to-b from-[#DC2626]/10 via-[#1a1210] to-[#1a1210] border border-[#DC2626]/20 text-center overflow-hidden">
              {/* Confetti pieces */}
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-sm"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-5%`,
                    backgroundColor: [
                      "#DC2626",
                      "#F59E0B",
                      "#10B981",
                      "#3B82F6",
                      "#8B5CF6",
                      "#EC4899",
                      "#F97316",
                      "#ffffff",
                    ][i % 8],
                    width: `${Math.random() * 8 + 4}px`,
                    height: `${Math.random() * 8 + 4}px`,
                    borderRadius: i % 3 === 0 ? "50%" : "2px",
                    animation: `confetti-fall ${2 + Math.random() * 3}s ease-in forwards`,
                    animationDelay: `${Math.random() * 1.5}s`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    opacity: 0,
                  }}
                />
              ))}

              {/* Animated checkmark circle */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <svg className="w-20 h-20" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="#DC2626"
                    strokeWidth="3"
                    strokeDasharray="226"
                    strokeDashoffset="226"
                    className="animate-[circle-draw_0.6s_ease-out_0.3s_forwards]"
                  />
                  <path
                    d="M24 42 L34 52 L56 30"
                    fill="none"
                    stroke="#DC2626"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="50"
                    strokeDashoffset="50"
                    className="animate-[check-draw_0.4s_ease-out_0.8s_forwards]"
                  />
                </svg>
              </div>

              <h3
                className="text-3xl sm:text-4xl font-bold text-white mb-3 animate-[fade-slide-up_0.5s_ease-out_1s_both]"
                style={{ fontFamily: "var(--font-shadows), cursive" }}
              >
                You&apos;re In!
              </h3>
              <p className="text-lg text-white/80 mb-2 animate-[fade-slide-up_0.5s_ease-out_1.2s_both]">
                Your business is about to be on the big screen at{" "}
                <span className="text-[#DC2626] font-semibold">Mex Taco House</span> —
              </p>
              <p className="text-lg text-white/80 mb-6 animate-[fade-slide-up_0.5s_ease-out_1.4s_both]">
                seen by <span className="text-[#DC2626] font-bold">hundreds of diners every week!</span>
              </p>
              <p className="text-sm text-white/40 animate-[fade-slide-up_0.5s_ease-out_1.6s_both]">
                A member of our team will reach out within 24 hours to get you started.
              </p>

              {/* Keyframe styles */}
              <style jsx>{`
                @keyframes confetti-fall {
                  0% {
                    opacity: 1;
                    transform: translateY(0) rotate(0deg) scale(0);
                  }
                  10% {
                    opacity: 1;
                    transform: translateY(20px) rotate(45deg) scale(1);
                  }
                  100% {
                    opacity: 0;
                    transform: translateY(500px) rotate(720deg) scale(0.5);
                  }
                }
                @keyframes circle-draw {
                  to {
                    stroke-dashoffset: 0;
                  }
                }
                @keyframes check-draw {
                  to {
                    stroke-dashoffset: 0;
                  }
                }
                @keyframes fade-slide-up {
                  from {
                    opacity: 0;
                    transform: translateY(15px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <input type="hidden" name="subject" value="New Mex Taco House Advertising Inquiry" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-1.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#1a1210] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]/30 transition"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="business" className="block text-sm font-medium text-white/70 mb-1.5">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    id="business"
                    name="business_name"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#1a1210] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]/30 transition"
                    placeholder="Your business name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#1a1210] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]/30 transition"
                    placeholder="you@business.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-white/70 mb-1.5">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#1a1210] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]/30 transition"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="package" className="block text-sm font-medium text-white/70 mb-1.5">
                  Package Interest *
                </label>
                <select
                  id="package"
                  name="package_interest"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#1a1210] text-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]/30 transition"
                >
                  <option value="">Select a package</option>
                  <option value="Starter - $99/mo">Starter — $99/mo</option>
                  <option value="Standard - $199/mo">Standard — $199/mo</option>
                  <option value="Premium - $399/mo">Premium — $399/mo</option>
                </select>
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-white/70 mb-1.5">
                  Industry / What do you sell? *
                </label>
                <input
                  type="text"
                  id="industry"
                  name="industry"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#1a1210] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]/30 transition"
                  placeholder="e.g., Auto Repair, Insurance, Real Estate..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="has_creative" className="block text-sm font-medium text-white/70 mb-1.5">
                    Have ad creative already?
                  </label>
                  <select
                    id="has_creative"
                    name="has_creative"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#1a1210] text-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]/30 transition"
                  >
                    <option value="No, need design">No, I need design</option>
                    <option value="Yes">Yes, I have creative ready</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="has_logos" className="block text-sm font-medium text-white/70 mb-1.5">
                    Have logos/branding?
                  </label>
                  <select
                    id="has_logos"
                    name="has_logos"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#1a1210] text-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]/30 transition"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-white/70 mb-1.5">
                  Message (optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#1a1210] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30 focus:border-[#DC2626]/30 transition resize-none"
                  placeholder="Anything else you'd like us to know?"
                />
              </div>

              {errorMessage && (
                <div className="p-4 rounded-xl bg-red-900/20 text-red-400 border border-red-500/20 text-center">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#DC2626] text-white rounded-full text-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-900/30"
              >
                {isSubmitting ? "Submitting..." : "Submit Inquiry"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-[#1a1210] text-center border-t border-white/5">
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

"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAPAnimations } from "@/hooks/useGSAPAnimations";

const PHONE_DISPLAY = "832.407.0773";
const PHONE_HREF = "tel:+18324070773";

const plans = [
  {
    name: "Month-to-Month",
    price: "$275",
    period: "/mo",
    term: "Rolling — cancel with 30 days' notice",
    setup: "$99 one-time setup",
    popular: false,
    features: [
      "Maximum flexibility, no long commitment",
      "Your 10-second spot in every rotation",
      "One business per industry — locked",
    ],
  },
  {
    name: "Short Term",
    price: "$235",
    period: "/mo",
    term: "3-month term",
    setup: "$99 one-time setup",
    popular: false,
    features: [
      "Great for a seasonal or launch push",
      "Your 10-second spot in every rotation",
      "One business per industry — locked",
    ],
  },
  {
    name: "Standard",
    price: "$200",
    period: "/mo",
    term: "6-month term",
    setup: "Setup fee waived",
    popular: false,
    features: [
      "Our most popular term",
      "Your 10-second spot in every rotation",
      "One business per industry — locked",
    ],
  },
  {
    name: "Annual Prepay",
    price: "$2,000",
    period: "/yr",
    term: "12 months · about $167/mo",
    setup: "Setup fee waived",
    popular: true,
    badge: "Best Value",
    features: [
      "Lowest monthly rate — lock it for a year",
      "Own your category for 12 full months",
      "Setup waived + priority onboarding",
    ],
  },
];

const includedFeatures = [
  "Design & production of your ad — no artwork needed",
  "No direct competitor in the rotation (category exclusivity)",
  "One free creative refresh per quarter",
  "Quarterly report on display days & rotation size",
  "Two rounds of design revisions before launch",
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
    <div className="min-h-screen bg-[#faf6f0] text-[#1a1210]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf6f0]/90 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Image
            src="/assets/mex-taco-logo.png"
            alt="Mex Taco House"
            width={140}
            height={50}
            className="h-10 w-auto"
          />
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={PHONE_HREF}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-[#1a1210] border border-black/10 hover:border-[#DC2626]/40 hover:text-[#DC2626] transition-all duration-300"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                <path d="M3 5a2 2 0 012-2h2.6a1 1 0 01.98.79l1 4a1 1 0 01-.29.95l-1.5 1.5a12 12 0 005.66 5.66l1.5-1.5a1 1 0 01.95-.29l4 1a1 1 0 01.79.98V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {PHONE_DISPLAY}
            </a>
            <a
              href="#contact-form"
              className="px-6 py-2.5 bg-[#DC2626] text-white rounded-full text-sm font-semibold hover:bg-red-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-900/20"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* Hero — Full-bleed background image (kept cinematic) */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        <Image
          src="/assets/mex-taco-expansion.webp"
          alt="Mex Taco House restaurant"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/80" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p
            className="text-2xl sm:text-3xl text-[#f0c674] mb-2"
            style={{ fontFamily: "var(--font-shadows), cursive" }}
          >
            Your business, right here
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-semibold mb-6 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
            Limited Spots · First Come, First Serve
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-6 leading-tight"
            style={{ fontFamily: "var(--font-shadows), cursive" }}
          >
            Advertise at Mex Taco House
          </h1>
          <p className="text-lg sm:text-xl text-white/75 max-w-2xl mx-auto mb-10">
            Own your category on our dining-room screens. A 10-second spot in
            front of every guest, every visit — and only{" "}
            <span className="text-white font-semibold">one business per industry</span>.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#DC2626] text-white rounded-full text-lg font-semibold hover:bg-red-700 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-900/40"
            >
              View Plans & Pricing
              <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" className="w-5 h-5">
                <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a
              href={PHONE_HREF}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full text-lg font-semibold border border-white/25 hover:bg-white/20 transition-all duration-300"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                <path d="M3 5a2 2 0 012-2h2.6a1 1 0 01.98.79l1 4a1 1 0 01-.29.95l-1.5 1.5a12 12 0 005.66 5.66l1.5-1.5a1 1 0 01.95-.29l4 1a1 1 0 01.79.98V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Call to Claim
            </a>
          </div>
        </div>
      </section>

      {/* Announcement strip (flyer-style red band) */}
      <section className="bg-[#DC2626] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-sm sm:text-base font-semibold uppercase tracking-wide">
            <li className="flex items-center gap-2"><span className="text-[#f0c674]">●</span> Limited Spots</li>
            <li className="hidden sm:block text-white/40">·</li>
            <li className="flex items-center gap-2"><span className="text-[#f0c674]">●</span> Seen by 5,000+ / Month</li>
            <li className="hidden sm:block text-white/40">·</li>
            <li className="flex items-center gap-2"><span className="text-[#f0c674]">●</span> One Business Per Industry</li>
            <li className="hidden sm:block text-white/40">·</li>
            <li className="flex items-center gap-2"><span className="text-[#f0c674]">●</span> First Come, First Serve</li>
          </ul>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#faf6f0]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            <div data-animate="fade-up">
              <div
                className="text-5xl sm:text-6xl font-bold text-[#DC2626] mb-2"
                style={{ fontFamily: "var(--font-playfair), serif" }}
                data-animate="counter"
                data-count-to="5000"
                data-count-suffix="+"
              >
                0+
              </div>
              <p className="text-[#7a6a5d] text-lg">Average monthly visitors</p>
            </div>
            <div data-animate="fade-up">
              <div
                className="text-5xl sm:text-6xl font-bold text-[#DC2626] mb-2"
                style={{ fontFamily: "var(--font-playfair), serif" }}
                data-animate="counter"
                data-count-to="60"
                data-count-suffix=" min"
              >
                0 min
              </div>
              <p className="text-[#7a6a5d] text-lg">Seated, on average — a full meal</p>
            </div>
            <div data-animate="fade-up">
              <div
                className="text-5xl sm:text-6xl font-bold text-[#DC2626] mb-2"
                style={{ fontFamily: "var(--font-playfair), serif" }}
                data-animate="counter"
                data-count-to="10"
                data-count-suffix=""
              >
                0
              </div>
              <p className="text-[#7a6a5d] text-lg">Advertisers max — then it&apos;s full</p>
            </div>
          </div>
          <p className="text-center text-[#7a6a5d] mt-12 max-w-2xl mx-auto text-lg">
            Diners are{" "}
            <span className="text-[#1a1210] font-semibold">seated, relaxed, and watching our screens</span>{" "}
            for a full meal — not a passing glance. A billboard gets a glance;
            this gets a whole meal.
          </p>
        </div>
      </section>

      {/* Exclusivity callout */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl border border-[#DC2626]/15 bg-[#faf6f0] p-8 sm:p-12 text-center relative overflow-hidden" data-animate="fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DC2626]/10 text-[#DC2626] text-xs font-bold uppercase tracking-wider mb-6">
              Category Exclusivity Included
            </div>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 leading-tight"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Own your category.
              <br className="hidden sm:block" /> Lock out the competition.
            </h2>
            <p className="text-lg text-[#7a6a5d] max-w-2xl mx-auto">
              We run <span className="text-[#1a1210] font-semibold">one advertiser per industry</span>.
              When you&apos;re in, no direct competitor can be — for as long as you
              hold your spot. Once your category is claimed, it&apos;s gone.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#faf6f0]">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-center mb-16"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10" data-animate="stagger">
            {[
              { num: "1", title: "Claim Your Category", desc: "Pick a plan and lock your industry before a competitor does." },
              { num: "2", title: "We Design Your Ad", desc: "Our team creates your 10-second spot — no artwork needed on your end." },
              { num: "3", title: "You're On Screen", desc: "Your ad goes live on the dining-room screens within days." },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-14 h-14 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-xl font-bold mx-auto mb-5 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-900/30">
                  {step.num}
                </div>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  {step.title}
                </h3>
                <p className="text-[#7a6a5d]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-center mb-4"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Choose Your Plan
          </h2>
          <p className="text-[#7a6a5d] text-center mb-12 max-w-xl mx-auto">
            Every plan includes design, category exclusivity, and quarterly
            reporting. Longer commitments cost less per month.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-animate="stagger">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-7 relative transition-all duration-300 flex flex-col ${
                  plan.popular
                    ? "bg-[#DC2626] text-white ring-2 ring-[#DC2626] shadow-xl shadow-red-900/20 lg:scale-[1.03]"
                    : "bg-[#faf6f0] text-[#1a1210] border border-black/[0.07] hover:border-[#DC2626]/25 hover:-translate-y-1"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#f0c674] text-[#1a1210] rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className={`text-sm mb-4 ${plan.popular ? "text-white/70" : "text-[#7a6a5d]"}`}>
                  {plan.term}
                </p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={plan.popular ? "text-white/70" : "text-[#7a6a5d]"}>{plan.period}</span>
                </div>
                <p className={`text-xs mb-6 ${plan.popular ? "text-white/70" : "text-[#7a6a5d]"}`}>
                  {plan.setup}
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${plan.popular ? "text-[#f0c674]" : "text-[#DC2626]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={`text-sm ${plan.popular ? "text-white/90" : "text-[#5c4f45]"}`}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact-form"
                  className={`block w-full py-3 rounded-full text-center font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    plan.popular
                      ? "bg-white text-[#DC2626] hover:bg-white/90 hover:shadow-white/20"
                      : "bg-[#DC2626] text-white hover:bg-red-700 hover:shadow-red-900/20"
                  }`}
                >
                  Get Started
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[#9a8b7d] mt-8 max-w-2xl mx-auto">
            Billed to a card on file. Prices held for your term; renewal at
            then-current rate with 30 days&apos; notice. All creative subject to
            restaurant approval.
          </p>
        </div>
      </section>

      {/* Included with every plan */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#faf6f0]">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-center mb-12"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Included With Every Plan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-animate="stagger">
            {includedFeatures.map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-5 rounded-xl bg-white border border-black/[0.06]"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#DC2626] text-white flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-[#5c4f45]">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-center mb-4"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Claim Your Spot
          </h2>
          <p className="text-[#7a6a5d] text-center mb-6">
            Spots go to whoever claims first. Fill out the form and we&apos;ll get
            back to you within 24 hours.
          </p>

          {/* Call-first CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <span className="text-sm text-[#9a8b7d]">In a hurry? Spots go to whoever calls first —</span>
            <a
              href={PHONE_HREF}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1a1210] text-white text-sm font-semibold hover:bg-[#DC2626] transition-all duration-300"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                <path d="M3 5a2 2 0 012-2h2.6a1 1 0 01.98.79l1 4a1 1 0 01-.29.95l-1.5 1.5a12 12 0 005.66 5.66l1.5-1.5a1 1 0 01.95-.29l4 1a1 1 0 01.79.98V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Call {PHONE_DISPLAY}
            </a>
          </div>

          {isSubmitted ? (
            <div className="relative p-10 rounded-2xl bg-gradient-to-b from-[#DC2626]/8 via-white to-white border border-[#DC2626]/15 text-center overflow-hidden shadow-lg shadow-black/[0.03]">
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
                      "#f0c674",
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
                className="text-3xl sm:text-4xl font-bold text-[#1a1210] mb-3 animate-[fade-slide-up_0.5s_ease-out_1s_both]"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                You&apos;re In!
              </h3>
              <p className="text-lg text-[#5c4f45] mb-2 animate-[fade-slide-up_0.5s_ease-out_1.2s_both]">
                Your business is about to be on the big screen at{" "}
                <span className="text-[#DC2626] font-semibold">Mex Taco House</span> —
              </p>
              <p className="text-lg text-[#5c4f45] mb-6 animate-[fade-slide-up_0.5s_ease-out_1.4s_both]">
                seen by <span className="text-[#DC2626] font-bold">5,000+ diners every month!</span>
              </p>
              <p className="text-sm text-[#9a8b7d] animate-[fade-slide-up_0.5s_ease-out_1.6s_both]">
                A member of our team will reach out within 24 hours to lock your
                category.
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
                  <label htmlFor="name" className="block text-sm font-medium text-[#5c4f45] mb-1.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#faf6f0] text-[#1a1210] placeholder:text-[#9a8b7d] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/25 focus:border-[#DC2626]/40 transition"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="business" className="block text-sm font-medium text-[#5c4f45] mb-1.5">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    id="business"
                    name="business_name"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#faf6f0] text-[#1a1210] placeholder:text-[#9a8b7d] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/25 focus:border-[#DC2626]/40 transition"
                    placeholder="Your business name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#5c4f45] mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#faf6f0] text-[#1a1210] placeholder:text-[#9a8b7d] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/25 focus:border-[#DC2626]/40 transition"
                    placeholder="you@business.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[#5c4f45] mb-1.5">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#faf6f0] text-[#1a1210] placeholder:text-[#9a8b7d] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/25 focus:border-[#DC2626]/40 transition"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="package" className="block text-sm font-medium text-[#5c4f45] mb-1.5">
                  Plan Interest *
                </label>
                <select
                  id="package"
                  name="package_interest"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#faf6f0] text-[#1a1210] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/25 focus:border-[#DC2626]/40 transition"
                >
                  <option value="">Select a plan</option>
                  <option value="Annual Prepay - $2,000/yr">Annual Prepay — $2,000/yr (~$167/mo)</option>
                  <option value="Standard - $200/mo (6 months)">Standard — $200/mo (6 months)</option>
                  <option value="Short Term - $235/mo (3 months)">Short Term — $235/mo (3 months)</option>
                  <option value="Month-to-Month - $275/mo">Month-to-Month — $275/mo</option>
                  <option value="Not sure yet">Not sure yet — help me choose</option>
                </select>
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-[#5c4f45] mb-1.5">
                  Industry / What do you sell? *
                </label>
                <input
                  type="text"
                  id="industry"
                  name="industry"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#faf6f0] text-[#1a1210] placeholder:text-[#9a8b7d] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/25 focus:border-[#DC2626]/40 transition"
                  placeholder="e.g., Auto Repair, Insurance, Real Estate..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="has_creative" className="block text-sm font-medium text-[#5c4f45] mb-1.5">
                    Have ad creative already?
                  </label>
                  <select
                    id="has_creative"
                    name="has_creative"
                    className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#faf6f0] text-[#1a1210] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/25 focus:border-[#DC2626]/40 transition"
                  >
                    <option value="No, need design">No, I need design</option>
                    <option value="Yes">Yes, I have creative ready</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="has_logos" className="block text-sm font-medium text-[#5c4f45] mb-1.5">
                    Have logos/branding?
                  </label>
                  <select
                    id="has_logos"
                    name="has_logos"
                    className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#faf6f0] text-[#1a1210] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/25 focus:border-[#DC2626]/40 transition"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-[#5c4f45] mb-1.5">
                  Message (optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#faf6f0] text-[#1a1210] placeholder:text-[#9a8b7d] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/25 focus:border-[#DC2626]/40 transition resize-none"
                  placeholder="Anything else you'd like us to know?"
                />
              </div>

              {errorMessage && (
                <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-center">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#DC2626] text-white rounded-full text-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-900/20"
              >
                {isSubmitting ? "Submitting..." : "Claim My Spot"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-[#1a1210] text-center">
        <p className="text-white/50 text-sm">
          Screen advertising at Mex Taco House · Cypress, TX · Managed by{" "}
          <Link
            href="https://smartscaleagent.com"
            className="text-white/70 hover:text-white transition-colors underline underline-offset-2"
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

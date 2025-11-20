"use client";

import ContactForm from "@/components/ContactForm";
import TechBackground from "@/components/TechBackground";
import { useHeroAnimations } from "@/hooks/useHeroAnimations";
import HeroCTA from "@/components/HeroCTA";
import ScrollIndicator from "@/components/hero-backgrounds/ScrollIndicator";
import Image from "next/image";

export default function Contact() {
  const { sectionRef, parallaxStyle, scrollStyle } = useHeroAnimations();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section 
        ref={sectionRef}
        className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-black text-white relative overflow-hidden min-h-[60vh] flex items-center"
        style={scrollStyle}
      >
        <TechBackground />
        {/* Logo fade-in from back to front */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-0">
          <Image
            src="/assets/smart-scale-logo-official.png"
            alt="Smart Scale"
            width={300}
            height={120}
            className="w-auto h-24 sm:h-32 md:h-40 brightness-0 invert animate-logo-fade-in"
            priority
            unoptimized
          />
        </div>
        <div className="max-w-7xl mx-auto text-center relative z-10" style={parallaxStyle}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight hero-headline">
            Talk Directly to the Builders
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto mb-8 hero-subheadline">
            No sales team. No account managers. Just the two founders who will personally build your project.
          </p>
          <div className="flex justify-center">
            <HeroCTA href="#contact-form" variant="secondary">
              Send Project Details
            </HeroCTA>
          </div>
        </div>
      </section>
      <ScrollIndicator />

      {/* Contact Form and Info */}
      <section id="contact-form" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold mb-6 text-black">
                Send us a message
              </h2>
              <ContactForm />
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold mb-6 text-black">
                Contact Information
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-black">
                    Email
                  </h3>
                  <a
                    href="mailto:project@ssl-mail.com"
                    className="text-[#DC2626] hover:underline text-lg"
                  >
                    project@ssl-mail.com
                  </a>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-black">
                    Phone
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <a
                        href="tel:8324070773"
                        className="text-[#DC2626] hover:underline text-lg block"
                      >
                        Jay: 832.407.0773
                      </a>
                    </div>
                    <div>
                      <a
                        href="tel:8327905001"
                        className="text-[#DC2626] hover:underline text-lg block"
                      >
                        Dee: 832.790.5001
                      </a>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-black">
                    Location
                  </h3>
                  <p className="text-gray-700 text-lg">Texas, United States</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


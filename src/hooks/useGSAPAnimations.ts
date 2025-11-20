"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Configure GSAP defaults for smooth, premium animations
gsap.config({
  nullTargetWarn: false,
  force3D: true,
});

// Set default ease for all animations
gsap.defaults({
  ease: "power2.out",
  duration: 0.8,
});

export function useGSAPAnimations() {
  const initializedRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReducedMotion = mediaQuery.matches;

    // Mobile detection - disable animations on mobile for performance
    const isMobile = window.innerWidth < 768;

    if (prefersReducedMotion || isMobile) {
      // Disable all animations on mobile or reduced motion
      if (isMobile) {
        // On mobile, just make everything visible immediately
        gsap.set(".scroll-reveal, .scroll-reveal-fade, .scroll-reveal-slide, .scroll-reveal-stagger > *", {
          opacity: 1,
          y: 0,
          x: 0,
        });
      }
      gsap.globalTimeline.timeScale(0);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      return;
    }

    // Desktop optimizations
    gsap.config({ force3D: true });
    gsap.defaults({ duration: 0.8 });

    // PERFORMANCE OPTIMIZATIONS
    ScrollTrigger.config({
      limitCallbacks: true,
      syncInterval: 40,
    });

    // Initialize all animations after DOM is ready
    const initAnimations = () => {
      // 0. SCROLL REVEAL - Simple fade-in animation for any element
      const scrollRevealElements = document.querySelectorAll(".scroll-reveal");
      scrollRevealElements.forEach((element: any) => {
        if (!element) return;
        
        // Check if element is already in view
        const rect = element.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
        
        if (isInView) {
          // Already visible, animate immediately
          gsap.fromTo(element, 
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", immediateRender: false }
          );
        } else {
          // Not in view, use scroll trigger
          gsap.from(element, {
            opacity: 0,
            y: 30,
            duration: 0.8,
            ease: "power2.out",
            immediateRender: true,
            scrollTrigger: {
              trigger: element,
              start: "top 85%",
              once: true,
              toggleActions: "play none none none",
            },
          });
        }
      });

      // 0.1. SCROLL REVEAL FADE - Just opacity fade
      const scrollRevealFadeElements = document.querySelectorAll(".scroll-reveal-fade");
      scrollRevealFadeElements.forEach((element: any) => {
        if (!element) return;
        
        // Check if element is already in view
        const rect = element.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
        
        if (isInView) {
          // Already visible, animate immediately
          gsap.fromTo(element,
            { opacity: 0 },
            { opacity: 1, duration: 0.8, ease: "power2.out", immediateRender: false }
          );
        } else {
          // Not in view, use scroll trigger
          gsap.from(element, {
            opacity: 0,
            duration: 0.8,
            ease: "power2.out",
            immediateRender: true,
            scrollTrigger: {
              trigger: element,
              start: "top 85%",
              once: true,
              toggleActions: "play none none none",
            },
          });
        }
      });

      // 0.2. SCROLL REVEAL SLIDE - Slide from left
      const scrollRevealSlideElements = document.querySelectorAll(".scroll-reveal-slide");
      scrollRevealSlideElements.forEach((element: any) => {
        if (!element) return;
        
        // Check if element is already in view
        const rect = element.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
        
        if (isInView) {
          // Already visible, animate immediately
          gsap.fromTo(element,
            { opacity: 0, x: -50 },
            { opacity: 1, x: 0, duration: 0.8, ease: "power2.out", immediateRender: false }
          );
        } else {
          // Not in view, use scroll trigger
          gsap.from(element, {
            opacity: 0,
            x: -50,
            duration: 0.8,
            ease: "power2.out",
            immediateRender: true,
            scrollTrigger: {
              trigger: element,
              start: "top 85%",
              once: true,
              toggleActions: "play none none none",
            },
          });
        }
      });

      // 0.3. SCROLL REVEAL STAGGER - For child elements
      const scrollRevealStaggerContainers = document.querySelectorAll(".scroll-reveal-stagger");
      scrollRevealStaggerContainers.forEach((container: any) => {
        if (!container) return;
        const children = Array.from(container.children || []);
        if (children.length === 0) return;
        
        // Check if container is already in view
        const rect = container.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
        
        if (isInView) {
          // Already visible, animate immediately
          gsap.fromTo(children,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out", immediateRender: false }
          );
        } else {
          // Not in view, use scroll trigger
          gsap.from(children, {
            opacity: 0,
            y: 30,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
            immediateRender: true,
            scrollTrigger: {
              trigger: container,
              start: "top 85%",
              once: true,
              toggleActions: "play none none none",
            },
          });
        }
      });

      // 1. HERO SECTIONS - "Cinematic Fade Rise"
      gsap.utils.toArray(".hero-content").forEach((hero: any) => {
        if (!hero) return;
        const children = Array.from(hero.children || []);
        if (children.length === 0) return;

        gsap.from(children, {
          opacity: 0,
          y: 30,
          scale: 0.98,
          duration: 1,
          stagger: 0.1,
          scrollTrigger: {
            trigger: hero,
            start: "top 80%",
            once: true,
          },
        });
      });

      // 2. SERVICE/CAPABILITY CARDS - "Cascade Reveal"
      gsap.utils
        .toArray(".service-card, .capability-card")
        .forEach((card: any, index: number) => {
          if (!card) return;
          gsap.from(card, {
            opacity: 0,
            y: 40,
            rotateX: -5,
            duration: 0.6,
            delay: index * 0.1,
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              once: true,
            },
          });
        });

      // 3. STATISTICS/NUMBERS - "Intelligent Count"
      gsap.utils.toArray("[data-count]").forEach((stat: any) => {
        if (!stat) return;
        const target = parseInt(stat.getAttribute("data-count") || "0", 10);
        if (isNaN(target)) return;

        const obj = { value: 0 };

        gsap.to(obj, {
          value: target,
          duration: 2.5,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: stat,
            start: "top 75%",
            once: true,
            onEnter: () => {
              gsap.to(stat, {
                textShadow: "0 0 20px rgba(220, 38, 38, 0.6)",
                duration: 0.3,
                yoyo: true,
                repeat: 1,
              });
            },
          },
          onUpdate: function () {
            stat.textContent = Math.floor(obj.value).toLocaleString();
          },
        });
      });

      // 4. PORTFOLIO ITEMS - "Matrix Assembly"
      gsap.utils.toArray(".portfolio-item").forEach((item: any, index: number) => {
        if (!item) return;

        // Calculate stagger based on grid position
        const row = Math.floor(index / 3);
        const col = index % 3;
        const delay = row * 0.1 + col * 0.05;

        gsap.from(item, {
          opacity: 0,
          scale: 0.95,
          filter: "blur(5px)",
          duration: 0.7,
          delay: delay,
          scrollTrigger: {
            trigger: item,
            start: "top 90%",
            once: true,
          },
        });

        // Add parallax to images (disable on mobile)
        if (!isMobile) {
          const img = item.querySelector("img");
          if (img) {
            gsap.to(img, {
              yPercent: -20,
              ease: "none",
              scrollTrigger: {
                trigger: item,
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
              },
            });
          }
        }
      });

      // 5. TEXT SECTIONS - "Typewriter Elite"
      gsap.utils.toArray(".content-section p").forEach((paragraph: any) => {
        if (!paragraph) return;
        const originalHTML = paragraph.innerHTML;
        const lines = originalHTML.split("<br>");

        if (lines.length > 1) {
          paragraph.innerHTML = lines
            .map((line: string) => `<span class="line">${line}</span>`)
            .join("");
        }

        const elements = paragraph.querySelectorAll(".line, p");
        if (elements.length > 0) {
          gsap.from(elements, {
            opacity: 0,
            x: -10,
            duration: 0.5,
            stagger: 0.05,
            scrollTrigger: {
              trigger: paragraph,
              start: "top 80%",
              once: true,
            },
          });
        }
      });

      // Headlines with tracking animation
      gsap.utils.toArray("h1, h2, h3").forEach((heading: any) => {
        if (!heading) return;
        // Skip if already animated by hero-content
        if (heading.closest(".hero-content")) return;

        gsap.from(heading, {
          letterSpacing: "-0.05em",
          opacity: 0,
          duration: 1,
          scrollTrigger: {
            trigger: heading,
            start: "top 85%",
            once: true,
          },
        });
      });

      // 6. CTA BUTTONS - "Pulse Entry"
      gsap.utils
        .toArray(".cta-button, .request-estimate")
        .forEach((button: any) => {
          if (!button) return;
          gsap.from(button, {
            opacity: 0,
            scale: 0.9,
            duration: 0.5,
            scrollTrigger: {
              trigger: button,
              start: "top 90%",
              once: true,
              onComplete: () => {
                // Add recurring pulse after initial animation
                gsap.to(button, {
                  boxShadow: "0 0 0 0 rgba(220, 38, 38, 0.4)",
                  duration: 2,
                  repeat: -1,
                  repeatDelay: 3,
                  ease: "power2.inOut",
                  onRepeat: function () {
                    gsap.to(button, {
                      boxShadow: "0 0 20px 10px rgba(220, 38, 38, 0)",
                      duration: 2,
                      ease: "power2.out",
                    });
                  },
                });
              },
            },
          });
        });

      // 7. SECTION DIVIDERS - "Energy Line"
      gsap.utils.toArray(".section-divider, hr").forEach((divider: any) => {
        if (!divider) return;
        gsap.from(divider, {
          scaleX: 0,
          transformOrigin: "center",
          duration: 1.2,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: divider,
            start: "top 85%",
            once: true,
          },
        });

        // Add gradient animation
        gsap.to(divider, {
          backgroundPosition: "200% 50%",
          duration: 3,
          repeat: -1,
          ease: "none",
          scrollTrigger: {
            trigger: divider,
            start: "top 85%",
            once: true,
          },
        });
      });

      // 8. TESTIMONIALS/QUOTES - "Prestige Reveal"
      gsap.utils.toArray(".testimonial, blockquote").forEach((quote: any) => {
        if (!quote) return;
        gsap.from(quote, {
          opacity: 0,
          rotateY: 5,
          duration: 0.8,
          scrollTrigger: {
            trigger: quote,
            start: "top 80%",
            once: true,
          },
        });

        // Animate quotation marks separately if they exist
        const marks = quote.querySelectorAll(".quote-mark");
        if (marks.length) {
          gsap.from(marks, {
            scale: 0,
            opacity: 0,
            duration: 0.3,
            delay: 0.5,
            stagger: 0.1,
          });
        }
      });

      // 9. SPECIAL - Red Glow Reveal for Featured Sections
      gsap.utils.toArray("[data-glow]").forEach((element: any) => {
        if (!element) return;
        gsap.timeline({
          scrollTrigger: {
            trigger: element,
            start: "top 75%",
            once: true,
          },
        })
          .from(element, {
            opacity: 0,
            scale: 0.98,
            duration: 0.8,
          })
          .to(element, {
            boxShadow: "0 0 40px rgba(220, 38, 38, 0.6)",
            duration: 0.3,
          })
          .to(element, {
            boxShadow: "0 0 20px rgba(220, 38, 38, 0.3)",
            duration: 0.3,
          });
      });

      // 10. NAVIGATION - Smooth Scroll Behavior
      // Using GSAP to animate scroll position (works without premium ScrollToPlugin)
      gsap.utils.toArray('a[href^="#"]').forEach((anchor: any) => {
        if (!anchor) return;
        const handleClick = (e: MouseEvent) => {
          e.preventDefault();
          const href = (anchor as HTMLAnchorElement).getAttribute("href");
          if (!href) return;
          const target = document.querySelector(href);
          if (target) {
            const targetPosition = (target as HTMLElement).offsetTop - 80;
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            const distance = targetPosition - currentScroll;
            const duration = 1.2;
            
            // Create a proxy object to animate scroll position
            const scrollProxy = { value: currentScroll };
            gsap.to(scrollProxy, {
              value: targetPosition,
              duration: duration,
              ease: "power2.inOut",
              onUpdate: () => {
                window.scrollTo(0, scrollProxy.value);
              },
            });
          }
        };
        anchor.addEventListener("click", handleClick, { passive: false });
      });

      // Batch animations for better performance
      ScrollTrigger.batch(".batch-animate", {
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            stagger: 0.1,
            overwrite: true,
          }),
        onLeave: (batch) =>
          gsap.set(batch, {
            opacity: 0,
            y: 50,
            overwrite: true,
          }),
        onEnterBack: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            stagger: 0.1,
            overwrite: true,
          }),
        onLeaveBack: (batch) =>
          gsap.set(batch, {
            opacity: 0,
            y: 50,
            overwrite: true,
          }),
      });

      // Refresh ScrollTrigger after initialization
      ScrollTrigger.refresh();
    };

    // Set initial states for animated elements BEFORE initializing animations
    // This ensures elements start invisible
    gsap.set(".hero-content > *, .service-card, .portfolio-item", {
      opacity: 0,
    });
    
    // Set initial states for scroll reveal elements
    gsap.set(".scroll-reveal", {
      opacity: 0,
      y: 30,
    });
    
    gsap.set(".scroll-reveal-fade", {
      opacity: 0,
    });
    
    gsap.set(".scroll-reveal-slide", {
      opacity: 0,
      x: -50,
    });
    
    gsap.set(".scroll-reveal-stagger > *", {
      opacity: 0,
      y: 30,
    });

    // Initialize animations when DOM is ready
    // Use a small delay to ensure React components are fully rendered
    const initWithDelay = () => {
      setTimeout(() => {
        // Set initial states right before initializing
        const allRevealElements = document.querySelectorAll(".scroll-reveal, .scroll-reveal-fade, .scroll-reveal-slide, .scroll-reveal-stagger > *");
        
        allRevealElements.forEach((el: any) => {
          if (el.classList.contains("scroll-reveal")) {
            gsap.set(el, { opacity: 0, y: 30 });
          } else if (el.classList.contains("scroll-reveal-fade")) {
            gsap.set(el, { opacity: 0 });
          } else if (el.classList.contains("scroll-reveal-slide")) {
            gsap.set(el, { opacity: 0, x: -50 });
          } else {
            // Child of stagger container
            gsap.set(el, { opacity: 0, y: 30 });
          }
        });
        
        initAnimations();
        
        // Refresh ScrollTrigger multiple times to catch all elements
        setTimeout(() => {
          ScrollTrigger.refresh();
          
          // Second refresh after a bit more time for any lazy-loaded content
          setTimeout(() => {
            ScrollTrigger.refresh();
            
            // Final fallback: Check all elements and make visible if they're in view
            allRevealElements.forEach((el: any) => {
              const computedStyle = window.getComputedStyle(el);
              if (computedStyle.opacity === "0" || parseFloat(computedStyle.opacity) < 0.1) {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                  // Element is in view but still invisible, make it visible
                  gsap.to(el, { 
                    opacity: 1, 
                    y: 0, 
                    x: 0, 
                    duration: 0.6, 
                    ease: "power2.out",
                    overwrite: true
                  });
                }
              }
            });
          }, 300);
        }, 200);
      }, 300);
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initWithDelay);
    } else {
      initWithDelay();
    }

    // Refresh on window load (after images load)
    window.addEventListener("load", () => {
      ScrollTrigger.refresh();
    });

    // REFRESH ON RESIZE
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 250);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
      ScrollTrigger.getAll().forEach((st) => st.kill());
      initializedRef.current = false;
    };
  }, []);

  return null;
}


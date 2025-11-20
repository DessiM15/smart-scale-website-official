"use client";

import { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
}

export default function FloatingParticles({ 
  count = 50,
  responsive = true 
}: { 
  count?: number; 
  responsive?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Responsive particle count
    const getParticleCount = () => {
      if (typeof window === 'undefined') return 0;
      if (!responsive) return count;
      if (window.innerWidth >= 1920) return count;
      if (window.innerWidth >= 1024) return Math.floor(count * 0.7);
      if (window.innerWidth >= 768) return Math.floor(count * 0.4);
      return 0; // No particles on mobile
    };

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Don't render on mobile
    if (window.innerWidth < 768) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles
    const initialParticles: Particle[] = [];
    const particleCount = getParticleCount();
    
    for (let i = 0; i < particleCount; i++) {
      initialParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
      });
    }
    setParticles(initialParticles);

    let currentMousePos = { x: 0, y: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      currentMousePos = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationParticles = [...initialParticles];
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      animationParticles.forEach((particle, index) => {
        // Mouse interaction
        const dx = currentMousePos.x - particle.x;
        const dy = currentMousePos.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 100;
        
        if (distance < maxDistance) {
          const force = (maxDistance - distance) / maxDistance;
          particle.x -= (dx / distance) * force * 0.5;
          particle.y -= (dy / distance) * force * 0.5;
        }
        
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 38, 38, ${0.3 - distance / maxDistance * 0.2})`;
        ctx.fill();
        
        // Draw connections
        animationParticles.slice(index + 1).forEach((otherParticle) => {
          const dx2 = particle.x - otherParticle.x;
          const dy2 = particle.y - otherParticle.y;
          const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          
          if (distance2 < 150) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = `rgba(220, 38, 38, ${0.2 * (1 - distance2 / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [count, responsive, isMounted]);

  // Always render the canvas element to avoid hydration mismatch
  // The canvas will be hidden on mobile via CSS (hidden md:block)
  // and the animation won't run if window.innerWidth < 768
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none hero-bg-elements hidden md:block"
      style={{ opacity: 0 }}
    />
  );
}


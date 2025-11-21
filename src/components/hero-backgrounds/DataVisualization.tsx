"use client";

import { useEffect, useRef } from "react";

export default function DataVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const initCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.warn('Failed to get 2D context for data visualization canvas');
        return;
      }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const dataPoints = Array.from({ length: 5 }, (_, i) => ({
      x: (i + 1) * (canvas.width / 6),
      baseY: canvas.height / 2,
      amplitude: 50 + Math.random() * 100,
      frequency: 0.01 + Math.random() * 0.02,
      phase: Math.random() * Math.PI * 2,
    }));

    let frame = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw data bars
      dataPoints.forEach((point, index) => {
        const height = Math.sin(frame * point.frequency + point.phase) * point.amplitude;
        const barWidth = 40;
        const barHeight = Math.abs(height);
        
        ctx.fillStyle = `rgba(220, 38, 38, ${0.3 + Math.sin(frame * 0.01 + index) * 0.2})`;
        ctx.fillRect(
          point.x - barWidth / 2,
          point.baseY - barHeight / 2,
          barWidth,
          barHeight
        );
        
        // Draw connecting line
        if (index > 0) {
          const prevPoint = dataPoints[index - 1];
          const prevHeight = Math.sin(frame * prevPoint.frequency + prevPoint.phase) * prevPoint.amplitude;
          
          ctx.beginPath();
          ctx.moveTo(prevPoint.x, prevPoint.baseY - prevHeight / 2);
          ctx.lineTo(point.x, point.baseY - height / 2);
          ctx.strokeStyle = `rgba(220, 38, 38, 0.3)`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
      
      frame++;
      requestAnimationFrame(animate);
    };

      animate();

      // Make canvas visible after initialization
      canvas.style.opacity = '1';

      return () => {
        window.removeEventListener("resize", resizeCanvas);
      };
    };

    // Initialize with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(initCanvas, 150);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none hero-bg-elements"
      style={{ opacity: 0 }}
    />
  );
}


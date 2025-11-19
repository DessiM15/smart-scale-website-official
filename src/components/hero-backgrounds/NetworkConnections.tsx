"use client";

import { useEffect, useRef } from "react";

export default function NetworkConnections() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const nodes = Array.from({ length: 8 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: 4,
    }));

    const animate = () => {
      if (!svg) return;
      
      const paths = svg.querySelectorAll("line");
      paths.forEach((line, index) => {
        const opacity = 0.2 + Math.sin(Date.now() / 1000 + index) * 0.2;
        line.setAttribute("opacity", opacity.toString());
      });
      
      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  const nodes = [
    { x: "20%", y: "30%" },
    { x: "50%", y: "20%" },
    { x: "80%", y: "30%" },
    { x: "30%", y: "50%" },
    { x: "70%", y: "50%" },
    { x: "20%", y: "70%" },
    { x: "50%", y: "80%" },
    { x: "80%", y: "70%" },
  ];

  const connections = [
    [0, 1], [1, 2], [0, 3], [1, 4], [2, 4],
    [3, 5], [4, 6], [5, 6], [6, 7], [4, 7],
  ];

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full pointer-events-none hero-bg-elements"
      style={{ opacity: 0 }}
    >
      {/* Connection lines */}
      {connections.map(([start, end], index) => {
        const startNode = nodes[start];
        const endNode = nodes[end];
        return (
          <line
            key={index}
            x1={startNode.x}
            y1={startNode.y}
            x2={endNode.x}
            y2={endNode.y}
            stroke="#DC2626"
            strokeWidth="1"
            opacity="0.2"
            className="animate-pulse-slow"
            style={{ animationDelay: `${index * 0.2}s` }}
          />
        );
      })}
      
      {/* Nodes */}
      {nodes.map((node, index) => (
        <circle
          key={index}
          cx={node.x}
          cy={node.y}
          r="4"
          fill="#DC2626"
          opacity="0.4"
          className="animate-pulse-slow"
          style={{ animationDelay: `${index * 0.1}s` }}
        />
      ))}
    </svg>
  );
}


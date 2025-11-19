"use client";

import { useEffect, useState } from "react";

const codeSnippets = [
  "const mvp = buildIn7Days();",
  "async function deliver() { return results; }",
  "export default function Hero() { return <Speed />; }",
  "AI.accelerate(development);",
  "while(others.propose()) { we.build(); }",
];

export default function CodeSnippets() {
  const [currentSnippet, setCurrentSnippet] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (!isTyping) return;

    const snippet = codeSnippets[currentSnippet];
    let charIndex = 0;

    const typeInterval = setInterval(() => {
      if (charIndex < snippet.length) {
        setDisplayedText(snippet.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        
        // Wait, then move to next snippet
        setTimeout(() => {
          setDisplayedText("");
          setIsTyping(true);
          setCurrentSnippet((prev) => (prev + 1) % codeSnippets.length);
        }, 2000);
      }
    }, 100);

    return () => clearInterval(typeInterval);
  }, [currentSnippet, isTyping]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hero-bg-elements" style={{ opacity: 0 }}>
      <div className="absolute top-1/4 left-1/4 font-mono text-sm text-[#DC2626]/30">
        <span>{displayedText}</span>
        <span className="animate-pulse">|</span>
      </div>
      <div className="absolute top-1/2 right-1/4 font-mono text-sm text-[#DC2626]/30">
        <span>{codeSnippets[(currentSnippet + 1) % codeSnippets.length].slice(0, Math.floor(displayedText.length * 0.7))}</span>
      </div>
      <div className="absolute bottom-1/4 left-1/3 font-mono text-sm text-[#DC2626]/30">
        <span>{codeSnippets[(currentSnippet + 2) % codeSnippets.length].slice(0, Math.floor(displayedText.length * 0.5))}</span>
      </div>
    </div>
  );
}


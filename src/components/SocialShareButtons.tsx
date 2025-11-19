"use client";

import { Twitter, Facebook, Linkedin, Share2 } from "lucide-react";
import { useState } from "react";

interface SocialShareButtonsProps {
  title: string;
  url: string;
}

export default function SocialShareButtons({ title, url }: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.href : url;
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(shareUrl);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-semibold text-[#6B7280]">Share:</span>
      <div className="flex items-center gap-2">
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-[#F3F4F6] hover:bg-[#DC2626] text-[#6B7280] hover:text-white flex items-center justify-center transition-colors"
          aria-label="Share on Twitter"
        >
          <Twitter className="w-5 h-5" />
        </a>
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-[#F3F4F6] hover:bg-[#DC2626] text-[#6B7280] hover:text-white flex items-center justify-center transition-colors"
          aria-label="Share on Facebook"
        >
          <Facebook className="w-5 h-5" />
        </a>
        <a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-[#F3F4F6] hover:bg-[#DC2626] text-[#6B7280] hover:text-white flex items-center justify-center transition-colors"
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="w-5 h-5" />
        </a>
        <button
          onClick={handleCopy}
          className="w-10 h-10 rounded-full bg-[#F3F4F6] hover:bg-[#DC2626] text-[#6B7280] hover:text-white flex items-center justify-center transition-colors"
          aria-label="Copy link"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
      {copied && (
        <span className="text-sm text-[#DC2626] font-medium">Link copied!</span>
      )}
    </div>
  );
}


"use client";

interface ProviderIconProps {
  slug: string;
  className?: string;
}

export function ProviderIcon({ slug, className }: ProviderIconProps) {
  switch (slug) {
    case "netflix":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M6.5 2h3.5v20h-3.5z" fill="currentColor" />
          <path d="M14 2h3.5v20h-3.5z" fill="currentColor" />
          <path d="M6.5 12h7v3h-7z" fill="currentColor" opacity="0.5" />
          <path d="M10 2h3.5v20H10z" fill="currentColor" />
          <path d="M3 2.5h3.5v19H3z" fill="currentColor" />
          <path d="M17.5 2.5H21v19h-3.5z" fill="currentColor" />
        </svg>
      );
    case "disney-plus":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          {/* Mickey Mouse silhouette */}
          <circle cx="12" cy="8" r="5" fill="currentColor" />
          <circle cx="5.5" cy="3.5" r="3.5" fill="currentColor" />
          <circle cx="18.5" cy="3.5" r="3.5" fill="currentColor" />
          <path d="M7 21c0-2.8 2.2-5 5-5s5 2.2 5 5v1H7v-1z" fill="currentColor" />
        </svg>
      );
    case "prime-video":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <rect x="1" y="3" width="22" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8.5 8.5v7l6-3.5z" fill="currentColor" />
        </svg>
      );
    case "apple-tv-plus":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <rect x="1" y="3" width="22" height="18" rx="4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 7l5 10H7z" fill="currentColor" />
        </svg>
      );
    case "hulu":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M4 4h3v16H4z" fill="currentColor" />
          <path d="M10 4h3v16h-3z" fill="currentColor" />
          <path d="M17 4h3v16h-3z" fill="currentColor" />
          <path d="M4 12h16v3H4z" fill="currentColor" />
        </svg>
      );
    case "hbo-max":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M12 2L3 7v10l9 5 9-5V7z" fill="currentColor" />
          <text x="12" y="14" textAnchor="middle" fill="white" fontSize="9" fontWeight="900" fontFamily="sans-serif">HB</text>
        </svg>
      );
    case "paramount-plus":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 10h4v12h12V10h4z" fill="currentColor" />
          <circle cx="12" cy="16" r="3" fill="white" />
        </svg>
      );
    case "peacock":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M12 2C7 2 4 6 4 10c0 5 3 10 8 12v-2c-3-1.5-5-5-5-8 0-3 2-6 5-7z" fill="currentColor" />
          <path d="M12 2c5 0 8 4 8 8 0 5-3 10-8 12v-2c3-1.5 5-5 5-8 0-3-2-6-5-7z" fill="currentColor" opacity="0.6" />
          <ellipse cx="12" cy="14" rx="2" ry="3" fill="white" />
        </svg>
      );
    default:
      return null;
  }
}

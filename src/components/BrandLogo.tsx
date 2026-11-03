import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  symbolOnly?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  symbolOnly = false,
  className = '',
  onClick
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const textSizes = {
    sm: 'text-base tracking-[0.2em]',
    md: 'text-xl tracking-[0.24em]',
    lg: 'text-2xl tracking-[0.28em]'
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none group ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label="ASTREON Home"
    >
      {/* Original Astreon Cosmic Orbit & Starlight Emblem */}
      <svg
        className={`${iconSizes[size]} transition-transform duration-300 group-hover:scale-105 shrink-0`}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Outer deep space horizon ring */}
        <circle
          cx="18"
          cy="18"
          r="16"
          stroke="#272B3A"
          strokeWidth="1.2"
        />
        {/* Stellar orbital ellipse */}
        <ellipse
          cx="18"
          cy="18"
          rx="15"
          ry="6"
          transform="rotate(-28 18 18)"
          stroke="#8B5CF6"
          strokeWidth="1.5"
          strokeDasharray="2 3"
          className="opacity-70 group-hover:opacity-100 transition-opacity"
        />
        {/* Inner glow horizon ring */}
        <circle
          cx="18"
          cy="18"
          r="9"
          stroke="#38BDF8"
          strokeWidth="1.4"
          className="opacity-80 group-hover:stroke-cyan-400 transition-colors"
        />
        {/* Core luminous star */}
        <circle
          cx="18"
          cy="18"
          r="3"
          fill="#F8FAFC"
        />
        <path
          d="M18 11V13M18 23V25M11 18H13M23 18H25"
          stroke="#F8FAFC"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>

      {!symbolOnly && (
        <span
          className={`font-display font-bold uppercase text-[#F8FAFC] transition-colors group-hover:text-white ${textSizes[size]}`}
        >
          Astreon
        </span>
      )}
    </div>
  );
};

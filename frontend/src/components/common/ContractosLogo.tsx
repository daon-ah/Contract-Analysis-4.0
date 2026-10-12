import React from 'react';

interface ContractosLogoProps {
  variant?: 'full' | 'horizontal' | 'mark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

export const ContractosLogo: React.FC<ContractosLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  onClick
}) => {
  // Height and width scaling
  const markSizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96
  };

  const markSize = markSizeMap[size];

  // Vector Mark SVG of C + Gold Column
  const MarkSVG = (
    <svg
      width={markSize}
      height={markSize}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200 group-hover:scale-[1.02]"
    >
      <defs>
        <linearGradient id="contractosGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C5A059" />
          <stop offset="50%" stopColor="#B89B5F" />
          <stop offset="100%" stopColor="#8C6E33" />
        </linearGradient>
      </defs>

      {/* Serif Letter 'C' */}
      <path
        d="M 126 44 C 114 36 96 32 78 36 C 48 43 28 72 28 108 C 28 144 48 172 82 176 C 102 178 122 172 134 160 C 137 157 136 153 132 150 L 126 145 C 123 143 119 144 116 146 C 106 154 92 157 80 155 C 58 152 44 133 44 108 C 44 83 58 58 80 53 C 94 50 108 54 116 60 C 119 62 123 61 125 58 L 131 49 C 133 46 131 43 126 44 Z"
        fill="#1C1C1A"
      />

      {/* Top serif ball/ear of C */}
      <path
        d="M 126 44 C 132 36 128 26 115 26 C 110 26 108 30 114 32 C 122 34 128 38 126 44 Z"
        fill="#1C1C1A"
      />

      {/* Golden Column / Pillar in the opening of C */}
      {/* Capital Top */}
      <path
        d="M 92 64 C 92 61.8 93.8 60 96 60 H 138 C 140.2 60 142 61.8 142 64 V 68 C 142 70.2 140.2 72 138 72 H 96 C 93.8 72 92 70.2 92 68 V 64 Z"
        fill="url(#contractosGoldGrad)"
      />
      <path
        d="M 95 72 H 139 V 76 C 139 77.1 138.1 78 137 78 H 97 C 95.9 78 95 77.1 95 76 V 72 Z"
        fill="#B89B5F"
      />

      {/* Fluted Shafts */}
      <rect x="98" y="81" width="6" height="64" rx="3" fill="url(#contractosGoldGrad)" />
      <rect x="108" y="81" width="6" height="64" rx="3" fill="url(#contractosGoldGrad)" />
      <rect x="118" y="81" width="6" height="64" rx="3" fill="url(#contractosGoldGrad)" />
      <rect x="128" y="81" width="6" height="64" rx="3" fill="url(#contractosGoldGrad)" />

      {/* Base Pedestal */}
      <path
        d="M 95 148 H 139 C 140.1 148 141 148.9 141 150 V 153 H 93 V 150 C 93 148.9 93.9 148 95 148 Z"
        fill="#B89B5F"
      />
      <path
        d="M 91 154 H 143 V 158 C 143 159.1 142.1 160 141 160 H 93 C 91.9 160 91 159.1 91 158 V 154 Z"
        fill="url(#contractosGoldGrad)"
      />

      {/* Swooshing Gold Base Underline Accent */}
      <path
        d="M 90 164 C 114 164 138 160 153 138 C 154 136.5 155.5 136.5 156 138 C 156.5 139.5 155.5 141.5 154 144 C 136 168 110 172 90 172 C 89 172 88.5 171 89 169.5 C 89.3 167.5 89.6 165.5 90 164 Z"
        fill="url(#contractosGoldGrad)"
      />
    </svg>
  );

  if (variant === 'mark') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center cursor-pointer ${className}`}
      >
        {MarkSVG}
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center gap-3 cursor-pointer group ${className}`}
      >
        {MarkSVG}
        <div className="flex flex-col text-left">
          <span className="font-serif font-semibold text-[#1C1C1A] tracking-[0.22em] uppercase text-base leading-none">
            CONTRACTOS
          </span>
          <span className="font-sans text-[9px] font-bold tracking-[0.25em] text-[#B89B5F] uppercase mt-1 leading-none">
            AI LEGAL INTELLIGENCE
          </span>
        </div>
      </div>
    );
  }

  // Full Stacked Logo (matching user image layout)
  return (
    <div
      onClick={onClick}
      className={`inline-flex flex-col items-center justify-center text-center cursor-pointer group select-none ${className}`}
    >
      {MarkSVG}
      <span className="font-serif font-bold text-[#1C1C1A] tracking-[0.28em] uppercase text-xl sm:text-2xl mt-3 leading-none">
        CONTRACTOS
      </span>
      <div className="w-10 h-[1.5px] bg-[#B89B5F] my-2.5"></div>
      <span className="font-sans text-[10px] sm:text-[11px] font-bold tracking-[0.28em] text-[#6E6D6A] uppercase leading-none">
        AI LEGAL INTELLIGENCE
      </span>
    </div>
  );
};


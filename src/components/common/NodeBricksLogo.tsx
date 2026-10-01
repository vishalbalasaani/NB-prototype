'use client';

import React from 'react';
import Image from 'next/image';

interface NodeBricksLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
  variant?: 'purple' | 'white';
  onlyMark?: boolean;
}

/**
 * Official NodeBricks Logo Mark & Typography
 * Uses the supplied transparent brand mark directly on the surface.
 * Never placed in a box, card, or colored container.
 */
export function NodeBricksLogo({
  size = 'md',
  showSubtitle = false,
  className = '',
  variant = 'purple',
  onlyMark = false,
}: NodeBricksLogoProps) {
  const iconDimensions = {
    sm: { width: 22, height: 22, className: 'w-[22px] h-[22px]' },
    md: { width: 28, height: 28, className: 'w-7 h-7' },
    lg: { width: 38, height: 38, className: 'w-[38px] h-[38px]' },
  };

  const textSizes = {
    sm: 'text-[15px]',
    md: 'text-[17px]',
    lg: 'text-2xl',
  };

  const subtitleSizes = {
    sm: 'text-[10px]',
    md: 'text-[11px]',
    lg: 'text-xs',
  };

  const isWhite = variant === 'white';
  const iconSrc = isWhite ? '/images/nodebricks-icon-white.png' : '/images/nodebricks-icon-purple.png';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official NodeBricks N Mark (Direct transparent asset, no container box) */}
      <div className={`${iconDimensions[size].className} relative flex items-center justify-center shrink-0`}>
        <Image
          src={iconSrc}
          alt="NodeBricks"
          width={iconDimensions[size].width}
          height={iconDimensions[size].height}
          priority
          unoptimized
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>

      {!onlyMark && (
        <div className="flex flex-col leading-tight">
          <span
            className={`font-bold tracking-tight ${textSizes[size]} ${
              isWhite ? 'text-white' : 'text-[#20201F]'
            }`}
          >
            NodeBricks
          </span>
          {showSubtitle && (
            <span
              className={`font-normal tracking-wide ${subtitleSizes[size]} ${
                isWhite ? 'text-white/75' : 'text-[#6F6D68]'
              }`}
            >
              School Management
            </span>
          )}
        </div>
      )}
    </div>
  );
}

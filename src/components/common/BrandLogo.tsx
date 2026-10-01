'use client';

import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  variant?: 'dark' | 'purple' | 'white';
  className?: string;
  width?: number;
}

/**
 * Official NodeBricks Brand Lockup Component
 * Single source of truth for internal application pages.
 * Responsive sizing:
 * - Desktop: ~150px
 * - Tablet: ~135px
 * - Mobile: ~120px
 * Preserves exact original asset aspect ratio and internal brand typography.
 */
export function BrandLogo({
  variant = 'dark',
  className = '',
  width,
}: BrandLogoProps) {
  const logoSrc =
    variant === 'white'
      ? '/images/nodebricks-logo-white-tight.png'
      : variant === 'purple'
      ? '/images/nodebricks-logo-purple-tight.png'
      : '/images/nodebricks-logo-dark-tight.png';

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${
        width ? '' : 'w-[118px] sm:w-[135px] lg:w-[150px]'
      } ${className}`}
      style={width ? { width: `${width}px` } : undefined}
    >
      <Image
        src={logoSrc}
        alt="NodeBricks"
        width={830}
        height={453}
        priority
        unoptimized
        className="w-full h-auto max-h-[38px] sm:max-h-[42px] lg:max-h-[46px] object-contain pointer-events-none"
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  onFinish: () => void;
}

/**
 * NodeBricks Splash Screen
 * ----------------------------------------------------
 * Pure brand introduction for application startup.
 * - Deep NodeBricks purple background (#382366 to #452D7A)
 * - Supplied white transparent logo asset (aspect ratio strictly preserved, no box, no container)
 * - Restrained architectural school line drawing at bottom (ultra-low opacity, elegant)
 * - Subtle 350ms entrance animation, then stationary
 * - Exactly ~3000ms duration, then gentle 250ms fade out to login
 * - Absolutely NO spinner, progress bar, or loading text
 */
export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 1. Trigger subtle logo entrance animation immediately on mount
    const entranceTimer = setTimeout(() => {
      setIsMounted(true);
    }, 40);

    // 2. Start gentle fade out at 2750ms
    const fadeOutTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2750);

    // 3. Complete transition at 3000ms
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 w-full h-[100dvh] min-h-[100dvh] flex flex-col justify-between items-center select-none overflow-hidden overscroll-none transition-opacity duration-250 ease-out ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(175deg, #432E74 0%, #392466 50%, #2E1B54 100%)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Top spacer to balance vertical layout */}
      <div className="w-full h-12 sm:h-16 shrink-0" />

      {/* Center: Brand Logo (Supplied White Transparent Asset) */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 my-auto">
        <div
          className={`transition-all duration-400 ease-out transform ${
            isMounted
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-1.5'
          }`}
        >
          {/* 
            Desktop: max-w-[340px]
            Tablet: max-w-[280px]
            Mobile: min(62vw, 230px)
            Natural aspect ratio preserved strictly; background visible through transparency
          */}
          <div className="w-[min(62vw,230px)] sm:w-[280px] lg:w-[340px] max-w-[340px] flex items-center justify-center">
            <Image
              src="/images/nodebricks-logo-white-tight.png"
              alt="NodeBricks"
              width={830}
              height={453}
              priority
              unoptimized
              className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-sm"
              style={{
                imageRendering: '-webkit-optimize-contrast',
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom: Subtle Architectural School Line Treatment (Ultra-low opacity, restrained, realistic) */}
      <div className="w-full flex justify-center items-end shrink-0 pointer-events-none overflow-hidden h-28 sm:h-36 opacity-[0.065]">
        <svg
          viewBox="0 0 1200 240"
          fill="none"
          stroke="white"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full max-w-5xl h-auto"
          preserveAspectRatio="xMidYMax meet"
        >
          {/* Ground baseline */}
          <line x1="50" y1="230" x2="1150" y2="230" />
          <line x1="120" y1="236" x2="1080" y2="236" />

          {/* Central Academy Building */}
          {/* Pediment / Triangular roof */}
          <polygon points="600,60 480,120 720,120" />
          <line x1="470" y1="120" x2="730" y2="120" strokeWidth="2" />
          
          {/* Clock or Emblem circle in pediment */}
          <circle cx="600" cy="95" r="14" />
          <line x1="600" y1="88" x2="600" y2="95" />
          <line x1="600" y1="95" x2="607" y2="95" />

          {/* Classical Columns */}
          <line x1="510" y1="120" x2="510" y2="230" />
          <line x1="520" y1="120" x2="520" y2="230" />
          <line x1="565" y1="120" x2="565" y2="230" />
          <line x1="575" y1="120" x2="575" y2="230" />
          <line x1="625" y1="120" x2="625" y2="230" />
          <line x1="635" y1="120" x2="635" y2="230" />
          <line x1="680" y1="120" x2="680" y2="230" />
          <line x1="690" y1="120" x2="690" y2="230" />

          {/* Main Entrance Arch */}
          <path d="M580,230 V175 A20,20 0 0,1 620,175 V230" />

          {/* Left Academic Wing */}
          <rect x="220" y="130" width="250" height="100" />
          <line x1="210" y1="130" x2="480" y2="130" strokeWidth="1.8" />
          {/* Window rows left wing */}
          <rect x="245" y="145" width="22" height="32" rx="1" />
          <rect x="290" y="145" width="22" height="32" rx="1" />
          <rect x="335" y="145" width="22" height="32" rx="1" />
          <rect x="380" y="145" width="22" height="32" rx="1" />
          <rect x="425" y="145" width="22" height="32" rx="1" />

          <rect x="245" y="188" width="22" height="32" rx="1" />
          <rect x="290" y="188" width="22" height="32" rx="1" />
          <rect x="335" y="188" width="22" height="32" rx="1" />
          <rect x="380" y="188" width="22" height="32" rx="1" />
          <rect x="425" y="188" width="22" height="32" rx="1" />

          {/* Right Academic Wing */}
          <rect x="730" y="130" width="250" height="100" />
          <line x1="720" y1="130" x2="990" y2="130" strokeWidth="1.8" />
          {/* Window rows right wing */}
          <rect x="755" y="145" width="22" height="32" rx="1" />
          <rect x="800" y="145" width="22" height="32" rx="1" />
          <rect x="845" y="145" width="22" height="32" rx="1" />
          <rect x="890" y="145" width="22" height="32" rx="1" />
          <rect x="935" y="145" width="22" height="32" rx="1" />

          <rect x="755" y="188" width="22" height="32" rx="1" />
          <rect x="800" y="188" width="22" height="32" rx="1" />
          <rect x="845" y="188" width="22" height="32" rx="1" />
          <rect x="890" y="188" width="22" height="32" rx="1" />
          <rect x="935" y="188" width="22" height="32" rx="1" />

          {/* Small Bell Tower / Cupola on central building roof */}
          <rect x="585" y="20" width="30" height="40" />
          <polygon points="600,0 580,20 620,20" />
          <line x1="600" y1="0" x2="600" y2="-8" />
        </svg>
      </div>
    </div>
  );
}

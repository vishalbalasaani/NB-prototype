'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { DataService } from '@/lib/data-service';
import { User } from '@/types';
import { NodeBricksLogo } from '@/components/common/NodeBricksLogo';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

interface SlideData {
  id: number;
  desktopImage: string;
  mobileImage: string;
  headlineDesktop: string;
  headlineMobile: string;
  subtext: string;
  tabLabel: string;
}

const SLIDES: SlideData[] = [
  {
    id: 1,
    desktopImage: '/images/desktop_slide1_campus.jpg',
    mobileImage: '/images/slide1_campus.jpg',
    headlineDesktop: 'Everything your school needs,\nin one place.',
    headlineMobile: 'Everything your school needs,\nin one place.',
    subtext: 'Manage students, attendance, marks, updates and more with ease.',
    tabLabel: '01 Everything in one place',
  },
  {
    id: 2,
    desktopImage: '/images/desktop_slide2_classroom.jpg',
    mobileImage: '/images/slide2_classroom.jpg',
    headlineDesktop: 'Attendance made simple.',
    headlineMobile: 'Attendance made simple.',
    subtext: "Record daily attendance and keep every student's history organized.",
    tabLabel: '02 Attendance made simple',
  },
  {
    id: 3,
    desktopImage: '/images/desktop_slide3_report.jpg',
    mobileImage: '/images/slide3_report.jpg',
    headlineDesktop: 'Clear reports for better\nschool management.',
    headlineMobile: 'Clear reports for better\nschool management.',
    subtext: 'Make informed decisions with simple and meaningful insights.',
    tabLabel: '03 Clear reports. Better decisions.',
  },
];

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  // Active slide index (0, 1, 2)
  const [activeSlide, setActiveSlide] = useState(0);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Mobile view state: false = Onboarding Screen, true = Authentication Screen
  const [showMobileLoginForm, setShowMobileLoginForm] = useState(false);

  // Continuous Auto-play Carousel Timer: 3.5 SECONDS (3500ms)
  // Shared across Onboarding and Login without pausing or restarting
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  // Touch Swipe for Mobile (Swiping changes slides only, never triggers login form)
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (showMobileLoginForm) return;
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (showMobileLoginForm) return;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (showMobileLoginForm) return;
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 45) {
      // Swiped Left -> Next Slide
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    } else if (distance < -45) {
      // Swiped Right -> Prev Slide
      setActiveSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Previous & Next navigation handlers (desktop)
  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % SLIDES.length);
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await DataService.login(email.trim(), password);
      if (result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage('Invalid email or password.');
      }
    } catch {
      setErrorMessage('Could not sign in. Please verify your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 h-[100dvh] w-full flex bg-[#FFFFFF] font-sans text-[#20201F] select-none overflow-hidden overscroll-none">
      {/* ========================================================== */}
      {/* 1. DESKTOP VIEW (≥ 1024px) - EXACT TWO-COLUMN REFERENCE    */}
      {/* ========================================================== */}
      <div className="hidden lg:flex w-full h-screen overflow-hidden">
        {/* -------------------------------------------------------- */}
        {/* LEFT COLUMN: HIGH-RES ROTATING HERO VISUAL (~62% WIDTH)  */}
        {/* -------------------------------------------------------- */}
        <div className="relative w-7/12 xl:w-[62%] h-full flex flex-col justify-between p-8 xl:p-12 2xl:p-14 overflow-hidden select-none bg-[#1A1A1A]">
          {/* Background Images with smooth subtle crossfade */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {SLIDES.map((slide, idx) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
                  activeSlide === idx ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Image
                  src={slide.desktopImage}
                  alt={slide.headlineDesktop}
                  fill
                  priority
                  unoptimized
                  className="object-cover object-center"
                  sizes="62vw"
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                />
                {/* Subtle dark vignette overlay for legibility matching reference */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/25" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
              </div>
            ))}
          </div>

          {/* Top Row: Supplied White NodeBricks Logo (Directly on hero visual, no container box) */}
          <div className="relative z-20 flex items-center">
            <div className="h-10 sm:h-11 w-auto flex items-center">
              <Image
                src="/images/nodebricks-logo-white-tight.png"
                alt="NodeBricks"
                width={830}
                height={453}
                priority
                unoptimized
                className="h-9 sm:h-10 w-auto object-contain select-none pointer-events-none drop-shadow-sm"
              />
            </div>
          </div>

          {/* Middle Content: Dynamic Headline + Subtext */}
          <div className="relative z-20 max-w-2xl my-auto space-y-5 pt-8">
            {/* Dynamic Headline */}
            <h1 className="text-4xl xl:text-5xl 2xl:text-6xl font-bold text-white tracking-tight leading-[1.14] whitespace-pre-line transition-all duration-500 drop-shadow-sm">
              {SLIDES[activeSlide].headlineDesktop}
            </h1>

            {/* Subtitle */}
            <p className="text-sm xl:text-base text-white/90 font-normal leading-relaxed max-w-lg transition-all duration-500 drop-shadow-xs">
              {SLIDES[activeSlide].subtext}
            </p>
          </div>
        </div>

        {/* -------------------------------------------------------- */}
        {/* RIGHT COLUMN: LOGIN FORM PANEL (~38% WIDTH)               */}
        {/* -------------------------------------------------------- */}
        <div className="relative w-5/12 xl:w-[38%] h-full flex flex-col justify-between p-8 xl:p-12 2xl:p-14 bg-[#FFFFFF] overflow-y-auto">
          {/* Top Right Tagline */}
          <div className="flex justify-end select-none">
            <p className="text-right text-xs text-[#716E68] font-medium tracking-tight">
              A smarter way to manage schools
            </p>
          </div>

          {/* Centered Login Card Form */}
          <div className="w-full max-w-[390px] mx-auto my-auto py-8">
            {/* Heading & Subtitle (Clean form without duplicate logo clutter) */}
            <div className="mb-7">
              <h2 className="text-2xl sm:text-[28px] font-bold text-[#20201F] tracking-tight leading-tight">
                Welcome
              </h2>
              <p className="text-xs sm:text-[13px] text-[#6F6D68] mt-1 font-normal">
                Sign in to continue to NodeBricks
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-[#FBF1F0] border border-[#F3D7D5] text-[#B65C55] text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Info Banner */}
            {infoMessage && (
              <div className="mb-4 p-3 rounded-xl bg-[#EFF5F1] border border-[#D5E5D9] text-[#557A61] text-xs flex items-start gap-2.5 animate-in fade-in">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{infoMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label
                  htmlFor="desktop-login-email"
                  className="block text-xs font-semibold text-[#20201F]"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8C8880] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="desktop-login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full h-12 pl-10 pr-4 text-xs sm:text-sm text-[#20201F] bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl focus:outline-none focus:border-[#5B4B8A] focus:ring-1 focus:ring-[#5B4B8A] transition-colors placeholder:text-[#6F6D68]/60"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="desktop-login-password"
                  className="block text-xs font-semibold text-[#20201F]"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8C8880] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="desktop-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-12 pl-10 pr-10 text-xs sm:text-sm text-[#20201F] bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl focus:outline-none focus:border-[#5B4B8A] focus:ring-1 focus:ring-[#5B4B8A] transition-colors placeholder:text-[#6F6D68]/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C8880] hover:text-[#20201F] transition-colors p-0.5 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me checkbox */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#E5E2DC] text-[#5B4B8A] focus:ring-[#5B4B8A] accent-[#5B4B8A]"
                  />
                  <span className="text-xs text-[#524F49]">
                    Remember my login for faster sign-in
                  </span>
                </label>
              </div>

              {/* Submit Button: Login → */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-[#5B4B8A] hover:bg-[#433665] active:scale-[0.99] text-white font-medium text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <>
                      <span>Login</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setInfoMessage(
                      'Please contact your school office administrator to reset your credentials.'
                    )
                  }
                  className="text-xs font-medium text-[#5B4B8A] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

            </form>
          </div>

          {/* Footer Terms & Conditions */}
          <div className="text-center pt-4 z-10">
            <p className="text-[11px] text-[#8C8880]">By continuing, you agree to our</p>
            <p className="text-xs text-[#5B4B8A] font-medium mt-0.5 space-x-1.5">
              <span className="cursor-pointer hover:underline">Privacy Policy</span>
              <span className="text-[#8C8880]">&bull;</span>
              <span className="cursor-pointer hover:underline">Terms &amp; Conditions</span>
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 2. MOBILE VIEW (< 1024px)                                  */}
      {/* ========================================================== */}
      <div className="fixed inset-0 flex lg:hidden flex-col w-full h-[100dvh] bg-white items-center justify-center select-none overflow-hidden overscroll-none touch-pan-x">
        <div
          className="w-full h-full max-w-[480px] bg-white overflow-hidden flex flex-col justify-between relative overscroll-none touch-pan-x"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {showMobileLoginForm ? (
            /* -------------------------------------------------------- */
            /* MOBILE AUTHENTICATION SCREEN                             */
            /* PERSISTING & CONTINUING THE SAME CAROUSEL IN UPPER 32%   */
            /* -------------------------------------------------------- */
            <div className="relative z-30 w-full h-full flex flex-col overflow-hidden bg-white overscroll-none touch-none">
              {/* UPPER SECTION: SAME CAROUSEL (30-35% viewport, smooth crossfade, shrinks if keyboard opens) */}
              <div className="relative w-full h-[32%] min-h-[135px] max-h-[250px] shrink transition-all duration-300 overflow-hidden select-none pointer-events-none">
                {/* 3 Slides with 300ms subtle crossfade */}
                {SLIDES.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
                      activeSlide === idx ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <Image
                      src={slide.mobileImage}
                      alt={slide.headlineMobile}
                      fill
                      priority={idx === 0}
                      unoptimized
                      className="object-cover object-center"
                      style={{ imageRendering: '-webkit-optimize-contrast' }}
                    />
                    {/* Subtle depth gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/25 pointer-events-none" />
                  </div>
                ))}

                {/* 3 Pagination Dots near bottom of image (Subtle: Active #5B4B8A, Inactive #D8D4DF) */}
                <div className="absolute bottom-3 inset-x-0 z-10 flex items-center justify-center gap-1.5 pointer-events-none">
                  {SLIDES.map((slide, idx) => (
                    <span
                      key={slide.id}
                      className={`rounded-full transition-all duration-300 ${
                        activeSlide === idx
                          ? 'w-4 h-1.5 bg-[#5B4B8A]'
                          : 'w-1.5 h-1.5 bg-[#D8D4DF]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* LOWER SECTION: STABLE FORM CARD (Overlaps image slightly with rounded-t-[24px]) */}
              <div className="relative z-20 flex-1 min-h-0 bg-white rounded-t-[24px] -mt-3.5 px-6 pt-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col justify-between shadow-[0_-6px_20px_rgba(0,0,0,0.06)] overflow-y-auto overflow-x-hidden overscroll-contain">
                {/* Top Row: Back Button & Compact Logo */}
                <div className="flex items-center justify-between select-none shrink-0 mb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileLoginForm(false);
                      setErrorMessage(null);
                      setInfoMessage(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#20201F] hover:text-[#5B4B8A] transition-colors py-1 px-1.5 rounded-lg hover:bg-black/5 cursor-pointer -ml-1.5 touch-manipulation"
                    aria-label="Back"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#20201F]" />
                    <span>Back</span>
                  </button>

                  <NodeBricksLogo size="sm" showSubtitle={false} />
                </div>

                {/* Main Content Area */}
                <div className="my-auto py-1 shrink-0">
                  {/* Heading & Subtitle */}
                  <div className="mb-3 select-none">
                    <h2 className="text-[26px] sm:text-[28px] font-bold text-[#20201F] tracking-tight leading-tight">
                      Welcome
                    </h2>
                    <p className="text-[14px] sm:text-[15px] text-[#6F6D68] mt-0.5 font-normal leading-normal">
                      Sign in to continue to NodeBricks
                    </p>
                  </div>

                  {/* Error Banner */}
                  {errorMessage && (
                    <div className="mb-3 p-2.5 rounded-xl bg-[#FBF1F0] border border-[#F3D7D5] text-[#B65C55] text-xs flex items-start gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Info Banner */}
                  {infoMessage && (
                    <div className="mb-3 p-2.5 rounded-xl bg-[#EFF5F1] border border-[#D5E5D9] text-[#557A61] text-xs flex items-start gap-2 animate-in fade-in">
                      <Info className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{infoMessage}</span>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Email Field */}
                    <div className="space-y-1">
                      <label
                        htmlFor="mobile-auth-email"
                        className="block text-xs font-semibold text-[#20201F]"
                      >
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#6F6D68] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="mobile-auth-email"
                          type="email"
                          required
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="w-full h-[50px] pl-10 pr-3.5 text-sm text-[#20201F] bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl focus:outline-none focus:border-[#5B4B8A] focus:ring-1 focus:ring-[#5B4B8A] transition-colors placeholder:text-[#6F6D68]/70 touch-auto"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1">
                      <label
                        htmlFor="mobile-auth-password"
                        className="block text-xs font-semibold text-[#20201F]"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#6F6D68] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="mobile-auth-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full h-[50px] pl-10 pr-10 text-sm text-[#20201F] bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl focus:outline-none focus:border-[#5B4B8A] focus:ring-1 focus:ring-[#5B4B8A] transition-colors placeholder:text-[#6F6D68]/70 touch-auto"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6F6D68] hover:text-[#20201F] transition-colors p-1 cursor-pointer touch-manipulation"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Forgot Password Link */}
                    <div className="flex justify-end pt-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          setInfoMessage(
                            'Please contact your school office administrator to reset your credentials.'
                          )
                        }
                        className="text-xs font-medium text-[#5B4B8A] hover:underline cursor-pointer touch-manipulation"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Login Button */}
                    <div className="pt-1.5">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-[52px] bg-[#5B4B8A] hover:bg-[#433665] active:scale-[0.99] text-white font-semibold text-[15px] rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-xs touch-manipulation"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Signing in…</span>
                          </>
                        ) : (
                          <span>Login</span>
                        )}
                      </button>
                    </div>

                  </form>
                </div>

                {/* Footer: Privacy Policy · Terms & Conditions */}
                <div className="pt-2.5 pb-1 text-center select-none shrink-0">
                  <p className="text-[11px] sm:text-xs text-[#6F6D68] space-x-1">
                    <span className="cursor-pointer hover:underline hover:text-[#5B4B8A]">
                      Privacy Policy
                    </span>
                    <span className="text-[#6F6D68]/60">·</span>
                    <span className="cursor-pointer hover:underline hover:text-[#5B4B8A]">
                      Terms &amp; Conditions
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* -------------------------------------------------------- */
            /* MOBILE ONBOARDING SCREEN (Primary Welcome Experience)   */
            /* -------------------------------------------------------- */
            <>
              {/* Background Photograph Layer (Covers Screen, Auto 3.5s Slide Transitions) */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {SLIDES.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
                      activeSlide === idx ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <Image
                      src={slide.mobileImage}
                      alt={slide.headlineMobile}
                      fill
                      priority={idx === 0}
                      unoptimized
                      className="object-cover object-center"
                      style={{ imageRendering: '-webkit-optimize-contrast' }}
                    />
                    {/* Subtle readability gradient at top so headline/branding are crisp */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#FFFFFF] via-[#FFFFFF]/85 via-35% to-transparent h-[55%]" />
                  </div>
                ))}
              </div>

              {/* Top Section & Hero Content Canvas */}
              <div className="relative z-10 flex-1 flex flex-col justify-between overflow-hidden">
                {/* Top Bar: Clean NodeBricks Branding */}
                <div className="pt-4 px-6 pb-2 flex items-center justify-between">
                  <NodeBricksLogo size="sm" showSubtitle={false} />
                </div>

                {/* Hero Slide Headline & Description */}
                <div className="px-6 pt-2 pb-1 space-y-1.5 max-w-[92%]">
                  <h1 className="text-[22px] sm:text-[25px] font-bold text-[#20201F] tracking-tight leading-[1.22] whitespace-pre-line transition-all duration-300">
                    {SLIDES[activeSlide].headlineMobile}
                  </h1>
                  <p className="text-xs sm:text-[13px] text-[#6F6D68] leading-relaxed transition-all duration-300 font-normal">
                    {SLIDES[activeSlide].subtext}
                  </p>
                </div>

                {/* 3 Pagination Dots Floating Directly Above Bottom Sheet (Subtle: Active #5B4B8A, Inactive #D8D4DF) */}
                <div className="flex items-center justify-center gap-1.5 pb-3.5 mt-auto">
                  {SLIDES.map((slide, idx) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setActiveSlide(idx)}
                      className={`rounded-full transition-all duration-300 cursor-pointer ${
                        activeSlide === idx
                          ? 'w-4 h-1.5 bg-[#5B4B8A]'
                          : 'w-1.5 h-1.5 bg-[#D8D4DF]'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Lower Section: Compact White Bottom Sheet */}
              <div className="relative z-20 bg-[#FFFFFF] rounded-t-[28px] sm:rounded-t-[32px] px-6 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] border-t border-[#E5E2DC]/80 shrink-0">
                <div className="mb-3.5">
                  <h2 className="text-[20px] sm:text-[22px] font-bold text-[#20201F] tracking-tight">
                    Welcome
                  </h2>
                  <p className="text-xs sm:text-[13px] text-[#6F6D68] mt-0.5">
                    Sign in to continue to NodeBricks
                  </p>
                </div>

                {/* ONE Login button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileLoginForm(true);
                    setErrorMessage(null);
                    setInfoMessage(null);
                  }}
                  className="w-full h-[52px] bg-[#5B4B8A] hover:bg-[#433665] active:scale-[0.99] text-white font-medium text-sm sm:text-[15px] rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Footer: Privacy Policy · Terms & Conditions */}
                <div className="pt-3.5 text-center">
                  <p className="text-[11px] sm:text-xs text-[#6F6D68] space-x-1">
                    <span className="cursor-pointer hover:underline hover:text-[#5B4B8A]">
                      Privacy Policy
                    </span>
                    <span className="text-[#6F6D68]/60">·</span>
                    <span className="cursor-pointer hover:underline hover:text-[#5B4B8A]">
                      Terms &amp; Conditions
                    </span>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

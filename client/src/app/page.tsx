"use client";

import React from "react";
import { Navigation } from "@/components/landing/Navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProductMockup } from "@/components/landing/ProductMockup";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ShowcaseSection } from "@/components/landing/ShowcaseSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";
import { SiteFooter } from "@/components/landing/SiteFooter";

/* ─────────────────────────────────────────────────────────
   PAGE EXPORT (Gradient Background)
   ───────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50/40 via-white via-purple-50/20 via-white to-emerald-50/30 text-neutral-900 relative overflow-x-hidden">
      {/* Decorative ambient gradient backdrop orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[500px] bg-gradient-to-br from-blue-100/50 via-purple-100/30 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-gradient-to-bl from-pink-100/40 via-rose-100/20 to-transparent rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[600px] left-10 w-[550px] h-[450px] bg-gradient-to-tr from-emerald-100/40 via-teal-50/30 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <Navigation />
      <HeroSection />

      {/* Hero product mockup */}
      <div className="animate-reveal-scale stagger-4 mx-auto mt-16 max-w-5xl px-6 sm:px-10 lg:px-12 mb-20 sm:mb-28">
        <ProductMockup />
      </div>

      <FeaturesSection />
      <HowItWorksSection />
      <ShowcaseSection />
      <SocialProofSection />
      <FinalCTASection />
      <SiteFooter />
    </main>
  );
}

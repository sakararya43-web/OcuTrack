import React from 'react';
import { DisclaimerBanner } from '../components/layout/DisclaimerBanner';
import { Header } from '../components/layout/Header';
import { HelloMondayHero } from '../components/landing/HelloMondayHero';
import { HelloMondayMarquee } from '../components/landing/HelloMondayMarquee';
import { JudgeStoryScroll } from '../components/landing/JudgeStoryScroll';
import { Ocular3DSection } from '../components/landing/Ocular3DSection';
import { HelloMondayProtocols } from '../components/landing/HelloMondayProtocols';
import { JudgeBenchmarkSimulator } from '../components/landing/JudgeBenchmarkSimulator';
import { HelloMondayScience } from '../components/landing/HelloMondayScience';
import { HelloMondayPupilScrubber } from '../components/landing/HelloMondayPupilScrubber';
import { HelloMondayPursuitSandbox } from '../components/landing/HelloMondayPursuitSandbox';
import { HelloMondayLongitudinalSlider } from '../components/landing/HelloMondayLongitudinalSlider';
import { TechnicalArchitectureMatrix } from '../components/landing/TechnicalArchitectureMatrix';
import { HelloMondayFooter } from '../components/landing/HelloMondayFooter';
import { JudgeFloatingHUD } from '../components/landing/JudgeFloatingHUD';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-[#0F172A] selection:bg-[#0F172A] selection:text-white overflow-x-hidden">
      {/* 1. Protocol Notice Banner */}
      <DisclaimerBanner />

      {/* 3. Creative Studio Header with Mega-Menu & Patient Search */}
      <Header />

      <main>
        {/* 4. Hero Section: Kinetic Typography, Living Iris Canvas, Sim Flash */}
        <HelloMondayHero />

        {/* 5. Infinite Dual-Sliding Kinetic Marquee */}
        <HelloMondayMarquee />

        {/* 6. Executive Chronicle for Judges: 5-Act Interactive Story */}
        <JudgeStoryScroll />

        {/* 7. GPU-Accelerated WebGL 3D Ocular Globe & Reflex Pathway */}
        <Ocular3DSection />

        {/* 8. Standardized Clinical Formulations (Protocol Grid) */}
        <HelloMondayProtocols />

        {/* 9. Interactive 1-Click Clinical Benchmark Simulator */}
        <JudgeBenchmarkSimulator />

        {/* 10. Science & Metrology: 11.7mm Caliper Ruler & Ephemeral Destruction */}
        <HelloMondayScience />

        {/* 11. Chapter 01: Chrono-Rotary Pupillary Reflex Scrubber */}
        <HelloMondayPupilScrubber />

        {/* 12. Chapter 02: Vector Kinematics Pursuit Sandbox */}
        <HelloMondayPursuitSandbox />

        {/* 13. Chapter 03: Dual-Session Longitudinal Comparator */}
        <HelloMondayLongitudinalSlider />

        {/* 14. 4-Tier Full Stack Technical Architecture Deep Dive */}
        <TechnicalArchitectureMatrix />
      </main>

      {/* 15. Hello Monday Kinetic Footer */}
      <HelloMondayFooter />

      {/* 16. Floating Judge Navigation HUD */}
      <JudgeFloatingHUD />
    </div>
  );
};

export default LandingPage;

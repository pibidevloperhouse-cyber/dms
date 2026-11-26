"use client";

import DealDocumentsBackdrop from "./DealDocumentsBackdrop";
import React, { useState, useCallback } from "react";
import { ArrowRight, RotateCcw, Check, Users, FileSearch } from "lucide-react";

// Badge heights follow the outer circle, whose radius is 24% of the canvas width.
const STAGES = [
  {
    step: 1,
    title: "Search your correct deal",
    buttonText: "Next",
    iconDark: "/data_icon_globe.png",
    alt: "Search Deal Icon",
    nodeLeft: "30%",
    nodeTop: "calc(53% + 10.734cqw)",
    cardLeft: "30%",
    cardTop: "calc(53% + 10.734cqw - 44px)",
    activeBadgeBg: "bg-cyan-400",
    activeRing: "ring-4 ring-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.9)]",
    buttonBg: "bg-[rgb(15,78,165)] hover:bg-[rgb(12,65,140)] text-white",
  },
  {
    step: 2,
    title: "Connect with parties",
    buttonText: "Next",
    Icon: Users,
    alt: "Connect Parties Icon",
    nodeLeft: "42%",
    nodeTop: "calc(53% + 1.373cqw)",
    cardLeft: "42%",
    cardTop: "calc(53% + 1.373cqw - 44px)",
    activeBadgeBg: "bg-cyan-400",
    activeRing: "ring-4 ring-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.9)]",
    buttonBg: "bg-[rgb(15,78,165)] hover:bg-[rgb(12,65,140)] text-white",
  },
  {
    step: 3,
    title: "Inspect deal files",
    buttonText: "Next",
    Icon: FileSearch,
    alt: "Inspect Files Icon",
    nodeLeft: "58%",
    nodeTop: "calc(53% + 1.373cqw)",
    cardLeft: "58%",
    cardTop: "calc(53% + 1.373cqw - 44px)",
    activeBadgeBg: "bg-cyan-400",
    activeRing: "ring-4 ring-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.9)]",
    buttonBg: "bg-[rgb(15,78,165)] hover:bg-[rgb(12,65,140)] text-white",
  },
  {
    step: 4,
    title: "Submit & review bidding",
    buttonText: "Next",
    iconDark: "/data_icon_doc.png",
    alt: "Review Bidding Icon",
    nodeLeft: "70%",
    nodeTop: "calc(53% + 10.734cqw)",
    cardLeft: "70%",
    cardTop: "calc(53% + 10.734cqw - 44px)",
    activeBadgeBg: "bg-cyan-400",
    activeRing: "ring-4 ring-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.9)]",
    buttonBg: "bg-[rgb(15,78,165)] hover:bg-[rgb(12,65,140)] text-white",
  },
  {
    step: 5,
    title: "Deal closed",
    buttonText: "Replay walkthrough",
    iconDark: null,
    alt: "Deal Closed",
    nodeLeft: "50%",
    nodeTop: "52.6%",
    cardLeft: "50%",
    cardTop: "49%",
    activeBadgeBg: "bg-teal-400",
    activeRing: "ring-4 ring-teal-300 shadow-[0_0_28px_rgba(45,212,191,0.9)]",
    buttonBg: "bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:outline-slate-600",
  },
];

export default function DocumentWorkspaceHero({
  headlinePrimary = "Move your deal forward.",
  headlineAccent = "From first interest to close.",
}) {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  const handleNext = useCallback(() => {
    setCurrentStageIdx((prev) => (prev + 1) % STAGES.length);
  }, []);

  const handleSelectStage = useCallback((idx) => {
    setCurrentStageIdx(idx);
  }, []);

  const currentStage = STAGES[currentStageIdx];
  const isFinalStep = currentStageIdx === 4;

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative w-full text-white hero-full-bleed-bg overflow-hidden pt-20 sm:pt-24 lg:pt-28 pb-8 sm:pb-12"
    >
      {/* 
        Unified 1024x407 Canvas Container (aspect-ratio 2.52)
        Both the Pure CSS background (.hero-background, .ring, .trace)
        and the interactive elements (badges, dotted path, tooltip card)
        share this EXACT same coordinate canvas, ensuring 100% locked alignment!
      */}
      <div className="relative w-full [container-type:inline-size] aspect-[2.52/1] min-h-[440px] sm:min-h-[520px] md:min-h-[580px] lg:min-h-[620px] max-w-[1440px] mx-auto select-none">
        {/* Pure CSS Hero Background Layer from user's snippet */}
        <div className="hero-background" aria-hidden="true">
          <div className="trace trace-left"><span className="terminal"></span></div>
          <div className="trace trace-right"><span className="terminal"></span></div>
          <div className="short-trace"><span className="terminal"></span></div>
          <div className="ring" data-closed={isFinalStep}></div>
          <DealDocumentsBackdrop isBidding={currentStageIdx === 3} isClosed={isFinalStep} />
        </div>

        {/* Centered Headline positioned matching user reference */}
        <div className="absolute top-4 sm:top-5 lg:top-6 left-1/2 -translate-x-1/2 w-full text-center px-4 z-10 pointer-events-none">
          <h1
            id="hero-heading"
            className="deal-hero-title"
          >
            <span>{headlinePrimary}</span>
            {headlineAccent && (
              <span>
                {headlineAccent}
              </span>
            )}
          </h1>
        </div>





        {/* Dynamic Next Card hovering with pointer caret pointing directly to the active badge */}
        <div
          className="deal-stage-card absolute z-30 transition-all duration-500 ease-out"
          data-side={currentStage.step === 1 ? "left" : currentStage.step === 4 ? "right" : "top"}
          style={{
            left: currentStage.cardLeft,
            
            "--card-top": currentStage.cardTop,
            "--badge-top": currentStage.nodeTop,
          }}
        >
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/90 shadow-[0_18px_45px_rgba(7,25,54,0.32)] ring-1 ring-[#0F4EA5]/10 min-w-[200px] sm:min-w-[235px] text-center relative group">
            {/* Step indicator & progress dots */}
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[rgb(15,78,165)]">
                Step {currentStage.step} / {STAGES.length}
              </span>
              <div className="flex items-center gap-1" aria-hidden="true">
                {STAGES.map((s, i) => (
                  <span
                    key={s.step}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStageIdx
                        ? "w-4 bg-cyan-500"
                        : i < currentStageIdx
                          ? "w-1.5 bg-[rgb(15,78,165)]"
                          : "w-1.5 bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Card Title */}
            <h4 className="text-[13px] sm:text-[15px] font-bold text-[#0f172a] leading-snug whitespace-nowrap">
              {currentStage.title}
            </h4>

            {/* Next / Action Button */}
            <div className="mt-2 flex items-center justify-center">
              <button
                type="button"
                onClick={handleNext}
                className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-1.5 sm:py-2 ${currentStage.buttonBg} text-[11px] sm:text-xs font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-150 active:scale-95 cursor-pointer`}
              >
                <span>{currentStage.buttonText}</span>
                {!isFinalStep ? (
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Pointer caret pointing directly to active logo */}
            <div
              className="deal-stage-pointer absolute size-3 rotate-45 bg-white"
            />
          </div>
        </div>

        {/* Four stage badges along the outer edge of the ring */}
        {STAGES.slice(0, 4).map((stage, idx) => {
          const isActive = currentStageIdx === idx;
          const isCompleted = currentStageIdx > idx && !isFinalStep;

          return (
            <div
              key={stage.step}
              className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
              style={{
                left: stage.nodeLeft,
                top: stage.nodeTop,
              }}
            >
              {/* Clickable circular logo button */}
              <button
                type="button"
                onClick={() => handleSelectStage(idx)}
                aria-label={stage.alt}
                className={`relative rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                  isActive
                    ? `w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 ${stage.activeBadgeBg} ${stage.activeRing} scale-110 sm:scale-115`
                    : "w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white hover:bg-slate-50 border-2 border-white/90 shadow-[0_6px_20px_rgba(0,0,0,0.3)] hover:scale-110"
                }`}
              >
                {/* The Logo Image */}
                {stage.Icon ? (
                  <stage.Icon
                    aria-hidden="true"
                    strokeWidth={1.8}
                    className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-black"
                  />
                ) : (
                  <img
                    src={stage.iconDark}
                    alt={stage.alt}
                    className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 object-contain transition-all duration-200 ${
                      isActive
                        ? "filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)] brightness-95"
                        : "opacity-85 hover:opacity-100"
                    }`}
                  />
                )}

                {/* Completed checkmark badge */}
                {isCompleted && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-4.5 sm:h-4.5 bg-[#10b981] rounded-full ring-2 ring-white flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white stroke-[3.5]" />
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

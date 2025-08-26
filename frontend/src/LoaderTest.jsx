import React, { useState, useEffect } from "react";
import BookLoader from "./BookLoader"; // ✅ adjust path if needed
import { Loader2 } from "lucide-react";
import gsap from "gsap";

// -- Bring over EngagingLoadingAnimation and FullScreenStatus from GenerateFiles.jsx --
const EngagingLoadingAnimation = ({ progress }) => {
  const [currentTip, setCurrentTip] = useState(0);
  const loadingTips = [
    "Analyzing meeting content...",
    "Extracting key requirements...",
    "Structuring documentation...",
    "Generating technical specifications...",
    "Almost done! Finalizing documents...",
  ];

  useEffect(() => {
    const tipIndex = Math.min(Math.floor(progress / 20), loadingTips.length - 1);
    setCurrentTip(tipIndex);
  }, [progress, loadingTips.length]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900/95 backdrop-blur-md">
      <div className="text-center max-w-md mx-4 ">
        <div className="mb-20">
          <BookLoader text="Crafting Your Documents" />
        </div>

        {/* Progress Circle */}
        <div className="relative mb-6">
          <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 translate-y-6 bg-blue-500 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
            {Math.round(progress)}%
          </div>
        </div>

        <h3 className="text-xl font-semibold text-white mb-4">Processing Documents</h3>
        <p className="text-blue-300 text-sm animate-pulse">✨ {loadingTips[currentTip]}</p>
      </div>
    </div>
  );
};

const FullScreenStatus = ({ loading, error, loadingText }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4 text-center">
    {loading && (
      <>
        <BookLoader text={loadingText} />
        <Loader2 className="animate-spin text-blue-400 mt-6" size={32} />
      </>
    )}
    {error && <p className="text-lg text-red-500">{error}</p>}
  </div>
);

// -- New showcase component --
export default function LoaderTest() {
  const [progress, setProgress] = useState(0);

  // fake progress loop
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 10));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-20">
      {/* BookLoader alone */}
      <div className="h-screen flex flex-col items-center justify-center bg-slate-800">
        <h2 className="text-white mb-60">BookLoader</h2>
        <BookLoader text="Loading Book..." />
      </div>

      {/* Full screen loader */}
      <div className="h-screen">
        <FullScreenStatus loading={true} loadingText="Generating documents..." />
      </div>

      {/* Fancy engaging loading animation */}
      <div className="h-screen">
        <EngagingLoadingAnimation progress={progress} />
      </div>
    </div>
  );
}

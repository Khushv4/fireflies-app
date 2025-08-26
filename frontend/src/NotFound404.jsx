import { useEffect } from "react";

export default function NotFound404() {
  useEffect(() => {
    const light = document.querySelector(".light");
    const text = document.querySelector(".text-404");

    const handleMouseMove = (e) => {
      if (!light || !text) return;
      light.style.left = e.clientX + "px";
      light.style.top = e.clientY + "px";

      const rect = text.getBoundingClientRect();
      const textCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };

      const distance = Math.sqrt(
        Math.pow(e.clientX - textCenter.x, 2) +
          Math.pow(e.clientY - textCenter.y, 2)
      );

      const brightness = Math.max(0.3, 1 - distance / 500);
      text.style.color = `rgba(200,200,200,${brightness})`;
    };

    const handleTouchMove = (e) => {
      if (!light) return;
      const touch = e.touches[0];
      light.style.left = touch.clientX + "px";
      light.style.top = touch.clientY + "px";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden cursor-none">
      {/* Fullscreen 404 */}
      <div className="relative text-center">
        <div className="text-404 text-[20vw] font-bold tracking-wider select-none text-gray-300 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
          404
        </div>
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-gray-300 font-sans text-2xl whitespace-nowrap drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
          Page Not Found!
        </div>
      </div>

      {/* Big glowing light following cursor */}
      <div
        className="light fixed w-[800px] h-[800px] rounded-full pointer-events-none mix-blend-screen"
        style={{
          background: `radial-gradient(circle,
            rgba(255,255,255,0.2) 0%,
            rgba(255,255,255,0.1) 25%,
            rgba(255,255,255,0.05) 50%,
            transparent 80%)`,
          transform: "translate(-50%, -50%)",
        }}
      ></div>
    </div>
  );
}

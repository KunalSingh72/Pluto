import type { ReactNode } from "react";

interface BackgroundGridProps {
  children: ReactNode;
}

export default function BackgroundGrid({ children }: BackgroundGridProps) {
  return (
    <div className="relative w-full h-full min-h-screen">
      
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-15 mix-blend-normal"
        style={{
          backgroundImage: `radial-gradient(circle at center, currentColor 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />

      {/* Content Wrapper */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}

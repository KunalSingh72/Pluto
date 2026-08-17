"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function SidePanel({
  isOpen,
  onClose,
  title,
  children,
}: SidePanelProps) {
  const [mounted, setMounted] = useState(false);

  // Push state update to the next tick to prevent cascading render warnings
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  const root = document.getElementById("right-sidebar-root");
  if (!root) return null;

  return createPortal(
    <aside
      className={`h-full flex flex-col transition-[width] duration-300 ease-in-out overflow-hidden border-zinc-800/80 bg-[#09090b] shadow-2xl shadow-black/50 ${
        isOpen ? "w-[400px] border-l" : "w-0 border-l-0"
      }`}
    >
      {/* 
        Inner wrapper stays a fixed 400px so content doesn't wrap/squish 
        weirdly while the outer container width animates to 0 
      */}
      <div className="w-[400px] flex flex-col h-full">
        {/* Universal Top Bar for the Sidebar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 shrink-0 bg-[#09090b]">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            {title || "Details"}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Close Panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col h-full relative">
          {children}
        </div>
      </div>
    </aside>,
    root,
  );
}

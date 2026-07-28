"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ReactNode } from "react";

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
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* 
        We use bg-[#09090b] with border-zinc-800 to match Pluto's exact aesthetic.
        Padding is removed from the root so children can implement flush borders/headers.
      */}
      <SheetContent className="w-full sm:max-w-md bg-[#09090b] border-zinc-800 p-0 flex flex-col">
        <SheetHeader className="sr-only">
          <SheetTitle>{title || "Side Panel"}</SheetTitle>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}

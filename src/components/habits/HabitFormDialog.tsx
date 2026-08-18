"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useHabitStore, Habit, HabitColor, CycleLength } from "@/store/useHabitStore";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Palette } from "lucide-react";

interface HabitFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  habitToEdit?: Habit | null;
}

const colorOptions: { name: HabitColor; class: string }[] = [
  { name: "default", class: "bg-zinc-700" },
  { name: "red", class: "bg-red-500" },
  { name: "orange", class: "bg-orange-500" },
  { name: "yellow", class: "bg-yellow-500" },
  { name: "green", class: "bg-green-500" },
  { name: "blue", class: "bg-blue-500" },
  { name: "purple", class: "bg-purple-500" },
];

const cycleOptions = [
  { label: "7 days", value: 7 },
  { label: "21 days", value: 21 },
  { label: "30 days", value: 30 },
  { label: "100 days", value: 100 },
  { label: "Forever", value: "forever" },
  { label: "Custom", value: "custom" },
];

export function HabitFormDialog({ isOpen, onClose, habitToEdit }: HabitFormDialogProps) {
  const { addHabit, updateHabit, updateCurrentCycleLength } = useHabitStore();

  const [title, setTitle] = useState("");
  const [color, setColor] = useState<HabitColor>("purple");
  const [cycleType, setCycleType] = useState<number | "forever" | "custom">(21);
  const [customCycle, setCustomCycle] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (habitToEdit) {
          setTitle(habitToEdit.title);
          setColor(habitToEdit.color);
          const currentLen = habitToEdit.cycles[habitToEdit.cycles.length - 1].length;
          if ([7, 21, 30, 100, "forever"].includes(currentLen as number | "forever")) {
            setCycleType(currentLen as number | "forever");
            setCustomCycle("");
          } else {
            setCycleType("custom");
            setCustomCycle(currentLen.toString());
          }
        } else {
          setTitle("");
          setColor("purple");
          setCycleType(21);
          setCustomCycle("");
        }
      }, 0);
    }
  }, [isOpen, habitToEdit]);

  const handleSave = () => {
    if (!title.trim()) return;

    let finalLength: CycleLength = 21;
    if (cycleType === "custom") {
      const parsed = parseInt(customCycle);
      if (isNaN(parsed) || parsed <= 0) return; // Basic validation
      finalLength = parsed;
    } else {
      finalLength = cycleType as CycleLength;
    }

    if (habitToEdit) {
      updateHabit(habitToEdit.id, { title: title.trim(), color });
      const currentLen = habitToEdit.cycles[habitToEdit.cycles.length - 1].length;
      if (currentLen !== finalLength) {
        updateCurrentCycleLength(habitToEdit.id, finalLength);
      }
    } else {
      addHabit(title.trim(), finalLength, color);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:rounded-2xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{habitToEdit ? "Edit Habit" : "New Habit"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-400">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Read for 30 mins"
              className="bg-zinc-900 border-zinc-800 h-12 focus-visible:ring-purple-600/50"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-400">Goal / Cycle Length</label>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex-1 flex items-center justify-between px-3 h-12 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800/80 outline-none transition-colors text-sm">
                  {cycleType === "custom" 
                    ? "Custom" 
                    : cycleOptions.find((o) => o.value === cycleType)?.label}
                  <ChevronDown className="h-4 w-4 text-zinc-500" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-zinc-900 border-zinc-800 rounded-xl w-full">
                  {cycleOptions.map((opt) => (
                    <DropdownMenuItem
                      key={opt.label}
                      onClick={() => setCycleType(opt.value as number | "forever" | "custom")}
                      className="cursor-pointer focus:bg-zinc-800 text-zinc-200"
                    >
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {cycleType === "custom" && (
                <Input
                  type="number"
                  min="1"
                  value={customCycle}
                  onChange={(e) => setCustomCycle(e.target.value)}
                  placeholder="Days"
                  className="w-24 bg-zinc-900 border-zinc-800 h-12 text-center focus-visible:ring-purple-600/50"
                />
              )}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Habits are tracked in cycles. Once you hit your goal, you can restart it.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
              <Palette className="h-4 w-4" /> Color
            </label>
            <div className="flex items-center gap-3">
              {colorOptions.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${c.class} ${
                    color === c.name ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110" : ""
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={onClose} className="rounded-xl text-zinc-400 hover:text-white">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()} className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white">
            {habitToEdit ? "Save Changes" : "Create Habit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

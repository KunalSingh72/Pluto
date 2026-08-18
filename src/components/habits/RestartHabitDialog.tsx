import { useState, useEffect } from "react";
import { Play, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useHabitStore, Habit } from "@/store/useHabitStore";
import { getLocalDateString } from "@/lib/utils";

interface RestartHabitDialogProps {
  habit: Habit | null;
  onClose: () => void;
}

const cycleOptions = [
  { label: "7 days", value: 7 },
  { label: "21 days", value: 21 },
  { label: "30 days", value: 30 },
  { label: "100 days", value: 100 },
  { label: "Forever", value: "forever" },
  { label: "Custom", value: "custom" },
];

export function RestartHabitDialog({ habit, onClose }: RestartHabitDialogProps) {
  const { restartHabit } = useHabitStore();
  const [cycleType, setCycleType] = useState<number | "forever" | "custom">(21);
  const [customCycle, setCustomCycle] = useState<string>("");

  useEffect(() => {
    if (habit) {
      setTimeout(() => {
        const lastCycleLen = habit.cycles[habit.cycles.length - 1].length;
        if ([7, 21, 30, 100, "forever"].includes(lastCycleLen as number | "forever")) {
          setCycleType(lastCycleLen as number | "forever");
          setCustomCycle("");
        } else {
          setCycleType("custom");
          setCustomCycle(lastCycleLen.toString());
        }
      }, 0);
    }
  }, [habit]);

  const handleRestart = () => {
    if (!habit) return;
    
    const finalLength: number | "forever" = cycleType === "custom" ? parseInt(customCycle) || 21 : (cycleType as number | "forever");
    
    const today = getLocalDateString();
    
    // Check if habit finished today
    // A habit finishes today if its history for today is habit_completed or stopped_early or cycle_completed
    const todayStatus = habit.history[today];
    let restartDate = today;
    
    if (todayStatus === "habit_completed" || todayStatus === "stopped_early" || todayStatus === "cycle_completed") {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      restartDate = getLocalDateString(tomorrow);
    }
    
    restartHabit(habit.id, finalLength, restartDate);
    onClose();
  };

  return (
    <Dialog open={!!habit} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#121215] border-zinc-800 text-zinc-100 max-w-sm rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Play className="w-5 h-5 text-zinc-400" />
            Restart Habit
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-zinc-400">
            You are about to restart &quot;{habit?.title}&quot;. 
          </p>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-400">Next Cycle Length</label>
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
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 h-12 w-24">
                  <input 
                    type="number"
                    min="1"
                    max="999"
                    value={customCycle}
                    onChange={(e) => setCustomCycle(e.target.value)}
                    className="bg-transparent w-full outline-none text-sm font-medium"
                    placeholder="Days"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <Button variant="ghost" onClick={onClose} className="hover:bg-zinc-800 hover:text-zinc-100 rounded-xl">
            Cancel
          </Button>
          <Button onClick={handleRestart} className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-xl">
            Confirm Restart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

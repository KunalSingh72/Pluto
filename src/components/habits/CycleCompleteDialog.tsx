import { Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useHabitStore, Habit } from "@/store/useHabitStore";
import { getLocalDateString } from "@/lib/utils";

interface CycleCompleteDialogProps {
  habit: Habit | null;
  onClose: () => void;
}

export function CycleCompleteDialog({ habit, onClose }: CycleCompleteDialogProps) {
  const { completeCycleAndContinue, completeCycleAndStop } = useHabitStore();
  const today = getLocalDateString();

  return (
    <Dialog open={!!habit} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#121215] border-zinc-800 text-zinc-100 max-w-sm rounded-2xl p-6 sm:p-8">
        <DialogHeader className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center animate-bounce">
            <Trophy className="w-8 h-8 text-purple-400" />
          </div>
          <DialogTitle className="text-2xl font-bold text-zinc-100">Cycle Completed!</DialogTitle>
          <DialogDescription className="text-zinc-400">
            You&apos;ve hit your target for this cycle in &quot;{habit?.title}&quot;. What would you like to do next?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-6">
          <Button 
            onClick={() => {
              if (habit) completeCycleAndContinue(habit.id, today);
              onClose();
            }}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12"
          >
            Start Next Cycle
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              if (habit) completeCycleAndStop(habit.id, today);
              onClose();
            }}
            className="w-full border-zinc-700 hover:bg-zinc-800 text-zinc-300 rounded-xl h-12"
          >
            Stop Habit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

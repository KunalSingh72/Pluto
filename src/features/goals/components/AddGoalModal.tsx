import { useState } from "react";
import { X } from "lucide-react";
import { format } from "date-fns";
import { useGoalsStore } from "../store/goals.store";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select"; 
import type { GoalCategory } from "@/types";    

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddGoalModal({ isOpen, onClose }: AddGoalModalProps) {
  const addGoal = useGoalsStore((state) => state.addGoal);

  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState<number | "">("");
  const [unit, setUnit] = useState("");
  const [deadline, setDeadline] = useState(format(new Date(), "yyyy-MM-dd"));
  const [category, setCategory] = useState<GoalCategory>("personal");

  if (!isOpen) return null;
  const categoryOptions = [
    { value: "career", label: "Career" },
    { value: "learning", label: "Learning" },
    { value: "health", label: "Health" },
    { value: "finance", label: "Finance" },
    { value: "personal", label: "Personal" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetValue || !unit.trim()) return;

    addGoal({
      id: crypto.randomUUID(),
      title: title.trim(),
      targetValue: Number(targetValue),
      currentValue: 0,
      unit: unit.trim(),
      deadline,
      milestones: [],
      status: "not_started",
      category,
      priority: "medium", // NEW: Default Priority
      progressHistory: [],
      createdAt: new Date().toISOString(),
    });

    // Reset and close
    setTitle("");
    setTargetValue("");
    setUnit("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-background-surface border border-border-subtle rounded-3xl shadow-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary">New Goal</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-text-secondary hover:bg-background-main rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-secondary ml-1 mb-1 block">
              Goal Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Read 20 Books"
              className="w-full bg-background-main border border-border-subtle rounded-xl py-3 px-4 text-text-primary font-medium focus:ring-2 focus:ring-accent-primary/50 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-secondary ml-1 mb-1 block">
                Target Number
              </label>
              <input
                type="number"
                min="1"
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                placeholder="e.g., 20"
                className="w-full bg-background-main border border-border-subtle rounded-xl py-3 px-4 text-text-primary font-medium outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary ml-1 mb-1 block">
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g., Books, USD, kg"
                className="w-full bg-background-main border border-border-subtle rounded-xl py-3 px-4 text-text-primary font-medium outline-none"
              />
            </div>
          </div>
          <div className="space-y-1.5 z-30">
            <label className="text-xs font-medium text-text-secondary ml-1 block">
              Category
            </label>
            <Select
              value={category}
              onChange={(val) => setCategory(val as GoalCategory)}
              options={categoryOptions}
            />
          </div>

          <div className="space-y-1.5 z-20">
            <label className="text-xs font-medium text-text-secondary ml-1 block">
              Target Deadline
            </label>
            <DatePicker
              value={deadline}
              onChange={(d) =>
                setDeadline(d || format(new Date(), "yyyy-MM-dd"))
              }
              className="w-full"
            />
          </div>

          <button
            type="submit"
            disabled={!title.trim() || !targetValue || !unit.trim()}
            className="w-full py-3.5 mt-4 bg-accent-primary text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-opacity"
          >
            Create Goal
          </button>
        </form>
      </div>
    </div>
  );
}

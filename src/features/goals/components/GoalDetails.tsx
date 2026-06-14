import { useState } from "react";
import {
  X,
  Target,
  Trash2,
  ChevronLeft,
  CheckCircle2,
  Circle,
  Plus,
  Flag
} from "lucide-react";
import { format } from "date-fns";
import { useGoalsStore } from "../store/goals.store";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DatePicker } from "@/components/ui/DatePicker";
import { cn } from "@/lib/utils";
import type { GoalMilestone, GoalCategory, GoalPriority } from "@/types";
import { Select } from "@/components/ui/Select";

interface GoalDetailsProps {
  goalId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GoalDetails({ goalId, isOpen, onClose }: GoalDetailsProps) {
  const goals = useGoalsStore((state) => state.goals);
  const updateGoal = useGoalsStore((state) => state.updateGoal);
  const updateProgress = useGoalsStore((state) => state.updateProgress);
  const deleteGoal = useGoalsStore((state) => state.deleteGoal);
  const toggleMilestone = useGoalsStore((state) => state.toggleMilestone);

  const goal = goals.find((g) => g.id === goalId) || null;

  const [prevGoalId, setPrevGoalId] = useState<string | null>(null);
  const [progressInput, setProgressInput] = useState<number | "">("");
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Render-Phase State Reset
  if (goalId !== prevGoalId) {
    setPrevGoalId(goalId);
    setProgressInput(goal ? goal.currentValue : "");
    setNewMilestoneTitle("");
  }

  if (!isOpen || !goal) return null;

  const handleUpdateProgress = () => {
    if (progressInput !== "" && progressInput >= 0) {
      updateProgress(goal.id, Number(progressInput));
    }
  };

  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim()) return;
    const newMilestone: GoalMilestone = {
      id: crypto.randomUUID(),
      title: newMilestoneTitle.trim(),
      completed: false,
    };
    updateGoal(goal.id, { milestones: [...goal.milestones, newMilestone] });
    setNewMilestoneTitle("");
  };

  const removeMilestone = (milestoneId: string) => {
    updateGoal(goal.id, {
      milestones: goal.milestones.filter((m) => m.id !== milestoneId),
    });
  };

  const handleDelete = () => {
    deleteGoal(goal.id);
    setIsDeleteModalOpen(false);
    onClose();
  };

  return (
    <>
      <aside
        className={cn(
          "fixed inset-0 z-50 w-full bg-background-surface transform transition-all duration-300 ease-in-out flex flex-col rounded-2xl md:static md:z-auto md:h-full md:border-l border-border-subtle md:shadow-none md:transform-none",
          isOpen
            ? "translate-x-0 md:w-110 md:min-w-110 md:opacity-100"
            : "translate-x-full md:w-0 md:min-w-0 md:opacity-0 md:border-none md:overflow-hidden",
        )}
      >
        <div className="w-full md:w-110 h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-border-subtle shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-md transition-colors cursor-pointer md:hidden shrink-0"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="font-semibold text-text-secondary text-sm">
                Goal Details
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-text-secondary hover:text-text-primary rounded-md transition-colors cursor-pointer hidden md:block"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
            {/* Title Editor */}
            <textarea
              value={goal.title}
              onChange={(e) => {
                updateGoal(goal.id, { title: e.target.value });
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder="Goal title"
              rows={1}
              className="w-full bg-transparent text-2xl font-bold text-text-primary outline-none resize-none overflow-hidden"
            />

            {/* Target & Progress Visualization */}
            <div className="bg-background-main border border-border-subtle rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <Target className="w-8 h-8 text-blue-500 mb-2" />
              <span className="text-3xl font-extrabold text-text-primary mb-1">
                {goal.currentValue}{" "}
                <span className="text-lg text-text-secondary">
                  / {goal.targetValue}
                </span>
              </span>
              <span className="text-sm text-text-secondary font-medium uppercase tracking-wider">
                {goal.unit}
              </span>
            </div>

            {/* Config & Logging */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary ml-1">
                  Log Progress
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={progressInput}
                    onChange={(e) => setProgressInput(Number(e.target.value))}
                    className="flex-1 bg-background-main border border-border-subtle rounded-xl py-2 px-4 text-text-primary font-bold outline-none"
                  />
                  <button
                    onClick={handleUpdateProgress}
                    className="px-6 py-2 bg-accent-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Update
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1.5">
                  <span className="text-xs font-medium text-text-secondary ml-1">
                    Target Value
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={goal.targetValue}
                    onChange={(e) =>
                      updateGoal(goal.id, {
                        targetValue: Number(e.target.value),
                      })
                    }
                    className="w-full bg-background-main border border-border-subtle rounded-xl py-2 px-4 text-sm text-text-primary font-bold outline-none"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <span className="text-xs font-medium text-text-secondary ml-1">
                    Deadline
                  </span>
                  <DatePicker
                    value={goal.deadline}
                    onChange={(date) =>
                      updateGoal(goal.id, {
                        deadline: date || format(new Date(), "yyyy-MM-dd"),
                      })
                    }
                    align="right"
                  />
                </div>
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-medium text-text-secondary ml-1">
                    Category
                  </span>
                  <Select
                    value={goal.category || "personal"}
                    onChange={(val) =>
                      updateGoal(goal.id, { category: val as GoalCategory })
                    }
                    options={[
                      { value: "career", label: "Career" },
                      { value: "learning", label: "Learning" },
                      { value: "health", label: "Health" },
                      { value: "finance", label: "Finance" },
                      { value: "personal", label: "Personal" },
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-medium text-text-secondary ml-1">
                  Priority
                </span>
                <Select
                  value={goal.priority || "medium"}
                  onChange={(val) =>
                    updateGoal(goal.id, { priority: val as GoalPriority })
                  }
                  options={[
                    {
                      value: "high",
                      label: "High",
                      icon: (
                        <Flag
                          className="w-4 h-4 text-red-500/70"
                          fill="currentColor"
                        />
                      ),
                    },
                    {
                      value: "medium",
                      label: "Medium",
                      icon: (
                        <Flag
                          className="w-4 h-4 text-yellow-500/70"
                          fill="currentColor"
                        />
                      ),
                    },
                    {
                      value: "low",
                      label: "Low",
                      icon: (
                        <Flag
                          className="w-4 h-4 text-green-500/70"
                          fill="currentColor"
                        />
                      ),
                    },
                  ]}
                  align="right"
                />
              </div>
            </div>

            <hr className="border-border-subtle" />

            {/* Milestones (Subtasks) */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-text-primary">
                Milestones
              </h4>
              <div className="space-y-2">
                {goal.milestones.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => toggleMilestone(goal.id, m.id)}
                      className="p-1 -ml-1 cursor-pointer"
                    >
                      {m.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-accent-primary" />
                      ) : (
                        <Circle className="w-5 h-5 text-text-secondary" />
                      )}
                    </button>
                    <input
                      type="text"
                      value={m.title}
                      onChange={(e) => {
                        const updated = goal.milestones.map((st) =>
                          st.id === m.id
                            ? { ...st, title: e.target.value }
                            : st,
                        );
                        updateGoal(goal.id, { milestones: updated });
                      }}
                      className={cn(
                        "flex-1 bg-transparent text-sm outline-none border-none py-1",
                        m.completed
                          ? "text-text-secondary line-through"
                          : "text-text-primary",
                      )}
                    />
                    <button
                      onClick={() => removeMilestone(m.id)}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-text-secondary hover:text-red-500 transition-opacity p-2 md:p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-2 opacity-60 focus-within:opacity-100 transition-opacity">
                  <Plus className="w-5 h-5 md:w-4 md:h-4 text-text-secondary ml-1 mr-1" />
                  <input
                    type="text"
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddMilestone();
                    }}
                    onBlur={handleAddMilestone}
                    placeholder="Add a milestone..."
                    className="flex-1 bg-transparent text-sm outline-none border-none py-1 text-text-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border-subtle bg-background-main/50 shrink-0">
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Delete Goal
            </button>
          </div>
        </div>
      </aside>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Goal"
        message={`Are you sure you want to permanently delete "${goal.title}"?`}
        confirmText="Delete"
        isDanger={true}
      />
    </>
  );
}

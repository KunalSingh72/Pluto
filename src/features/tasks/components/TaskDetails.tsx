import { useState } from "react";
import {
  X,
  Flag,
  Trash2,
  Copy,
  Plus,
  CheckCircle2,
  Circle,
  ChevronLeft,
  Repeat,
  Folder,
  Target
} from "lucide-react";
import type { Task, Priority, Subtask, Recurrence } from "@/types"; // <-- Updated Import
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { useTasksStore } from "../store/tasks.store";
import { useGoalsStore } from "@/features/goals/store/goals.store";
interface TaskDetailsProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (task: Task) => void;
}

export function TaskDetails({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
}: TaskDetailsProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const [prevTask, setPrevTask] = useState<Task | null>(task);
  const [displayTask, setDisplayTask] = useState<Task | null>(task);

  const categories = useTasksStore((state) => state.categories);

  const categoryOptions = [
    {
      value: "none",
      label: "No Category",
      icon: <Folder className="w-4 h-4 text-text-secondary" />,
    },
    ...categories.map((c) => ({
      value: c.id,
      label: c.name,
      icon: <div className={`w-3 h-3 rounded-full ${c.color}`} />,
    })),
  ];
  const goals = useGoalsStore((state) => state.goals);

  const goalOptions = [
    {
      value: "none",
      label: "No Goal",
      icon: <Target className="w-4 h-4 text-text-secondary" />,
    },
    ...goals.map((g) => ({
      value: g.id,
      label: g.title,
      icon: <Target className="w-4 h-4 text-blue-500" />,
    })),
  ];
  const recurrenceOptions = [
    {
      value: "none",
      label: "Does not repeat",
      icon: <Repeat className="w-4 h-4" />,
    },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
  ];

  if (task !== prevTask) {
    setPrevTask(task);

    setNewSubtaskTitle("");

    if (task !== null) {
      setDisplayTask(task);
    }
  }

  const currentTask = task || displayTask;

  if (!currentTask) return null;

  // Improved Subtask Addition Logic
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: Subtask = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle.trim(),
      completed: false,
    };

    onUpdate({
      ...currentTask,
      subtasks: [...currentTask.subtasks, newSubtask],
    });
    setNewSubtaskTitle(""); // Reset the input field for the next one
  };

  const handleNewSubtaskKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  const updateSubtask = (subtaskId: string, updates: Partial<Subtask>) => {
    const updatedSubtasks = currentTask.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, ...updates } : st,
    );
    onUpdate({ ...currentTask, subtasks: updatedSubtasks });
  };

  const removeSubtask = (subtaskId: string) => {
    onUpdate({
      ...currentTask,
      subtasks: currentTask.subtasks.filter((st) => st.id !== subtaskId),
    });
  };

  const handleEnterToBlur = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <>
      <aside
        className={`
          fixed inset-0 z-50 w-full bg-background-surface transform transition-all duration-300 ease-in-out flex flex-col rounded-2xl
          md:static md:z-auto md:h-full md:border-l border-border-subtle md:shadow-none md:transform-none
          ${
            isOpen
              ? "translate-x-0 md:w-100 md:min-w-100 md:opacity-100"
              : "translate-x-full md:w-0 md:min-w-0 md:opacity-0 md:border-none md:overflow-hidden"
          }
        `}
      >
        <div className="w-full md:w-100 h-full flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border-subtle shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-md transition-colors cursor-pointer md:hidden"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="font-semibold text-text-secondary text-sm">
                Task Details
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-text-secondary hover:text-text-primary rounded-md transition-colors cursor-pointer hidden md:block"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="flex items-start gap-3">
              <button
                onClick={() =>
                  onUpdate({
                    ...currentTask,
                    completed: !currentTask.completed,
                  })
                }
                className="mt-1 p-1 -ml-1 shrink-0 cursor-pointer"
              >
                {currentTask.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-accent-primary" />
                ) : (
                  <Circle className="w-6 h-6 text-text-secondary hover:text-accent-primary transition-colors" />
                )}
              </button>
              <textarea
                value={currentTask.title}
                onChange={(e) => {
                  onUpdate({ ...currentTask, title: e.target.value });
                  // Automatically adjust height based on text wrapping
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  // Maintain the "Enter to save/blur" functionality
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                placeholder="Task title"
                rows={1}
                className="w-full bg-transparent text-2xl font-bold text-text-primary outline-none focus:outline-none border-none rounded-md px-1 -ml-1 transition-all resize-none overflow-hidden field-sizing:content"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-24 text-sm text-text-secondary">
                  Due Date
                </span>
                <div className="flex-1">
                  <DatePicker
                    value={currentTask.dueDate}
                    onChange={(date) =>
                      onUpdate({ ...currentTask, dueDate: date })
                    }
                    align="right"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <span className="w-24 text-sm text-text-secondary">
                  Recurrence
                </span>
                <div className="flex-1">
                  <Select
                    value={currentTask.recurrence || "none"}
                    // Fix: Replaced 'any' with the proper 'Recurrence' type
                    onChange={(val) =>
                      onUpdate({
                        ...currentTask,
                        recurrence: val as Recurrence,
                      })
                    }
                    options={recurrenceOptions}
                    align="right"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <span className="w-24 text-sm text-text-secondary">
                  Category
                </span>
                <div className="flex-1">
                  <Select
                    value={currentTask.categoryId || "none"}
                    onChange={(val) =>
                      onUpdate({ ...currentTask, categoryId: val })
                    }
                    options={categoryOptions}
                    align="right"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <span className="w-24 text-sm text-text-secondary">
                  Priority
                </span>
                <div className="flex-1">
                  <Select
                    value={currentTask.priority || "none"}
                    onChange={(val) =>
                      onUpdate({ ...currentTask, priority: val as Priority })
                    }
                    options={[
                      {
                        value: "none",
                        label: "No Priority",
                        icon: <Flag className="w-4 h-4 text-text-secondary" />,
                      },
                      {
                        value: "low",
                        label: "Low",
                        icon: (
                          <Flag
                            className="w-4 h-4 text-green-500"
                            fill="currentColor"
                          />
                        ),
                      },
                      {
                        value: "medium",
                        label: "Medium",
                        icon: (
                          <Flag
                            className="w-4 h-4 text-yellow-500"
                            fill="currentColor"
                          />
                        ),
                      },
                      {
                        value: "high",
                        label: "High",
                        icon: (
                          <Flag
                            className="w-4 h-4 text-red-500"
                            fill="currentColor"
                          />
                        ),
                      },
                    ]}
                    align="right"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <span className="w-24 text-sm text-text-secondary">Goal</span>
              <div className="flex-1">
                <Select
                  value={currentTask.goalId || "none"}
                  onChange={(val) => onUpdate({ ...currentTask, goalId: val })}
                  options={goalOptions}
                  align="right"
                />
              </div>
            </div>

            {/* Only displays if a Goal is actually selected */}
            {currentTask.goalId && currentTask.goalId !== "none" && (
              <div className="flex items-center animate-in fade-in slide-in-from-top-1">
                <span className="w-24 text-sm text-text-secondary">
                  Contribution
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={currentTask.goalContribution ?? 1}
                    onChange={(e) =>
                      onUpdate({
                        ...currentTask,
                        goalContribution: Number(e.target.value),
                      })
                    }
                    className="w-20 bg-background-main border border-border-subtle rounded-lg px-3 py-1.5 text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all"
                  />
                  <span className="text-xs font-medium text-text-secondary">
                    added to progress
                  </span>
                </div>
              </div>
            )}

            <hr className="border-border-subtle" />

            {/* Subtasks Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-text-primary">
                Subtasks
              </h4>
              <div className="space-y-2">
                {/* Existing Subtasks */}
                {currentTask.subtasks.map((st) => (
                  <div key={st.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() =>
                        updateSubtask(st.id, { completed: !st.completed })
                      }
                      className="p-1 -ml-1 cursor-pointer"
                    >
                      {st.completed ? (
                        <CheckCircle2 className="w-5 h-5 md:w-4 md:h-4 text-accent-primary" />
                      ) : (
                        <Circle className="w-5 h-5 md:w-4 md:h-4 text-text-secondary" />
                      )}
                    </button>
                    <input
                      type="text"
                      value={st.title}
                      onChange={(e) =>
                        updateSubtask(st.id, { title: e.target.value })
                      }
                      onKeyDown={handleEnterToBlur}
                      className={`flex-1 bg-transparent text-sm outline-none focus:outline-none border-none py-2 md:py-1 ${st.completed ? "text-text-secondary line-through" : "text-text-primary"}`}
                    />
                    <button
                      onClick={() => removeSubtask(st.id)}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-text-secondary hover:text-red-500 transition-opacity p-2 md:p-1 cursor-pointer"
                    >
                      <X className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                  </div>
                ))}

                {/* Always-Visible Empty Input Row for New Subtasks */}
                <div className="flex items-center gap-2 opacity-60 focus-within:opacity-100 transition-opacity">
                  <Plus className="w-5 h-5 md:w-4 md:h-4 text-text-secondary ml-1 mr-1" />
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={handleNewSubtaskKeyDown}
                    onBlur={handleAddSubtask}
                    placeholder="Add a subtask..."
                    className="flex-1 bg-transparent text-sm outline-none focus:outline-none border-none py-2 md:py-1 text-text-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border-subtle flex items-center justify-between bg-background-main/50 shrink-0 mb-safe">
            <button
              onClick={() => onDuplicate(currentTask)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary hover:bg-background-surface hover:text-text-primary rounded-md transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </aside>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          onDelete(currentTask.id);
          onClose();
        }}
        title="Delete Task"
        message={`Are you sure you want to delete "${currentTask.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
        isDanger={true}
      />
    </>
  );
}

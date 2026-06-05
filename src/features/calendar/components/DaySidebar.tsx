import { useState } from "react";
import {
  X,
  Plus,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Flag,
  Trash2,
  Copy,
  ChevronLeft,
  Repeat,
  Folder,
} from "lucide-react";
import { format } from "date-fns";
import { useTasksStore } from "@/features/tasks/store/tasks.store";
import {
  isTaskOnDate,
  isTaskCompletedOnDate,
} from "@/features/tasks/utils/task.utils";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { Task, Priority, Subtask, Recurrence } from "@/types";
import { cn } from "@/lib/utils";

interface DaySidebarProps {
  date: Date | null;
  isOpen: boolean;
  onClose: () => void;
  initialExpandedTaskId?: string | null;
}

export function DaySidebar({
  date,
  isOpen,
  onClose,
  initialExpandedTaskId,
}: DaySidebarProps) {
  // Added bulkUpdateTasks from the store
  const {
    tasks,
    categories,
    addTask,
    updateTask,
    deleteTask,
    bulkUpdateTasks,
  } = useTasksStore();

  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);

  // Track previous props to update state directly during render (Fast Refresh safe)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevInitialId, setPrevInitialId] = useState(initialExpandedTaskId);

  if (isOpen !== prevIsOpen || initialExpandedTaskId !== prevInitialId) {
    setPrevIsOpen(isOpen);
    setPrevInitialId(initialExpandedTaskId);
    if (isOpen) {
      setExpandedTaskId(initialExpandedTaskId || null);
      setNewSubtaskTitle("");
    }
  }

  if (!date) return null;

  const dayTasks = tasks.filter(
    (t) => t.type === "event" && isTaskOnDate(t, date),
  );

  const handleAddEvent = () => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: "",
      completed: false,
      priority: "none",
      subtasks: [],
      createdAt: new Date().toISOString(),
      dueDate: format(date, "yyyy-MM-dd"),
      categoryId: "none",
      recurrence: "none",
      type: "event", // 3. FIXED: Tag as event
    };
    addTask(newTask);
    setExpandedTaskId(newTask.id);
  };

  const handleDeleteAll = () => {
    const ids = dayTasks.map((t) => t.id);
    // Soft delete all tasks currently displayed for this date
    bulkUpdateTasks(ids, { deletedAt: new Date().toISOString() });
    setExpandedTaskId(null);
    setIsDeleteAllModalOpen(false);
  };

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

  const handleAddSubtask = (taskId: string, currentSubtasks: Subtask[]) => {
    if (!newSubtaskTitle.trim()) return;
    const newSubtask: Subtask = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    updateTask(taskId, { subtasks: [...currentSubtasks, newSubtask] });
    setNewSubtaskTitle("");
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
          <div className="flex items-center justify-between p-4 border-b border-border-subtle shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-md transition-colors cursor-pointer md:hidden"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="font-semibold text-text-primary text-base">
                {format(date, "EEEE, MMMM d")}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-text-secondary hover:text-text-primary rounded-md transition-colors cursor-pointer hidden md:block"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {/* Top Actions Row */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddEvent}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border-subtle text-text-secondary hover:text-accent-primary hover:border-accent-primary/50 hover:bg-accent-subtle/30 transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium text-sm">Add New Event</span>
              </button>

              {/* Only show Delete All if there are events to delete */}
              {dayTasks.length > 0 && (
                <button
                  onClick={() => setIsDeleteAllModalOpen(true)}
                  className="flex items-center justify-center p-3 rounded-xl border border-border-subtle text-text-secondary hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-all cursor-pointer"
                  title="Clear all events for this day"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {dayTasks.length === 0 ? (
                <div className="text-center text-text-secondary py-10 text-sm">
                  No events scheduled for this day.
                </div>
              ) : (
                dayTasks.map((task) => {
                  const isExpanded = expandedTaskId === task.id;
                  const catColor =
                    categories.find((c) => c.id === task.categoryId)?.color ||
                    "bg-accent-primary";

                  // Evaluate localized completion
                  const isCompleted = isTaskCompletedOnDate(task, date);

                  return (
                    <div
                      key={task.id}
                      className="border border-border-subtle rounded-xl overflow-hidden bg-background-surface transition-all"
                    >
                      {/* Accordion Header */}
                      <div
                        onClick={() => {
                          setExpandedTaskId(isExpanded ? null : task.id);
                          setNewSubtaskTitle("");
                        }}
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-background-main/50 transition-colors"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            useTasksStore
                              .getState()
                              .toggleTaskCompletionOnDate(task.id, date);
                          }}
                          className="shrink-0 p-1 -ml-1 cursor-pointer"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-accent-primary" />
                          ) : (
                            <Circle className="w-5 h-5 text-text-secondary" />
                          )}
                        </button>

                        <div className="flex-1 flex flex-col min-w-0">
                          <span
                            className={cn(
                              "font-medium text-sm truncate",
                              isCompleted
                                ? "text-text-secondary line-through"
                                : "text-text-primary",
                            )}
                          >
                            {task.title || "Untitled Event"}
                          </span>
                        </div>

                        {task.categoryId && task.categoryId !== "none" && (
                          <div
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${catColor}`}
                          />
                        )}

                        <div className="text-text-secondary shrink-0 ml-1">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      </div>

                      {/* Accordion Body (The Editor) */}
                      {isExpanded && (
                        <div className="p-4 border-t border-border-subtle bg-background-main/30 space-y-5 animate-in fade-in duration-200">
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) =>
                              updateTask(task.id, { title: e.target.value })
                            }
                            placeholder="Event title"
                            className="w-full bg-transparent text-lg font-bold text-text-primary outline-none focus:outline-none border-none px-1 -ml-1 transition-all"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") e.currentTarget.blur();
                            }}
                          />

                          <div className="space-y-3">
                            <div className="flex items-center">
                              <span className="w-24 text-sm text-text-secondary">
                                Due Date
                              </span>
                              <div className="flex-1">
                                <DatePicker
                                  value={task.dueDate}
                                  onChange={(date) =>
                                    updateTask(task.id, { dueDate: date })
                                  }
                                  align="right"
                                />
                              </div>
                            </div>
                            <div className="flex items-center">
                              <span className="w-24 text-sm text-text-secondary">
                                Repeat
                              </span>
                              <div className="flex-1">
                                <Select
                                  value={task.recurrence || "none"}
                                  onChange={(val) =>
                                    updateTask(task.id, {
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
                                  value={task.categoryId || "none"}
                                  onChange={(val) =>
                                    updateTask(task.id, { categoryId: val })
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
                                  value={task.priority || "none"}
                                  onChange={(val) =>
                                    updateTask(task.id, {
                                      priority: val as Priority,
                                    })
                                  }
                                  options={[
                                    {
                                      value: "none",
                                      label: "No Priority",
                                      icon: (
                                        <Flag className="w-4 h-4 text-text-secondary" />
                                      ),
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

                          <hr className="border-border-subtle" />

                          {/* Subtasks inside Accordion */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-text-primary">
                              Subtasks
                            </h4>
                            <div className="space-y-2">
                              {task.subtasks.map((st) => (
                                <div
                                  key={st.id}
                                  className="flex items-center gap-2 group"
                                >
                                  <button
                                    onClick={() => {
                                      const updated = task.subtasks.map((s) =>
                                        s.id === st.id
                                          ? { ...s, completed: !s.completed }
                                          : s,
                                      );
                                      updateTask(task.id, {
                                        subtasks: updated,
                                      });
                                    }}
                                    className="p-1 -ml-1 cursor-pointer"
                                  >
                                    {st.completed ? (
                                      <CheckCircle2 className="w-4 h-4 text-accent-primary" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-text-secondary" />
                                    )}
                                  </button>
                                  <input
                                    type="text"
                                    value={st.title}
                                    onChange={(e) => {
                                      const updated = task.subtasks.map((s) =>
                                        s.id === st.id
                                          ? { ...s, title: e.target.value }
                                          : s,
                                      );
                                      updateTask(task.id, {
                                        subtasks: updated,
                                      });
                                    }}
                                    className={`flex-1 bg-transparent text-sm outline-none border-none py-1 ${st.completed ? "text-text-secondary line-through" : "text-text-primary"}`}
                                  />
                                  <button
                                    onClick={() => {
                                      updateTask(task.id, {
                                        subtasks: task.subtasks.filter(
                                          (s) => s.id !== st.id,
                                        ),
                                      });
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-red-500 transition-opacity p-1 cursor-pointer"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}

                              {/* Add Subtask Row */}
                              <div className="flex items-center gap-2 opacity-60 focus-within:opacity-100 transition-opacity">
                                <Plus className="w-4 h-4 text-text-secondary ml-1 mr-1" />
                                <input
                                  type="text"
                                  value={newSubtaskTitle}
                                  onChange={(e) =>
                                    setNewSubtaskTitle(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleAddSubtask(task.id, task.subtasks);
                                  }}
                                  onBlur={() =>
                                    handleAddSubtask(task.id, task.subtasks)
                                  }
                                  placeholder="Add a subtask..."
                                  className="flex-1 bg-transparent text-sm outline-none border-none py-1 text-text-primary"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="flex items-center justify-between pt-2">
                            <button
                              onClick={() => {
                                const duplicate: Task = {
                                  ...task,
                                  id: crypto.randomUUID(),
                                  title: `${task.title} (Copy)`,
                                  createdAt: new Date().toISOString(),
                                  dueDate:
                                    task.dueDate || format(date, "yyyy-MM-dd"),
                                  categoryId: task.categoryId || "none",
                                  recurrence: task.recurrence || "none",
                                  type: task.type || "event", // 4. FIXED: Retain event tag on copy
                                };
                                addTask(duplicate);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-background-surface hover:text-text-primary rounded-md transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" /> Duplicate
                            </button>
                            <button
                              onClick={() => setTaskToDelete(task.id)}
                              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </aside>

      <ConfirmModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={() => {
          if (taskToDelete) {
            deleteTask(taskToDelete);
            if (expandedTaskId === taskToDelete) setExpandedTaskId(null);
          }
        }}
        title="Delete Event"
        message="Are you sure you want to permanently delete this event?"
        confirmText="Delete"
        isDanger={true}
      />

      <ConfirmModal
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirm={handleDeleteAll}
        title="Clear All Events"
        message="Are you sure you want to move all events scheduled for this date to the trash? Note: If any events are recurring, this will delete the entire series."
        confirmText="Move to Trash"
        isDanger={true}
      />
    </>
  );
}

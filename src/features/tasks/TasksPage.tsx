import { useState, useRef, useEffect } from "react";
import { Menu, ChevronDown, ChevronRight } from "lucide-react";
import {
  startOfDay,
  isBefore,
  parseISO,
  isToday,
  isYesterday,
  isTomorrow,
  format,
  compareDesc,
  compareAsc,
  addDays,
} from "date-fns";
import {
  CalendarDays,
  CalendarRange,
  AlertCircle,
  CheckSquare,
  Trash2,
} from "lucide-react";
import type { Task, Priority } from "@/types";

import { TaskDetails } from "./components/TaskDetails";
import { TaskInput } from "./components/TaskInput";
import { TaskMenu, type TaskView } from "./components/TaskMenu";
import { TaskItem } from "./components/TaskItem";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Select } from "@/components/ui/Select";
import { useUiStore } from "@/stores/ui.store";

import { useTasksStore } from "./store/tasks.store";
import {
  isTaskOnDate,
  isTaskCompletedOnDate,
  getNextOccurrence,
} from "./utils/task.utils";

const getMobileMenuOptions = (counts: {
  today: number;
  upcoming: number;
  overdue: number;
  completed: number;
}) => [
  {
    value: "today",
    label: `Today ${counts.today}`,
    icon: <CalendarDays className="w-4 h-4" />,
  },
  {
    value: "upcoming",
    label: `Upcoming ${counts.upcoming}`,
    icon: <CalendarRange className="w-4 h-4 text-accent-primary" />,
  },
  {
    value: "overdue",
    label: `Overdue ${counts.overdue}`,
    icon: <AlertCircle className="w-4 h-4 text-red-500" />,
  },
  {
    value: "completed",
    label: `Completed ${counts.completed}`,
    icon: <CheckSquare className="w-4 h-4" />,
  },
  { value: "trash", label: "Trash Bin", icon: <Trash2 className="w-4 h-4" /> },
];

export default function TasksPage() {
  const { openMobileMenu } = useUiStore();
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    bulkUpdateTasks,
    bulkDeleteTasks,
    toggleTaskCompletionOnDate,
  } = useTasksStore();

  const [activeView, setActiveView] = useState<TaskView>("today");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      )
        setActiveDropdown(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const now = new Date();
  const todayStart = startOfDay(now);
  let todayCount = 0;
  let upcomingCount = 0;
  let overdueCount = 0;
  let completedCount = 0;

  // Counter Logic utilizing occurrence validation
  tasks.forEach((task) => {
    if (task.deletedAt) return;

    const isNonRecurring = task.recurrence === "none" || !task.recurrence;

    // Handle non-recurring completed tasks
    if (isNonRecurring && task.completed) {
      completedCount++;
      return; // Skip further checks for finished non-recurring tasks
    }

    // Handle recurring completed tasks (count if finished today)
    if (!isNonRecurring && isTaskCompletedOnDate(task, now)) {
      completedCount++;
      // Do NOT return here, because it still needs to calculate tomorrow's upcoming occurrence!
    }

    if (isTaskOnDate(task, now) && !isTaskCompletedOnDate(task, now)) {
      todayCount++;
    }

    const nextOcc = getNextOccurrence(task, addDays(now, 1));
    if (nextOcc) upcomingCount++;

    if (
      isNonRecurring &&
      isBefore(parseISO(task.dueDate || task.createdAt), todayStart) &&
      !task.completed
    ) {
      overdueCount++;
    }
  });
  // Calculate rendering and group routing for tasks
  const displayedTasksWithDate = tasks
    .map((task) => {
      let effectiveDate = parseISO(task.dueDate || task.createdAt);
      let show = false;

      if (activeView === "trash") {
        show = !!task.deletedAt;
      } else if (!task.deletedAt) {
        if (activeView === "completed") {
          show =
            task.recurrence === "none" || !task.recurrence
              ? task.completed
              : isTaskCompletedOnDate(task, now);
          effectiveDate = now;
        } else if (activeView === "today") {
          show = isTaskOnDate(task, now) && !isTaskCompletedOnDate(task, now);
          effectiveDate = now;
        } else if (activeView === "upcoming") {
          const nextOcc = getNextOccurrence(task, addDays(now, 1));
          if (nextOcc) {
            show = true;
            effectiveDate = nextOcc;
          }
        } else if (activeView === "overdue") {
          if (task.recurrence === "none" || !task.recurrence) {
            show = !task.completed && isBefore(effectiveDate, todayStart);
          }
        }
      }
      return { task, effectiveDate, show };
    })
    .filter((t) => t.show);

  const areAllDisplayedCompleted =
    displayedTasksWithDate.length > 0 &&
    displayedTasksWithDate.every((t) =>
      isTaskCompletedOnDate(t.task, t.effectiveDate),
    );

  const groupedTasks = displayedTasksWithDate.reduce(
    (acc, { task, effectiveDate }) => {
      let label = format(effectiveDate, "d MMM yyyy");
      if (isToday(effectiveDate)) label = "Today";
      else if (isYesterday(effectiveDate)) label = "Yesterday";
      else if (isTomorrow(effectiveDate)) label = "Tomorrow";

      if (!acc[label]) acc[label] = { label, date: effectiveDate, items: [] };
      acc[label].items.push({ task, effectiveDate });
      return acc;
    },
    {} as Record<
      string,
      {
        label: string;
        date: Date;
        items: { task: Task; effectiveDate: Date }[];
      }
    >,
  );

  const sortedGroups = Object.values(groupedTasks).sort((a, b) =>
    activeView === "upcoming"
      ? compareAsc(a.date, b.date)
      : compareDesc(a.date, b.date),
  );

  const toggleGroup = (label: string) => {
    const next = new Set(collapsedGroups);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    setCollapsedGroups(next);
  };

  const handleAddTask = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      completed: false,
      priority: "none",
      subtasks: [],
      createdAt: new Date().toISOString(),
      dueDate: format(new Date(), "yyyy-MM-dd"),
      categoryId: "none",
      recurrence: "none",
      type: "task", // FIXED: Tag explicitly as a normal task
    };
    if (activeView !== "today") setActiveView("today");
    addTask(newTask);
    setNewTaskTitle("");
  };

  const updatePriority = (
    taskId: string,
    priority: Priority,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    updateTask(taskId, { priority });
    setActiveDropdown(null);
  };

  const handleDeleteTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task?.deletedAt) deleteTask(id);
    else updateTask(id, { deletedAt: new Date().toISOString() });
    if (selectedTaskId === id) setSelectedTaskId(null);
  };

  const handleRestoreTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask(id, { deletedAt: undefined });
    if (selectedTaskId === id) setSelectedTaskId(null);
  };

  const handleHardDeleteSingle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTask(id);
    if (selectedTaskId === id) setSelectedTaskId(null);
  };

  const handleDeleteAllDisplayed = () => {
    const displayedIds = displayedTasksWithDate.map((t) => t.task.id);
    if (activeView === "trash") {
      bulkDeleteTasks(displayedIds);
    } else {
      bulkUpdateTasks(displayedIds, { deletedAt: new Date().toISOString() });
    }
    setSelectedTaskId(null);
  };

  const toggleAllDisplayedTasks = () => {
    displayedTasksWithDate.forEach((t) =>
      toggleTaskCompletionOnDate(t.task.id, t.effectiveDate),
    );
  };

  return (
    <div className="flex h-full w-full absolute inset-0 z-20 bg-background-surface md:static md:bg-transparent overflow-hidden">
      <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300">
        <div className="flex flex-col h-full max-w-5xl w-full mx-auto relative pb-2 md:pb-0 px-0 md:px-8">
          <div className="md:hidden flex flex-col px-4 pt-2 pb-2 border-b border-border-subtle shrink-0 bg-background-surface">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <button
                  onClick={openMobileMenu}
                  className="p-2 -ml-2 text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <span className="text-2xl font-extrabold bg-linear-to-r from-text-primary via-accent-primary to-text-primary bg-clip-text text-transparent">
                  TODO
                </span>
              </div>
              <div className="w-40">
                <Select
                  value={activeView}
                  onChange={(val) => setActiveView(val as TaskView)}
                  options={getMobileMenuOptions({
                    today: todayCount,
                    upcoming: upcomingCount,
                    overdue: overdueCount,
                    completed: completedCount,
                  })}
                  align="right"
                />
              </div>
            </div>
          </div>

          <div className="hidden md:flex pt-8 pb-6 flex-col shrink-0">
            <h1 className="text-4xl font-extrabold tracking-tight">
              <span className="bg-linear-to-r from-text-primary via-accent-primary to-text-primary bg-clip-text text-transparent bg-size-[200%_auto] animate-gradient">
                TODO
              </span>
            </h1>
          </div>

          <div className="flex flex-1 overflow-hidden md:gap-8">
            <TaskMenu
              activeView={activeView}
              setActiveView={setActiveView}
              counts={{
                today: todayCount,
                upcoming: upcomingCount,
                overdue: overdueCount,
                completed: completedCount,
              }}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:mb-8">
              {activeView !== "trash" && (
                <div className="hidden md:block w-full mb-6 shrink-0">
                  <TaskInput
                    value={newTaskTitle}
                    onChange={setNewTaskTitle}
                    onSubmit={handleAddTask}
                  />
                </div>
              )}

              <div className="flex-1 flex flex-col min-w-0 md:bg-background-surface md:border border-border-subtle md:rounded-2xl md:shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border-subtle bg-background-main/30 shrink-0">
                  {activeView === "trash" ? (
                    <span className="text-sm font-medium text-text-secondary">
                      Trash empties after 7 days
                    </span>
                  ) : (
                    <button
                      onClick={toggleAllDisplayedTasks}
                      disabled={displayedTasksWithDate.length === 0}
                      className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {areAllDisplayedCompleted
                        ? "Mark all undone"
                        : "Mark all done"}
                    </button>
                  )}

                  <button
                    onClick={() => setIsDeleteAllModalOpen(true)}
                    disabled={displayedTasksWithDate.length === 0}
                    className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {activeView === "trash" ? "Empty Trash" : "Delete all"}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {displayedTasksWithDate.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-text-secondary text-sm">
                      No tasks found in {activeView}.
                    </div>
                  ) : (
                    <>
                      {(activeView === "today" || activeView === "trash") && (
                        <div className="space-y-2">
                          {displayedTasksWithDate.map((item) => {
                            // Ensure checkbox strictly reflects the instance state
                            const instanceTask = {
                              ...item.task,
                              completed: isTaskCompletedOnDate(
                                item.task,
                                item.effectiveDate,
                              ),
                            };
                            return (
                              <TaskItem
                                key={item.task.id}
                                task={instanceTask}
                                activeView={activeView}
                                isSelected={selectedTaskId === item.task.id}
                                onSelect={setSelectedTaskId}
                                onToggleCompletion={(id, e) => {
                                  e.stopPropagation();
                                  toggleTaskCompletionOnDate(
                                    id,
                                    item.effectiveDate,
                                  );
                                }}
                                onUpdatePriority={updatePriority}
                                onRestore={handleRestoreTask}
                                onHardDelete={handleHardDeleteSingle}
                                activeDropdown={activeDropdown}
                                setActiveDropdown={setActiveDropdown}
                                dropdownRef={dropdownRef}
                              />
                            );
                          })}
                        </div>
                      )}

                      {(activeView === "upcoming" ||
                        activeView === "overdue" ||
                        activeView === "completed") && (
                        <div className="space-y-6">
                          {sortedGroups.map((group) => (
                            <div key={group.label} className="flex flex-col">
                              <button
                                onClick={() => toggleGroup(group.label)}
                                className="flex items-center gap-2 text-left font-semibold text-text-primary mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                {collapsedGroups.has(group.label) ? (
                                  <ChevronRight className="w-5 h-5 text-text-secondary" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-text-secondary" />
                                )}
                                {group.label}
                                <span className="text-xs text-text-secondary font-medium ml-1 bg-background-main border border-border-subtle px-2 py-0.5 rounded-full">
                                  {group.items.length}
                                </span>
                              </button>

                              <div
                                className={`space-y-2 pl-1 transition-all duration-200 overflow-hidden ${collapsedGroups.has(group.label) ? "h-0 opacity-0" : "h-auto opacity-100"}`}
                              >
                                {group.items.map((item) => {
                                  // Ensure checkbox strictly reflects the instance state
                                  const instanceTask = {
                                    ...item.task,
                                    completed: isTaskCompletedOnDate(
                                      item.task,
                                      item.effectiveDate,
                                    ),
                                  };
                                  return (
                                    <TaskItem
                                      key={item.task.id}
                                      task={instanceTask}
                                      activeView={activeView}
                                      isSelected={
                                        selectedTaskId === item.task.id
                                      }
                                      onSelect={setSelectedTaskId}
                                      onToggleCompletion={(id, e) => {
                                        e.stopPropagation();
                                        toggleTaskCompletionOnDate(
                                          id,
                                          item.effectiveDate,
                                        );
                                      }}
                                      onUpdatePriority={updatePriority}
                                      onRestore={handleRestoreTask}
                                      onHardDelete={handleHardDeleteSingle}
                                      activeDropdown={activeDropdown}
                                      setActiveDropdown={setActiveDropdown}
                                      dropdownRef={dropdownRef}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {activeView !== "trash" && (
            <div className="md:hidden shrink-0 border-t border-border-subtle bg-background-surface px-4 pt-4 pb-8 shadow-[0_-8px_20px_rgba(0,0,0,0.08)]">
              <TaskInput
                value={newTaskTitle}
                onChange={setNewTaskTitle}
                onSubmit={handleAddTask}
              />
            </div>
          )}
        </div>
      </div>

      <TaskDetails
        task={tasks.find((t) => t.id === selectedTaskId) || null}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={(updatedTask) => updateTask(updatedTask.id, updatedTask)}
        onDelete={handleDeleteTask}
        onDuplicate={(task) => {
          const duplicate: Task = {
            ...task,
            id: crypto.randomUUID(),
            title: `${task.title} (Copy)`,
            createdAt: new Date().toISOString(),
            dueDate: format(new Date(), "yyyy-MM-dd"),
            categoryId: "none",
            recurrence: "none",
            type: task.type || "task",
          };
          addTask(duplicate);
        }}
      />

      <ConfirmModal
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirm={handleDeleteAllDisplayed}
        title={activeView === "trash" ? "Empty Trash" : "Delete Tasks"}
        message={
          activeView === "trash"
            ? "Are you sure you want to permanently delete all items in the trash? This cannot be undone."
            : `Are you sure you want to move all tasks currently displayed in the '${activeView}' view to the trash?`
        }
        confirmText={activeView === "trash" ? "Empty Trash" : "Delete Tasks"}
        isDanger={true}
      />
    </div>
  );
}

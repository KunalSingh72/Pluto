"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  CheckCheck,
  Trash2,
  Flag,
  Copy,
  Calendar,
  AlertCircle,
  Inbox,
  X,
  Trash,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidePanel } from "@/components/shared/SidePanel";
import { useTaskStore, Task, Priority } from "@/store/useTaskStore";

type Tab = "today" | "overdue" | "trash";

// --- Extracted Helper Functions ---
const formatTaskDate = (dateStr: string) => {
  const today = new Date().toISOString().split("T")[0];
  if (dateStr === today) return "Today";

  const date = new Date(dateStr);
  const todayDate = new Date(today);
  const diffTime = todayDate.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
};

const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case "high":
      return "text-red-500 fill-red-500";
    case "medium":
      return "text-yellow-500 fill-yellow-500";
    case "low":
      return "text-green-500 fill-green-500";
    default:
      return "text-zinc-600";
  }
};

export default function TasksPage() {
  const {
    tasks,
    addTask,
    updateTask,
    duplicateTask,
    moveToTrash,
    restoreFromTrash,
    permanentlyDelete,
    emptyTrash,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    processDayEnd,
  } = useTaskStore();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [inputValue, setInputValue] = useState("");

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const activeTask = tasks.find((t) => t.id === selectedTaskId);
  const todayString = new Date().toISOString().split("T")[0];

  useEffect(() => {
    processDayEnd();
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, [processDayEnd]);

  // Derived filtered tasks for active view
  const filteredTasks = useMemo(() => {
    if (activeTab === "trash") return tasks.filter((t) => t.isDeleted);

    return tasks.filter((t) => {
      if (t.isDeleted) return false;
      if (activeTab === "today") return t.date === todayString;
      if (activeTab === "overdue")
        return t.date !== todayString && !t.completed;
      return false;
    });
  }, [tasks, activeTab, todayString]);

  // Group Overdue tasks by date
  const groupedOverdueTasks = useMemo(() => {
    if (activeTab !== "overdue") return {};
    return filteredTasks.reduce(
      (acc, task) => {
        const dateLabel = formatTaskDate(task.date);
        if (!acc[dateLabel]) acc[dateLabel] = [];
        acc[dateLabel].push(task);
        return acc;
      },
      {} as Record<string, Task[]>,
    );
  }, [filteredTasks, activeTab]);

  // Pending Counts for Sidebar
  const todayPendingCount = useMemo(
    () =>
      tasks.filter(
        (t) => !t.isDeleted && !t.completed && t.date === todayString,
      ).length,
    [tasks, todayString],
  );

  const overduePendingCount = useMemo(
    () =>
      tasks.filter(
        (t) => !t.isDeleted && !t.completed && t.date !== todayString,
      ).length,
    [tasks, todayString],
  );

  const handleAddTask = () => {
    if (!inputValue.trim()) return;
    addTask(inputValue.trim());
    setInputValue("");
  };

  if (!mounted) return null;

  return (
    <div className="flex h-full max-w-6xl mx-auto gap-8">
      {/* Inner Sidebar Navigation */}
      <div className="w-52 shrink-0 flex flex-col gap-1.5 pt-2">
        <div className="px-3 pb-4 mb-2">
          <h2 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-linear-to-br from-white to-purple-500 drop-shadow-sm">
            TODO
          </h2>
        </div>

        <button
          onClick={() => setActiveTab("today")}
          className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
            activeTab === "today"
              ? "bg-[#1c142c] text-[#a78bfa]"
              : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4" /> Today
          </div>
          {todayPendingCount > 0 && (
            <span
              className={`text-[11px] py-0.5 px-2 rounded-lg font-bold border ${
                activeTab === "today"
                  ? "border-[#a78bfa]/30 bg-[#a78bfa]/10 text-[#a78bfa]"
                  : "border-zinc-700/50 bg-zinc-800/30 text-zinc-400"
              }`}
            >
              {todayPendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("overdue")}
          className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
            activeTab === "overdue"
              ? "bg-[#2c1414] text-[#f87171]"
              : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4" /> Overdue
          </div>
          {overduePendingCount > 0 && (
            <span
              className={`text-[11px] py-0.5 px-2 rounded-lg font-bold border ${
                activeTab === "overdue"
                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                  : "border-red-900/60 bg-red-950/20 text-red-500"
              }`}
            >
              {overduePendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("trash")}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
            activeTab === "trash"
              ? "bg-zinc-800/80 text-zinc-100"
              : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200"
          }`}
        >
          <Trash2 className="h-4 w-4" /> Trash Bin
        </button>
      </div>

      {/* Main Task Area */}
      <div className="flex-1 flex flex-col pt-2">
        {/* Input Bar (Only show on Today tab) */}
        {activeTab === "today" && (
          <div className="mb-4">
            <div className="flex gap-3 items-center w-full max-w-2xl">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                placeholder="What needs to be done today?"
                className="h-12 bg-zinc-900 border-zinc-800 text-base focus-visible:ring-purple-600/50"
              />
              <Button
                onClick={handleAddTask}
                className="h-12 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-900/20"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Bulk Actions for Active Tasks */}
        {activeTab !== "trash" && filteredTasks.length > 0 && (
          <div className="flex justify-between items-center w-full max-w-2xl mb-4 px-1">
            <button
              onClick={() =>
                filteredTasks
                  .filter((t) => !t.completed)
                  .forEach((t) => updateTask(t.id, { completed: true }))
              }
              className="text-xs flex items-center gap-1.5 text-zinc-500 hover:text-purple-400 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all done
            </button>
            <ConfirmDialog
              title="Delete all active tasks?"
              description="Are you sure you want to move all tasks in this view to the trash bin?"
              onConfirm={() => filteredTasks.forEach((t) => moveToTrash(t.id))}
            >
              <button className="text-xs flex items-center gap-1.5 text-zinc-500 hover:text-red-400 transition-colors">
                <Trash2 className="h-3.5 w-3.5" /> Delete all
              </button>
            </ConfirmDialog>
          </div>
        )}

        {/* Trash Actions */}
        {activeTab === "trash" && filteredTasks.length > 0 && (
          <div className="mb-6 w-full max-w-2xl flex justify-end">
            <ConfirmDialog
              title="Empty Trash Bin?"
              description="This will permanently delete all tasks in the trash. This action cannot be undone."
              onConfirm={emptyTrash}
            >
              <Button
                variant="destructive"
                className="h-9 rounded-xl shadow-lg shadow-red-900/20"
              >
                Empty Trash
              </Button>
            </ConfirmDialog>
          </div>
        )}

        {/* Task List Rendering */}
        <div className="flex-1 overflow-y-auto pb-20 pr-4 flex flex-col gap-2 w-full max-w-2xl">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-sm flex flex-col items-center gap-3">
              <Inbox className="h-10 w-10 text-zinc-700" />
              No tasks found in {activeTab}.
            </div>
          ) : activeTab === "overdue" ? (
            Object.entries(groupedOverdueTasks).map(
              ([dateLabel, dateTasks]) => (
                <div key={dateLabel} className="mb-6">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 ml-1 border-b border-zinc-800/50 pb-2">
                    {dateLabel}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {dateTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        activeTab={activeTab}
                        setSelectedTaskId={setSelectedTaskId}
                        updateTask={updateTask}
                        restoreFromTrash={restoreFromTrash}
                        permanentlyDelete={permanentlyDelete}
                      />
                    ))}
                  </div>
                </div>
              ),
            )
          ) : (
            filteredTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                activeTab={activeTab}
                setSelectedTaskId={setSelectedTaskId}
                updateTask={updateTask}
                restoreFromTrash={restoreFromTrash}
                permanentlyDelete={permanentlyDelete}
              />
            ))
          )}
        </div>
      </div>

      {/* Reusable Slide-out Side Panel for Task Editing */}
      <SidePanel
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        title="Edit Task"
      >
        {activeTask && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-zinc-800/60 flex items-start gap-4 shrink-0">
              <Checkbox
                checked={activeTask.completed}
                onCheckedChange={() =>
                  updateTask(activeTask.id, {
                    completed: !activeTask.completed,
                  })
                }
                className="mt-1 h-5 w-5 rounded-md border-zinc-700 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
              />
              <textarea
                value={activeTask.title}
                onChange={(e) =>
                  updateTask(activeTask.id, { title: e.target.value })
                }
                className="w-full bg-transparent text-lg font-medium text-zinc-100 outline-none resize-none min-h-15"
                rows={2}
              />
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="flex items-center justify-between mb-8">
                <span className="text-sm font-medium text-zinc-400">
                  Priority
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-900 outline-none transition-colors text-sm capitalize">
                    <Flag
                      className={`h-3.5 w-3.5 ${getPriorityColor(activeTask.priority)}`}
                    />
                    {activeTask.priority}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-zinc-900 border-zinc-800 rounded-xl"
                  >
                    {["none", "low", "medium", "high"].map((level) => (
                      <DropdownMenuItem
                        key={level}
                        onClick={() =>
                          updateTask(activeTask.id, {
                            priority: level as Priority,
                          })
                        }
                        className="capitalize cursor-pointer focus:bg-zinc-800"
                      >
                        <Flag
                          className={`h-3.5 w-3.5 mr-2 ${getPriorityColor(level as Priority)}`}
                        />{" "}
                        {level}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mb-8">
                <h4 className="text-sm font-medium text-zinc-400 mb-4">
                  Subtasks
                </h4>
                <div className="flex flex-col gap-2">
                  {activeTask.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-3 group"
                    >
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={() =>
                          updateSubtask(activeTask.id, subtask.id, {
                            completed: !subtask.completed,
                          })
                        }
                        className="h-4 w-4 rounded border-zinc-700 data-[state=checked]:bg-purple-600"
                      />
                      <Input
                        value={subtask.title}
                        onChange={(e) =>
                          updateSubtask(activeTask.id, subtask.id, {
                            title: e.target.value,
                          })
                        }
                        className={`h-8 border-transparent bg-transparent hover:bg-zinc-900/50 focus-visible:bg-zinc-900/80 px-2 transition-all ${subtask.completed ? "text-zinc-500 line-through" : "text-zinc-200"}`}
                      />

                      <ConfirmDialog
                        title="Delete Subtask?"
                        description="Are you sure you want to remove this subtask?"
                        onConfirm={() =>
                          deleteSubtask(activeTask.id, subtask.id)
                        }
                      >
                        <button className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                          <X className="h-4 w-4" />
                        </button>
                      </ConfirmDialog>
                    </div>
                  ))}

                  <div className="flex items-center gap-3 mt-2">
                    <Plus className="h-4 w-4 text-zinc-600 ml-0.5" />
                    <Input
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newSubtaskTitle.trim()) {
                          addSubtask(activeTask.id, newSubtaskTitle.trim());
                          setNewSubtaskTitle("");
                        }
                      }}
                      placeholder="Add subtask..."
                      className="h-8 border-transparent bg-transparent placeholder:text-zinc-600 focus-visible:bg-zinc-900/50 px-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800/60 bg-[#101012] flex justify-between shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  duplicateTask(activeTask.id);
                  setSelectedTaskId(null);
                }}
                className="text-zinc-400 hover:text-zinc-100 rounded-lg"
              >
                <Copy className="h-4 w-4 mr-2" /> Duplicate
              </Button>

              <ConfirmDialog
                title="Move to Trash?"
                description="This task will be moved to the trash bin."
                onConfirm={() => {
                  moveToTrash(activeTask.id);
                  setSelectedTaskId(null);
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400/80 hover:text-red-400 hover:bg-red-950/30 rounded-lg"
                >
                  <Trash className="h-4 w-4 mr-2" /> Delete
                </Button>
              </ConfirmDialog>
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  );
}

// --- Extracted Component for Task Rows ---
// Extracted outside to prevent re-render flickering when input states change in the parent
interface TaskRowProps {
  task: Task;
  activeTab: Tab;
  setSelectedTaskId: (id: string | null) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  restoreFromTrash: (id: string) => void;
  permanentlyDelete: (id: string) => void;
}

function TaskRow({
  task,
  activeTab,
  setSelectedTaskId,
  updateTask,
  restoreFromTrash,
  permanentlyDelete,
}: TaskRowProps) {
  return (
    <div
      onClick={() => activeTab !== "trash" && setSelectedTaskId(task.id)}
      className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
        task.completed
          ? "bg-[#121215] border-zinc-800/60 hover:bg-[#18181b] hover:border-zinc-700"
          : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800"
      }`}
    >
      <div className="flex items-center gap-4 flex-1 overflow-hidden">
        <Checkbox
          checked={task.completed}
          onCheckedChange={(checked) =>
            updateTask(task.id, { completed: !!checked })
          }
          onClick={(e) => e.stopPropagation()}
          className="h-5 w-5 rounded-md border-zinc-700 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
        />
        <div className="flex flex-col">
          <span
            className={`text-sm truncate transition-all duration-200 ${
              task.completed ? "text-zinc-500 line-through" : "text-zinc-200"
            }`}
          >
            {task.title}
          </span>
          {task.subtasks.length > 0 && (
            <span
              className={`text-xs mt-0.5 transition-colors ${task.completed ? "text-zinc-600" : "text-zinc-500"}`}
            >
              {task.subtasks.filter((s) => s.completed).length}/
              {task.subtasks.length} subtasks
            </span>
          )}
        </div>
      </div>

      <div
        className="flex items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {activeTab === "trash" ? (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => restoreFromTrash(task.id)}
              className="h-8 px-2 text-zinc-400 hover:text-green-400"
            >
              Restore
            </Button>
            <ConfirmDialog
              title="Permanently Delete?"
              description="This task will be deleted forever. This action cannot be undone."
              onConfirm={() => permanentlyDelete(task.id)}
            >
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-zinc-400 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </ConfirmDialog>
          </>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger className="p-2 rounded-lg hover:bg-zinc-700/50 outline-none transition-colors">
              <Flag className={`h-4 w-4 ${getPriorityColor(task.priority)}`} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-zinc-900 border-zinc-800 rounded-xl min-w-30"
            >
              {["none", "low", "medium", "high"].map((level) => (
                <DropdownMenuItem
                  key={level}
                  onClick={() =>
                    updateTask(task.id, { priority: level as Priority })
                  }
                  className="capitalize cursor-pointer focus:bg-zinc-800 text-zinc-300"
                >
                  <Flag
                    className={`h-3.5 w-3.5 mr-2 ${getPriorityColor(level as Priority)}`}
                  />{" "}
                  {level}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

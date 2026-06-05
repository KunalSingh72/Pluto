import type { RefObject } from "react";
import {
  CheckCircle2,
  Circle,
  Flag,
  ListTodo,
  RotateCcw,
  Trash2,
  CalendarDays, // <-- NEW: Imported Calendar Icon
} from "lucide-react";
import type { Task, Priority } from "@/types";
import type { TaskView } from "./TaskMenu";

interface TaskItemProps {
  task: Task;
  activeView: TaskView;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleCompletion: (id: string, e: React.MouseEvent) => void;
  onUpdatePriority: (
    id: string,
    priority: Priority,
    e: React.MouseEvent,
  ) => void;
  onRestore: (id: string, e: React.MouseEvent) => void;
  onHardDelete: (id: string, e: React.MouseEvent) => void;
  activeDropdown: string | null;
  setActiveDropdown: (id: string | null) => void;
  dropdownRef: RefObject<HTMLDivElement | null>;
}

export function TaskItem({
  task,
  activeView,
  isSelected,
  onSelect,
  onToggleCompletion,
  onUpdatePriority,
  onRestore,
  onHardDelete,
  activeDropdown,
  setActiveDropdown,
  dropdownRef,
}: TaskItemProps) {
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "text-text-secondary";
    }
  };

  return (
    <div
      onClick={() => onSelect(task.id)}
      className={`group flex items-center justify-between p-3 md:p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? "border-accent-primary bg-accent-subtle/30"
          : "border-border-subtle hover:border-text-secondary/30 md:hover:bg-background-main"
      }`}
    >
      <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
        {activeView === "trash" ? (
          <div className="p-2 -ml-2 shrink-0 opacity-50">
            {task.completed ? (
              <CheckCircle2 className="w-6 h-6 text-accent-primary" />
            ) : (
              <Circle className="w-6 h-6 text-text-secondary" />
            )}
          </div>
        ) : (
          <button
            onClick={(e) => onToggleCompletion(task.id, e)}
            className="p-2 -ml-2 shrink-0 cursor-pointer"
          >
            {task.completed ? (
              <CheckCircle2 className="w-6 h-6 text-accent-primary" />
            ) : (
              <Circle className="w-6 h-6 text-text-secondary md:group-hover:text-text-primary transition-colors" />
            )}
          </button>
        )}

        <div className="flex flex-col truncate">
          {/* UPDATED: Title block with conditional Calendar Icon */}
          <div className="flex items-center gap-2">
            <span
              className={`font-medium transition-all truncate ${task.completed ? "text-text-secondary line-through" : "text-text-primary"}`}
            >
              {task.title || "Untitled"}
            </span>

            {task.type === "event" && (
              <span
                title="Calendar Event"
                className="flex items-center shrink-0"
              >
                <CalendarDays
                  className={`w-3.5 h-3.5 ${task.completed ? "text-text-secondary" : "text-accent-primary"}`}
                />
              </span>
            )}
          </div>

          {task.subtasks && task.subtasks.length > 0 && (
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-text-secondary">
              <ListTodo className="w-3.5 h-3.5" />
              <span>
                {task.subtasks.filter((s) => s.completed).length} /{" "}
                {task.subtasks.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {activeView === "trash" ? (
        <div className="relative shrink-0 ml-2 flex items-center gap-1">
          <button
            onClick={(e) => onRestore(task.id, e)}
            className="p-2 rounded-lg hover:bg-background-surface text-text-secondary hover:text-accent-primary transition-colors cursor-pointer"
            title="Restore Task"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => onHardDelete(task.id, e)}
            className="p-2 rounded-lg hover:bg-background-surface text-text-secondary hover:text-red-500 transition-colors cursor-pointer"
            title="Permanently Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="relative shrink-0 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveDropdown(activeDropdown === task.id ? null : task.id);
            }}
            className={`p-3 md:p-2 -mr-2 md:mr-0 rounded-lg hover:bg-background-surface transition-colors cursor-pointer ${getPriorityColor(task.priority)}`}
          >
            <Flag
              className="w-5 h-5"
              fill={task.priority !== "none" ? "currentColor" : "none"}
            />
          </button>

          {activeDropdown === task.id && (
            <div
              ref={dropdownRef}
              className="absolute right-0 mt-2 w-36 bg-background-surface border border-border-subtle rounded-xl shadow-lg z-20 py-2 animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                onClick={(e) => onUpdatePriority(task.id, "high", e)}
                className="w-full text-left px-4 py-3 md:py-2 text-sm text-text-primary hover:bg-background-main flex items-center gap-2 cursor-pointer"
              >
                <Flag className="w-4 h-4 text-red-500" fill="currentColor" />{" "}
                High
              </button>
              <button
                onClick={(e) => onUpdatePriority(task.id, "medium", e)}
                className="w-full text-left px-4 py-3 md:py-2 text-sm text-text-primary hover:bg-background-main flex items-center gap-2 cursor-pointer"
              >
                <Flag className="w-4 h-4 text-yellow-500" fill="currentColor" />{" "}
                Medium
              </button>
              <button
                onClick={(e) => onUpdatePriority(task.id, "low", e)}
                className="w-full text-left px-4 py-3 md:py-2 text-sm text-text-primary hover:bg-background-main flex items-center gap-2 cursor-pointer"
              >
                <Flag className="w-4 h-4 text-green-500" fill="currentColor" />{" "}
                Low
              </button>
              <button
                onClick={(e) => onUpdatePriority(task.id, "none", e)}
                className="w-full text-left px-4 py-3 md:py-2 text-sm text-text-primary hover:bg-background-main flex items-center gap-2 cursor-pointer"
              >
                <Flag className="w-4 h-4 text-text-secondary" /> None
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

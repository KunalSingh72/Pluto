import {
  CalendarDays,
  CalendarRange,
  AlertCircle,
  CheckSquare,
  Trash2,
} from "lucide-react";

export type TaskView = "today" | "upcoming" | "overdue" | "completed" | "trash";

interface TaskMenuProps {
  activeView: TaskView;
  setActiveView: (view: TaskView) => void;
  counts: {
    today: number;
    upcoming: number;
    overdue: number;
    completed: number;
  };
}

export function TaskMenu({ activeView, setActiveView, counts }: TaskMenuProps) {
  const desktopMenuOptions = [
    {
      value: "today",
      label: "Today",
      count: counts.today,
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      value: "upcoming",
      label: "Upcoming",
      count: counts.upcoming,
      countClass:
        "text-accent-primary bg-accent-primary/10 border-accent-primary/20",
      icon: <CalendarRange className="w-4 h-4" />,
    },
    {
      value: "overdue",
      label: "Overdue",
      count: counts.overdue,
      countClass: "text-red-500 bg-red-500/10 border-red-500/20",
      icon: <AlertCircle className="w-4 h-4" />,
    },
    {
      value: "completed",
      label: "Completed",
      count: counts.completed,
      icon: <CheckSquare className="w-4 h-4" />,
    },
    {
      value: "trash",
      label: "Trash Bin",
      count: null,
      icon: <Trash2 className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 py-2">
      <nav className="space-y-1">
        {desktopMenuOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveView(opt.value as TaskView)}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeView === opt.value
                ? "bg-accent-subtle text-accent-primary"
                : "text-text-secondary hover:bg-background-main hover:text-text-primary"
            }`}
          >
            <div className="flex items-center gap-3">
              {opt.icon}
              {opt.label}
            </div>
            {opt.count !== null && (
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-bold border transition-colors ${
                  opt.countClass ||
                  (activeView === opt.value
                    ? "bg-accent-primary/10 text-accent-primary border-accent-primary/20"
                    : "bg-background-main text-text-secondary border-border-subtle")
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}

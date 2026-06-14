import { useState, useMemo } from "react";
import {
  Menu,
  Plus,
  Target,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { useGoalsStore } from "./store/goals.store";
import { GoalCard } from "./components/GoalCard";
import { AddGoalModal } from "./components/AddGoalModal";
import { GoalDetails } from "./components/GoalDetails";
import { Select } from "@/components/ui/Select";
import { format } from "date-fns";

// Types for Filters and Sort
type FilterStatus = "all" | "active" | "achieved" | "overdue" | "abandoned";
type FilterCategory =
  | "all"
  | "career"
  | "learning"
  | "health"
  | "finance"
  | "personal";
type FilterPriority = "all" | "high" | "medium" | "low";
type SortOption = "deadline" | "progress" | "priority" | "newest" | "oldest";

export default function GoalsPage() {
  const openMobileMenu = useUiStore((state) => state.openMobileMenu);
  const goals = useGoalsStore((state) => state.goals);

  // Modals & Sidebar State
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Search, Filter, and Sort State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("active"); // Default to active
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>("all");
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>("all");
  const [sortBy, setSortBy] = useState<SortOption>("deadline"); // Feature 8: Default to Deadline

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const stats = useMemo(() => {
    let active = 0,
      achieved = 0,
      overdue = 0;
    goals.forEach((g) => {
      if (g.status === "achieved") achieved++;
      else if (g.status === "abandoned") return;
      else {
        active++;
        if (g.deadline < todayStr) overdue++;
      }
    });
    return { active, achieved, overdue };
  }, [goals, todayStr]);

  // Apply Filters & Sorting
  const displayedGoals = useMemo(() => {
    let result = goals;

    // 1. Apply Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(query) ||
          (g.description?.toLowerCase() || "").includes(query) ||
          g.milestones.some((m) => m.title.toLowerCase().includes(query)),
      );
    }

    // 2. Apply Filters
    result = result.filter((g) => {
      // Status Filter
      if (
        statusFilter === "active" &&
        (g.status === "achieved" || g.status === "abandoned")
      )
        return false;
      if (statusFilter === "achieved" && g.status !== "achieved") return false;
      if (statusFilter === "abandoned" && g.status !== "abandoned")
        return false;
      if (
        statusFilter === "overdue" &&
        (g.status === "achieved" || g.deadline >= todayStr)
      )
        return false;

      // Category Filter
      if (categoryFilter !== "all" && g.category !== categoryFilter)
        return false;

      // Priority Filter
      if (priorityFilter !== "all" && g.priority !== priorityFilter)
        return false;

      return true;
    });

    // 3. Apply Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "deadline":
          return (
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          );
        case "progress": {
          const aProg = a.currentValue / Math.max(1, a.targetValue);
          const bProg = b.currentValue / Math.max(1, b.targetValue);
          return bProg - aProg; // Descending
        }
        case "priority": {
          const priorityWeight = { high: 3, medium: 2, low: 1 };
          return (
            (priorityWeight[b.priority || "medium"] || 0) -
            (priorityWeight[a.priority || "medium"] || 0)
          );
        }
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

    return result;
  }, [
    goals,
    searchQuery,
    statusFilter,
    categoryFilter,
    priorityFilter,
    sortBy,
    todayStr,
  ]);

  // Helper component for the Filter/Sort controls
  const renderFilterControls = () => (
    <>
      <Select
        value={statusFilter}
        onChange={(v) => setStatusFilter(v as FilterStatus)}
        options={[
          { value: "all", label: "All Statuses" },
          { value: "active", label: "Active" },
          { value: "achieved", label: "Achieved" },
          { value: "overdue", label: "Overdue" },
          { value: "abandoned", label: "Abandoned" },
        ]}
      />
      <Select
        value={categoryFilter}
        onChange={(v) => setCategoryFilter(v as FilterCategory)}
        options={[
          { value: "all", label: "All Categories" },
          { value: "career", label: "Career" },
          { value: "learning", label: "Learning" },
          { value: "health", label: "Health" },
          { value: "finance", label: "Finance" },
          { value: "personal", label: "Personal" },
        ]}
      />
      <Select
        value={priorityFilter}
        onChange={(v) => setPriorityFilter(v as FilterPriority)}
        options={[
          { value: "all", label: "All Priorities" },
          { value: "high", label: "High" },
          { value: "medium", label: "Medium" },
          { value: "low", label: "Low" },
        ]}
      />
      <div className="h-6 w-px bg-border-subtle mx-2 hidden lg:block" />
      <div className="flex items-center gap-2">
        <ArrowUpDown className="w-4 h-4 text-text-secondary shrink-0 hidden lg:block" />
        <Select
          value={sortBy}
          onChange={(v) => setSortBy(v as SortOption)}
          options={[
            { value: "deadline", label: "Sort: Deadline" },
            { value: "progress", label: "Sort: Progress" },
            { value: "priority", label: "Sort: Priority" },
            { value: "newest", label: "Sort: Newest" },
            { value: "oldest", label: "Sort: Oldest" },
          ]}
        />
      </div>
    </>
  );

  return (
    <div className="flex h-full w-full absolute inset-0 z-20 bg-background-main md:static md:bg-transparent overflow-hidden">
      <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300 relative">
        <div className="flex flex-col h-full max-w-6xl w-full mx-auto relative px-0 md:px-8">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between px-4 h-16 border-b border-border-subtle shrink-0 bg-background-surface z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={openMobileMenu}
                className="p-2 -ml-2 text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <span className="text-2xl font-extrabold bg-linear-to-r from-text-primary via-accent-primary to-text-primary bg-clip-text text-transparent">
                Goals
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="p-1.5 text-text-secondary hover:bg-background-main rounded-lg transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="p-1.5 text-accent-primary hover:bg-accent-subtle rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Desktop Header & Search */}
          <div className="hidden md:flex pt-8 pb-4 items-center justify-between shrink-0 gap-6">
            <h1 className="text-4xl font-extrabold tracking-tight">
              <span className="bg-linear-to-r from-text-primary via-accent-primary to-text-primary bg-clip-text text-transparent bg-size-[200%_auto] animate-gradient">
                Goals
              </span>
            </h1>

            {/* Feature 6: Desktop Search Bar */}
            <div className="flex-1 max-w-md relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Search goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background-surface border border-border-subtle rounded-xl text-sm font-medium outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/50 transition-all text-text-primary"
              />
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent-primary text-white font-medium rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-sm shadow-accent-primary/20 shrink-0"
            >
              <Plus className="w-5 h-5" /> New Goal
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-0 scrollbar-none pb-8">
            {/* Feature 6: Mobile Search Bar */}
            <div className="md:hidden py-3 shrink-0">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search goals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-background-surface border border-border-subtle rounded-xl text-sm font-medium outline-none focus:border-accent-primary/50 transition-all text-text-primary"
                />
              </div>
            </div>

            {/* Feature 9: Goals Overview Header */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mt-2">
              <div className="bg-background-surface border border-border-subtle rounded-2xl p-4 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-text-secondary mb-1">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Active
                  </span>
                </div>
                <span className="text-2xl md:text-3xl font-extrabold text-text-primary">
                  {stats.active}
                </span>
              </div>
              <div className="bg-background-surface border border-border-subtle rounded-2xl p-4 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-text-secondary mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Achieved
                  </span>
                </div>
                <span className="text-2xl md:text-3xl font-extrabold text-text-primary">
                  {stats.achieved}
                </span>
              </div>
              <div className="bg-background-surface border border-border-subtle rounded-2xl p-4 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-text-secondary mb-1">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Overdue
                  </span>
                </div>
                <span className="text-2xl md:text-3xl font-extrabold text-text-primary">
                  {stats.overdue}
                </span>
              </div>
            </div>

            {/* Feature 7 & 8: Desktop Filter & Sort Row */}
            <div className="hidden md:flex items-center gap-3 mb-6 bg-background-surface p-2 border border-border-subtle rounded-xl">
              <SlidersHorizontal className="w-4 h-4 text-text-secondary ml-2 shrink-0" />
              {renderFilterControls()}
            </div>

            {/* Goals Grid Layout */}
            {displayedGoals.length === 0 ? (
              <div className="mt-12 flex flex-col items-center justify-center text-text-secondary opacity-60">
                <Target className="w-16 h-16 mb-4 stroke-[1.5]" />
                <p className="text-lg font-medium">No goals found</p>
                <p className="text-sm mt-2">
                  Adjust your search or filters to see more.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onClick={() => setSelectedGoalId(goal.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Feature 7: Mobile Filter Drawer Overlay */}
        {isMobileFilterOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-background-surface w-full rounded-t-3xl p-6 border-t border-border-subtle animate-in slide-in-from-bottom-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" /> Filter & Sort
                </h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="text-accent-primary font-medium"
                >
                  Done
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {renderFilterControls()}
              </div>
            </div>
          </div>
        )}
      </div>

      <GoalDetails
        isOpen={!!selectedGoalId}
        goalId={selectedGoalId}
        onClose={() => setSelectedGoalId(null)}
      />
      <AddGoalModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}

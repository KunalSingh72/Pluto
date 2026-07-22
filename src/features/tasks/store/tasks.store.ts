import { create } from "zustand";
import { persist } from "zustand/middleware";
import { format } from "date-fns";
import type { Task, Category } from "@/types";
import { useGoalsStore } from "@/features/goals/store/goals.store"; // ADD THIS IMPORT

interface TasksState {
  tasks: Task[];
  categories: Category[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  bulkUpdateTasks: (ids: string[], updates: Partial<Task>) => void;
  bulkDeleteTasks: (ids: string[]) => void;
  toggleTaskCompletionOnDate: (id: string, date: Date) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({ // ADD 'get' to the persist arguments
      tasks: [],
      categories: [
        { id: "cat-work", name: "Work", color: "bg-blue-500" },
        { id: "cat-personal", name: "Personal", color: "bg-green-500" },
        { id: "cat-family", name: "Family", color: "bg-yellow-500" }
      ],
      addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
      
      updateTask: (id, updates) => {
        const state = get();
        const t = state.tasks.find(x => x.id === id);
        
        // INTERCEPT: Automate Goal Progress if completion status, goalId, or contribution is directly updated
        if (t) {
            const isNonRecurring = t.recurrence === "none" || !t.recurrence;
            const completedCount = isNonRecurring ? (t.completed ? 1 : 0) : (t.completedDates?.length || 0);
            const newCompletedCount = isNonRecurring ? ((updates.completed !== undefined ? updates.completed : t.completed) ? 1 : 0) : (t.completedDates?.length || 0); // we don't update completedDates through updateTask usually, but handle it if we do
            
            const goalsStore = useGoalsStore.getState();

            const oldGoalId = t.goalId;
            const oldContribution = t.goalContribution || 1;

            const newGoalId = updates.goalId !== undefined ? updates.goalId : t.goalId;
            const newContribution = updates.goalContribution !== undefined ? updates.goalContribution : (t.goalContribution || 1);

            if (oldGoalId === newGoalId && oldGoalId && oldGoalId !== "none") {
                // Goal didn't change, just update if contribution or completed count changed
                const oldTotal = oldContribution * completedCount;
                const newTotal = newContribution * newCompletedCount;
                const delta = newTotal - oldTotal;

                if (delta !== 0) {
                    const goal = goalsStore.goals.find(g => g.id === oldGoalId);
                    if (goal) {
                        goalsStore.updateProgress(goal.id, goal.currentValue + delta, "task", id);
                    }
                }
            } else {
                // Goal changed
                if (oldGoalId && oldGoalId !== "none" && completedCount > 0) {
                    const oldGoal = goalsStore.goals.find(g => g.id === oldGoalId);
                    if (oldGoal) {
                        goalsStore.updateProgress(oldGoal.id, oldGoal.currentValue - (oldContribution * completedCount), "task", id);
                    }
                }

                if (newGoalId && newGoalId !== "none" && newCompletedCount > 0) {
                    // re-fetch in case it's the same goal (shouldn't happen here, but safe)
                    const freshGoalsStore = useGoalsStore.getState();
                    const newGoal = freshGoalsStore.goals.find(g => g.id === newGoalId);
                    if (newGoal) {
                        freshGoalsStore.updateProgress(newGoal.id, newGoal.currentValue + (newContribution * newCompletedCount), "task", id);
                    }
                }
            }
        }

        set((state) => ({
            tasks: state.tasks.map((task) => (task.id === id ? { ...task, ...updates } : task))
        }));
      },
      
      deleteTask: (id) => {
        const state = get();
        const t = state.tasks.find((x) => x.id === id);
        if (t) {
            const isNonRecurring = t.recurrence === "none" || !t.recurrence;
            if (t.goalId && t.goalId !== "none") {
                const contribution = t.goalContribution || 1;
                const goalsStore = useGoalsStore.getState();
                const goal = goalsStore.goals.find((g) => g.id === t.goalId);
                if (goal) {
                    if (isNonRecurring && t.completed) {
                        goalsStore.updateProgress(goal.id, goal.currentValue - contribution, "task", id);
                    } else if (!isNonRecurring && t.completedDates && t.completedDates.length > 0) {
                        goalsStore.updateProgress(goal.id, goal.currentValue - (contribution * t.completedDates.length), "task", id);
                    }
                }
            }
        }
        set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== id)
        }));
      },
      bulkUpdateTasks: (ids, updates) => {
        const state = get();
        ids.forEach(id => {
            state.updateTask(id, updates);
        });
      },
      bulkDeleteTasks: (ids) => {
        const state = get();
        ids.forEach(id => {
            state.deleteTask(id);
        });
      },
      
      toggleTaskCompletionOnDate: (id, date) => {
        const state = get();
        const t = state.tasks.find((x) => x.id === id);
        if (!t) return;

        const isNonRecurring = t.recurrence === "none" || !t.recurrence;
        let isNowCompleted = false;

        if (isNonRecurring) {
          isNowCompleted = !t.completed;
        } else {
          const dateString = format(date, "yyyy-MM-dd");
          const completedDates = t.completedDates || [];
          isNowCompleted = !completedDates.includes(dateString);
        }

        // INTERCEPT: Automate Goal Progress
        if (t.goalId && t.goalId !== "none") {
          const contribution = t.goalContribution || 1;
          const goalsStore = useGoalsStore.getState();
          const goal = goalsStore.goals.find((g) => g.id === t.goalId);
          if (goal) {
            const modifier = isNowCompleted ? contribution : -contribution;
            goalsStore.updateProgress(goal.id, goal.currentValue + modifier, "task", id);
          }
        }

        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== id) return task;
            if (isNonRecurring) {
              return { ...task, completed: isNowCompleted };
            }
            const dateString = format(date, "yyyy-MM-dd");
            const completedDates = task.completedDates || [];
            return {
              ...task,
              completedDates: isNowCompleted
                ? [...completedDates, dateString]
                : completedDates.filter((d) => d !== dateString),
            };
          }),
        }));
      },

      addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
      updateCategory: (id, updates) => set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c))
      })),
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter((c) => c.id !== id)
      })),
    }),
    { name: "life-tracker-global-tasks" }
  )
);
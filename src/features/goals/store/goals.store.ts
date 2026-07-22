import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Goal, GoalStatus } from "@/types";

interface GoalsState {
  goals: Goal[];
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  updateProgress: (id: string, currentValue: number, source?: "manual" | "task" | "habit", sourceId?: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  updateStatus: (id: string, status: GoalStatus) => void;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      goals: [],
      
      addGoal: (goal) => 
        set((state) => ({ goals: [goal, ...state.goals] })),
      
      updateGoal: (id, updates) => 
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),
      
      deleteGoal: (id) => 
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),
        
      updateProgress: (id, currentValue, source = "manual", sourceId) =>
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== id) return g;
            
            const delta = currentValue - g.currentValue;
            
            const newHistory = delta !== 0 ? [
              ...(g.progressHistory || []), 
              {
                value: delta,
                source,
                sourceId,
                timestamp: new Date().toISOString()
              }
            ] : (g.progressHistory || []);

            let newStatus = g.status;
            if (currentValue >= g.targetValue) {
              newStatus = "achieved";
            } else if (currentValue <= 0) {
              newStatus = "not_started";
            } else if (currentValue > 0 && g.status === "not_started") {
              newStatus = "in_progress";
            } else if (currentValue < g.targetValue && g.status === "achieved") {
              newStatus = "in_progress"; 
            }

            return { 
              ...g, 
              currentValue, 
              status: newStatus, 
              progressHistory: newHistory 
            };
          }),
        })),
        
      toggleMilestone: (goalId, milestoneId) =>
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId) return g;
            
            const updatedMilestones = g.milestones.map((m) =>
              m.id === milestoneId ? { ...m, completed: !m.completed } : m
            );
            
            return { ...g, milestones: updatedMilestones };
          }),
        })),
        
      updateStatus: (id, status) =>
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, status } : g)),
        })),
    }),
    { name: "life-tracker-goals" }
  )
);
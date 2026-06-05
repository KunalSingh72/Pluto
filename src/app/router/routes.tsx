import { createBrowserRouter } from "react-router";
import Layout from "@/components/layout/Layout";
import DashboardPage from "@/features/dashboard/DashboardPage";
import TasksPage from "@/features/tasks/TasksPage";
import BudgetPage from "@/features/budget/BudgetPage";
import HealthPage from "@/features/health/HealthPage";
import GoalsPage from "@/features/goals/GoalsPage";
import NotesPage from "@/features/notes/NotesPage";
import Settings from "@/features/settings/Settings";
import CalendarPage from "@/features/calendar/CalendarPage";
import HabitPage from "@/features/habits/HabitPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "tasks",
        element: <TasksPage />,
      },
      { path: "calendar", element: <CalendarPage /> },
      { path: "habits", element: <HabitPage /> },
      {
        path: "goals",
        element: <GoalsPage />,
      },
      {
        path: "health",
        element: <HealthPage />,
      },
      {
        path: "budget",
        element: <BudgetPage />,
      },
      {
        path: "notes",
        element: <NotesPage />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },
]);

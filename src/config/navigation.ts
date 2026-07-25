import { 
  LayoutGrid, 
  Calendar, 
  CheckSquare, 
  Flame, 
  FileText, 
  Target, 
  Wallet, 
  Activity, 
  Settings 
} from "lucide-react";

export const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Habits", href: "/habits", icon: Flame },
  { name: "Notes", href: "/notes", icon: FileText },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Budget", href: "/budget", icon: Wallet },
  { name: "Health", href: "/health", icon: Activity },
];

export const bottomNavItem = { name: "Settings", href: "/settings", icon: Settings };
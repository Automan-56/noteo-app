import {
  type LucideIcon,
  BarChart2,
  BookOpen,
  ClipboardList,
  LogOut,
  UserCircle,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { to: "/", label: "Tableau de bord", icon: BarChart2 },
  { to: "/subjects", label: "Mes matières", icon: BookOpen },
  { to: "/grades", label: "Mes notes", icon: ClipboardList },
  { to: "/profile", label: "Profil", icon: UserCircle },
];

export default function Layout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-200">
      <aside className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 transition-colors duration-200">
        <div className="border-b border-gray-200 p-6 dark:border-zinc-800 transition-colors duration-200">
          <h1 className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-2xl font-bold text-transparent">
            Noteo
          </h1>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors duration-200",
                      isActive
                        ? "border-l-4 border-violet-500 bg-violet-600 text-white hover:bg-violet-700"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white",
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-zinc-800 px-4 py-4 dark:border-zinc-700 transition-colors duration-200">
          <div className="flex items-center justify-between rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Thème
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Clair ou sombre
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div className="p-4 pt-0">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors duration-200"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-zinc-950 transition-colors duration-200">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

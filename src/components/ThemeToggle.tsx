import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-full p-2 text-gray-500 hover:bg-zinc-800 hover:text-white dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors duration-200"
      aria-label={
        theme === "dark"
          ? "Activer le mode clair"
          : "Activer le mode sombre"
      }
      title={theme === "dark" ? "Mode clair" : "Mode sombre"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}

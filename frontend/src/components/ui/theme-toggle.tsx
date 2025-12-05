import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export const ThemeToggle = ({ className }: { className?: string }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "relative h-9 w-9 rounded-lg",
        "transition-all duration-500 ease-smooth",
        "hover:bg-surface-elevated hover:scale-105",
        "active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "dark:focus-visible:ring-offset-surface",
        "group",
        className
      )}
      aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      title={theme === "dark" ? "Mode clair" : "Mode sombre"}
    >
      <div className="relative h-5 w-5 overflow-hidden">
        <Sun
          className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-500 ease-smooth",
            "text-amber-500 dark:text-amber-400",
            theme === "dark"
              ? "rotate-90 scale-0 opacity-0 translate-y-2"
              : "rotate-0 scale-100 opacity-100 translate-y-0"
          )}
        />
        <Moon
          className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-500 ease-smooth",
            "text-slate-600 dark:text-slate-300",
            theme === "dark"
              ? "rotate-0 scale-100 opacity-100 translate-y-0"
              : "-rotate-90 scale-0 opacity-0 -translate-y-2"
          )}
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};


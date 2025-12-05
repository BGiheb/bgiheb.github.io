import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  GraduationCap,
  Home,
  BookOpen,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Video,
  MessageCircle,
  FlaskConical,
} from "lucide-react";

// Navigation items for different roles
const getNavigationItems = (role) => {
  // Common items for all roles
  const commonItems = [
    { name: "Classes", href: "/classes", icon: BookOpen },
    { name: "Forum", href: "/forum", icon: MessageCircle },
    { name: "Messages", href: "/messages", icon: MessageSquare },
    { name: "Paramètres", href: "/settings", icon: Settings },
  ];

  // Role-specific items
  switch (role) {
    case "STUDENT":
      return [
        { name: "Dashboard", href: "/dashboard", icon: Home },
        ...commonItems,
      ];
    case "TEACHER":
      return [
        { name: "Dashboard", href: "/dashboard", icon: Home },
        ...commonItems,
        { name: "Étudiants", href: "/students", icon: Users },
        { name: "Analytics", href: "/analytics", icon: BarChart3 },
      ];
    case "INSTRUCTOR":
      return [
        { name: "Dashboard", href: "/dashboard", icon: Home },
        ...commonItems,
        { name: "Labs", href: "/labs", icon: FlaskConical },
        { name: "Étudiants", href: "/students", icon: Users },
        { name: "Analytics", href: "/analytics", icon: BarChart3 },
      ];
    case "COORDINATOR":
    case "INSPECTOR":
      return [
        { name: "Dashboard", href: "/dashboard", icon: Home },
        ...commonItems,
        { name: "Étudiants", href: "/students", icon: Users },
        { name: "Analytics", href: "/analytics", icon: BarChart3 },
      ];
    case "ADMIN":
      return [
        { name: "Dashboard", href: "/dashboard", icon: Home },
        ...commonItems,
        { name: "Labs", href: "/labs", icon: FlaskConical },
        { name: "Étudiants", href: "/students", icon: Users },
        { name: "Analytics", href: "/analytics", icon: BarChart3 },
        { name: "Utilisateurs", href: "/users", icon: Users },
      ];
    default:
      return commonItems;
  }
};

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  
  // Get navigation items based on user role
  const navigation = getNavigationItems(user?.role || "");

  return (
    <div className={cn(
      "bg-surface border-r border-card-border transition-all duration-300 ease-smooth flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-6 border-b border-card-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-xl">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text">EduPlatform</span>
            </div>
          )}
          {collapsed && (
            <div className="p-2 bg-gradient-primary rounded-xl mx-auto">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-foreground-muted hover:text-foreground hover:bg-surface-elevated"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-colors",
                isActive && "text-primary"
              )} />
              {!collapsed && (
                <span className="font-medium">{item.name}</span>
              )}
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute right-2 w-2 h-2 bg-primary rounded-full" />
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-card-border">
                  {item.name}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-card-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full p-2 text-foreground-muted hover:text-foreground hover:bg-surface-elevated rounded-xl transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <div className="flex items-center gap-3">
              <ChevronLeft className="h-5 w-5" />
              <span className="font-medium">Réduire</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
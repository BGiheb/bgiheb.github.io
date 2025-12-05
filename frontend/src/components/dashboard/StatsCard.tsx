import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
  className?: string;
}

export const StatsCard = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  className
}: StatsCardProps) => {
  return (
    <Card className={cn("interactive border-card-border", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm text-foreground-muted font-medium">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="p-3 bg-gradient-primary rounded-xl">
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-1">
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium",
            trend === "up" ? "text-success" : "text-destructive"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              trend === "up" ? "bg-success" : "bg-destructive"
            )} />
            {change}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
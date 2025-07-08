import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, MessageSquare, Download, BarChart3, Users } from "lucide-react";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/messages",
    label: "Messages",
    icon: MessageSquare,
  },
  {
    href: "/admin/downloads",
    label: "Downloads",
    icon: Download,
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
  },
];

export function AdminNav() {
  const [location] = useLocation();
  // Navigation includes Users menu item

  return (
    <div className="bg-purple-700 border-t border-purple-500 py-2">
      <div className="max-w-md mx-auto px-2">
        <nav className="flex space-x-1 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-1 px-3 py-2 rounded text-xs font-medium transition-colors whitespace-nowrap min-w-fit",
                  isActive
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-purple-100 hover:text-white hover:bg-purple-600"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
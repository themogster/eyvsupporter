import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, MessageSquare, Download, BarChart3, Home } from "lucide-react";

const navItems = [
  {
    href: "/",
    label: "Main App",
    icon: Home,
  },
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
];

export function AdminNav() {
  const [location] = useLocation();

  return (
    <div className="bg-purple-800 border-t border-purple-600">
      <div className="max-w-md mx-auto">
        <nav className="flex overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-1 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-purple-600 text-white border-b-2 border-white"
                    : "text-purple-200 hover:text-white hover:bg-purple-700"
                )}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
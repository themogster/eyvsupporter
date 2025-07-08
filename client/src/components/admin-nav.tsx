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
] as const;

export function AdminNav() {
  const [location] = useLocation();

  return (
    <div className="bg-purple-700 border-t border-purple-500 py-2">
      <div className="max-w-4xl mx-auto px-2">
        <nav className="flex space-x-1 overflow-x-auto scrollbar-hide justify-center">
          {/* Dashboard */}
          <Link
            href="/admin"
            className={cn(
              "flex items-center space-x-1 px-2 py-2 rounded text-xs font-medium transition-colors whitespace-nowrap min-w-fit",
              location === "/admin"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-purple-100 hover:text-white hover:bg-purple-600"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          {/* Messages */}
          <Link
            href="/admin/messages"
            className={cn(
              "flex items-center space-x-1 px-2 py-2 rounded text-xs font-medium transition-colors whitespace-nowrap min-w-fit",
              location === "/admin/messages"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-purple-100 hover:text-white hover:bg-purple-600"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Messages</span>
          </Link>

          {/* Downloads */}
          <Link
            href="/admin/downloads"
            className={cn(
              "flex items-center space-x-1 px-2 py-2 rounded text-xs font-medium transition-colors whitespace-nowrap min-w-fit",
              location === "/admin/downloads"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-purple-100 hover:text-white hover:bg-purple-600"
            )}
          >
            <Download className="w-4 h-4" />
            <span>Downloads</span>
          </Link>

          {/* Analytics */}
          <Link
            href="/admin/analytics"
            className={cn(
              "flex items-center space-x-1 px-2 py-2 rounded text-xs font-medium transition-colors whitespace-nowrap min-w-fit",
              location === "/admin/analytics"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-purple-100 hover:text-white hover:bg-purple-600"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </Link>

          {/* Users */}
          <Link
            href="/admin/users"
            className={cn(
              "flex items-center space-x-1 px-2 py-2 rounded text-xs font-medium transition-colors whitespace-nowrap min-w-fit",
              location === "/admin/users"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-purple-100 hover:text-white hover:bg-purple-600"
            )}
          >
            <Users className="w-4 h-4" />
            <span>Users</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
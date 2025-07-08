import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, MessageSquare, Download, BarChart3, Users } from "lucide-react";

export function AdminNav() {
  const [location] = useLocation();

  const linkClass = "flex items-center space-x-1 px-1 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0";
  const activeClass = "bg-white text-purple-700 shadow-sm";
  const inactiveClass = "text-purple-100 hover:text-white hover:bg-purple-600";

  return (
    <div className="bg-purple-700 border-t border-purple-500 py-2 w-full">
      <div className="container mx-auto px-2">
        <div className="flex justify-center">
          <nav className="flex space-x-0.5 overflow-x-auto" style={{ maxWidth: "100vw", minWidth: "100%" }}>
            <Link
              href="/admin"
              className={cn(linkClass, location === "/admin" ? activeClass : inactiveClass)}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/admin/messages"
              className={cn(linkClass, location === "/admin/messages" ? activeClass : inactiveClass)}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
            </Link>

            <Link
              href="/admin/downloads"
              className={cn(linkClass, location === "/admin/downloads" ? activeClass : inactiveClass)}
            >
              <Download className="w-4 h-4" />
              <span>Downloads</span>
            </Link>

            <Link
              href="/admin/analytics"
              className={cn(linkClass, location === "/admin/analytics" ? activeClass : inactiveClass)}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </Link>

            <Link
              href="/admin/users"
              className={cn(linkClass, location === "/admin/users" ? activeClass : inactiveClass)}
            >
              <Users className="w-4 h-4" />
              <span>Users</span>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
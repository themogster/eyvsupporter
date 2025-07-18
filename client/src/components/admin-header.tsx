import { Link, useLocation } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, MessageSquare, Download, BarChart3, Users, User, LogOut, Settings, ChevronDown, Sun, Moon, Key } from "lucide-react";
import { useAuth } from "@/hooks/use-new-auth";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChangePasswordModal } from "./change-password-modal";

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

export function AdminHeader() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex w-8 h-8 bg-purple-600 rounded-lg items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">EYV Admin</h1>
              <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">Management Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Navigation Menu */}
            <nav className="flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-purple-600" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <User className="mr-2 h-3 w-3" />
                    <span className="truncate">{user?.email}</span>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 ml-5">
                    Role: {user?.role}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsChangePasswordOpen(true)}>
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                  {theme === "light" ? (
                    <Moon className="w-4 h-4 mr-2" />
                  ) : (
                    <Sun className="w-4 h-4 mr-2" />
                  )}
                  {theme === "light" ? "Switch to dark" : "Switch to light"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {logoutMutation.isPending ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {user && (
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          userEmail={user.email}
        />
      )}
    </div>
  );
}
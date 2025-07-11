import { useState } from "react";
import { Settings, Moon, Sun, LogIn, LogOut, User, Shield, Key, HelpCircle } from "lucide-react";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-new-auth";
import { NewAuthModal } from "./new-auth-modal";
import { ChangePasswordModal } from "./change-password-modal";
import { HelpModal } from "./help-modal";

export function SettingsDropdown() {
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, logoutMutation } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const handleThemeToggle = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleAdminDashboard = () => {
    setLocation("/admin");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
          {/* Theme Toggle */}
          <DropdownMenuItem
            onClick={handleThemeToggle}
            className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {theme === "light" ? (
              <>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark mode</span>
              </>
            ) : (
              <>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light mode</span>
              </>
            )}
          </DropdownMenuItem>

          {/* Help */}
          <DropdownMenuItem
            onClick={() => setIsHelpModalOpen(true)}
            className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>How to Use</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-600" />

          {/* Authentication Section */}
          {user ? (
            <>
              {/* User Info */}
              <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <User className="mr-2 h-3 w-3" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 ml-5">
                  Role: {user.role}
                </div>
              </div>

              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-600" />

              {/* Change Password */}
              <DropdownMenuItem
                onClick={() => setIsChangePasswordOpen(true)}
                className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Key className="mr-2 h-4 w-4" />
                <span>Change Password</span>
              </DropdownMenuItem>

              {/* Admin Dashboard (if admin) */}
              {user.role === 'admin' && (
                <DropdownMenuItem
                  onClick={handleAdminDashboard}
                  className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Admin Dashboard</span>
                </DropdownMenuItem>
              )}

              {/* Logout */}
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{logoutMutation.isPending ? "Logging out..." : "Logout"}</span>
              </DropdownMenuItem>
            </>
          ) : (
            /* Login */
            <DropdownMenuItem
              onClick={() => setIsAuthModalOpen(true)}
              className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <LogIn className="mr-2 h-4 w-4" />
              <span>Login / Register</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Auth Modal */}
      <NewAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Change Password Modal */}
      {user && (
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          userEmail={user.email}
        />
      )}

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </>
  );
}
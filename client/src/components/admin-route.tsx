import { useAuth } from "@/hooks/use-new-auth";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

import { useEffect } from "react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuth();

  // Always call useEffect at the top level
  useEffect(() => {
    if (user && user.role !== 'admin') {
      console.error('Access restricted: Admin access required');
    }
  }, [user]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-deep-purple" />
      </div>
    );
  }

  // If not authenticated, redirect to main app
  if (!user) {
    return <Redirect to="/" />;
  }

  // If user doesn't have admin role, redirect to main app
  if (user.role !== 'admin') {
    return <Redirect to="/" />;
  }

  // User is authenticated and has admin role
  return <>{children}</>;
}
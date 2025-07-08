import { useAuth } from "@/hooks/use-new-auth";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

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

  // If user doesn't have admin role, show message and redirect to main app
  if (user.role !== 'admin') {
    useEffect(() => {
      toast({
        title: "Access Restricted",
        description: "Admin access required. Contact an administrator to upgrade your account.",
        variant: "destructive",
      });
    }, [toast]);
    
    return <Redirect to="/" />;
  }

  // User is authenticated and has admin role
  return <>{children}</>;
}
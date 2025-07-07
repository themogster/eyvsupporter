import { createContext, ReactNode, useContext, useState } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { AdminLogin, AdminRegisterEmail, AdminSetPassword, VerifyTwoFactor } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AdminUser = {
  id: number;
  email: string;
};

type AdminAuthContextType = {
  user: AdminUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<any, Error, AdminLogin>;
  registerMutation: UseMutationResult<any, Error, AdminRegisterEmail>;
  setPasswordMutation: UseMutationResult<any, Error, AdminSetPassword>;
  verifyLoginMutation: UseMutationResult<any, Error, VerifyTwoFactor>;
  verifyRegistrationMutation: UseMutationResult<any, Error, VerifyTwoFactor>;
  logoutMutation: UseMutationResult<any, Error, void>;
  pendingEmail: string | null;
  setPendingEmail: (email: string | null) => void;
  isLoginPending: boolean;
  isRegistrationPending: boolean;
  isEmailVerified: boolean;
  setIsEmailVerified: (verified: boolean) => void;
};

export const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<AdminUser | undefined, Error>({
    queryKey: ["/api/admin/user"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/user");
        const data = await res.json();
        return data.user;
      } catch (error: any) {
        if (error.status === 401) {
          return null;
        }
        throw error;
      }
    },
  });

  // State for tracking pending operations
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [isLoginPending, setIsLoginPending] = useState(false);
  const [isRegistrationPending, setIsRegistrationPending] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (credentials: AdminLogin) => {
      const res = await apiRequest("POST", "/api/admin/login", credentials);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.user) {
        queryClient.setQueryData(["/api/admin/user"], data.user);
        toast({
          title: "Login successful",
          description: data.message,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: AdminRegisterEmail) => {
      const res = await apiRequest("POST", "/api/admin/register", credentials);
      const data = await res.json();
      setPendingEmail(credentials.email);
      setIsRegistrationPending(true);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Verification code sent",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
      setIsRegistrationPending(false);
    },
  });

  const setPasswordMutation = useMutation({
    mutationFn: async (credentials: AdminSetPassword) => {
      const res = await apiRequest("POST", "/api/admin/set-password", credentials);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/admin/user"], data.user);
      setPendingEmail(null);
      setIsRegistrationPending(false);
      setIsEmailVerified(false);
      toast({
        title: "Registration Complete",
        description: "Your admin account has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password setup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyLoginMutation = useMutation({
    mutationFn: async (verificationData: VerifyTwoFactor) => {
      const res = await apiRequest("POST", "/api/admin/verify-login", verificationData);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/admin/user"], data.user);
      setPendingEmail(null);
      setIsLoginPending(false);
      toast({
        title: "Login successful",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyRegistrationMutation = useMutation({
    mutationFn: async (verificationData: VerifyTwoFactor) => {
      const res = await apiRequest("POST", "/api/admin/verify-registration", verificationData);
      return await res.json();
    },
    onSuccess: (data) => {
      setIsEmailVerified(true);
      toast({
        title: "Email verified",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/logout");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/admin/user"], null);
      setPendingEmail(null);
      setIsLoginPending(false);
      setIsRegistrationPending(false);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AdminAuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        registerMutation,
        setPasswordMutation,
        verifyLoginMutation,
        verifyRegistrationMutation,
        logoutMutation,
        pendingEmail,
        setPendingEmail,
        isLoginPending,
        isRegistrationPending,
        isEmailVerified,
        setIsEmailVerified,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
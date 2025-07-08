import { createContext, ReactNode, useContext, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { RegisterStepOne, RegisterStepTwo, RegisterStepThree, AdminLogin, AdminUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: AdminUser | null;
  isLoading: boolean;
  error: Error | null;
  
  // Registration state
  registrationStep: number;
  pendingEmail: string | null;
  
  // Step 1: Email submission
  registerStep1Mutation: UseMutationResult<any, Error, RegisterStepOne>;
  
  // Step 2: 2FA verification
  registerStep2Mutation: UseMutationResult<any, Error, RegisterStepTwo>;
  
  // Step 3: Password setup
  registerStep3Mutation: UseMutationResult<any, Error, RegisterStepThree>;
  
  // Login
  loginMutation: UseMutationResult<any, Error, AdminLogin>;
  
  // Logout
  logoutMutation: UseMutationResult<any, Error, void>;
  
  // State management
  setRegistrationStep: (step: number) => void;
  setPendingEmail: (email: string | null) => void;
  resetRegistration: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [registrationStep, setRegistrationStep] = useState(0);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<AdminUser | undefined, Error>({
    queryKey: ["/api/admin/user"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/user");
      if (res.status === 401) return null;
      return await res.json();
    },
  });

  const registerStep1Mutation = useMutation({
    mutationFn: async (data: RegisterStepOne) => {
      const res = await apiRequest("POST", "/api/register/step1", data);
      return await res.json();
    },
    onSuccess: (data, variables) => {
      setPendingEmail(variables.email);
      setRegistrationStep(2);
      toast({
        title: "Code sent",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerStep2Mutation = useMutation({
    mutationFn: async (data: RegisterStepTwo) => {
      const res = await apiRequest("POST", "/api/register/step2", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setRegistrationStep(3);
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

  const registerStep3Mutation = useMutation({
    mutationFn: async (data: RegisterStepThree) => {
      const res = await apiRequest("POST", "/api/register/step3", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/admin/user"], data.user);
      resetRegistration();
      toast({
        title: "Registration complete",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: AdminLogin) => {
      const res = await apiRequest("POST", "/api/admin/login", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/admin/user"], data.user);
      toast({
        title: "Login successful",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest("POST", "/api/admin/logout");
        return await res.json();
      } catch (error) {
        // If the request fails, still clear the user data locally
        console.log('Logout request failed, clearing local data:', error);
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/admin/user"], null);
      resetRegistration();
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

  const resetRegistration = () => {
    setRegistrationStep(0);
    setPendingEmail(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        registrationStep,
        pendingEmail,
        registerStep1Mutation,
        registerStep2Mutation,
        registerStep3Mutation,
        loginMutation,
        logoutMutation,
        setRegistrationStep,
        setPendingEmail,
        resetRegistration,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
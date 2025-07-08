import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, User, Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { RegisterStepOne, RegisterStepTwo, RegisterStepThree, AdminLogin, registerStepOneSchema, registerStepTwoSchema, registerStepThreeSchema, adminLoginSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-new-auth";

interface NewAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewAuthModal({ isOpen, onClose }: NewAuthModalProps) {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const {
    user,
    registrationStep,
    pendingEmail,
    registerStep1Mutation,
    registerStep2Mutation,
    registerStep3Mutation,
    loginMutation,
    logoutMutation,
    resetRegistration,
    setRegistrationStep,
  } = useAuth();

  // Forms for each step
  const loginForm = useForm<AdminLogin>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const step1Form = useForm<RegisterStepOne>({
    resolver: zodResolver(registerStepOneSchema),
    defaultValues: { email: "" },
  });

  const step2Form = useForm<RegisterStepTwo>({
    resolver: zodResolver(registerStepTwoSchema),
    defaultValues: { email: "", token: "" },
  });

  const step3Form = useForm<RegisterStepThree>({
    resolver: zodResolver(registerStepThreeSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  // Auto-populate email in forms
  useEffect(() => {
    if (pendingEmail) {
      step2Form.setValue("email", pendingEmail);
      step3Form.setValue("email", pendingEmail);
    }
  }, [pendingEmail, step2Form, step3Form]);

  // Only close modal after successful login/registration actions
  // Don't auto-close just because user exists - show user profile instead

  // Handle form submissions
  const handleLogin = async (data: AdminLogin) => {
    try {
      await loginMutation.mutateAsync(data);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleStep1 = async (data: RegisterStepOne) => {
    try {
      await registerStep1Mutation.mutateAsync(data);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleStep2 = async (data: RegisterStepTwo) => {
    try {
      await registerStep2Mutation.mutateAsync(data);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleStep3 = async (data: RegisterStepThree) => {
    try {
      await registerStep3Mutation.mutateAsync(data);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleModalClose = () => {
    resetRegistration();
    setIsLogin(true);
    onClose();
  };

  const switchToRegistration = () => {
    setIsLogin(false);
    resetRegistration();
    // Ensure we start at step 0 for registration
    if (registrationStep === 0) {
      // No action needed, already at step 0
    }
  };

  const switchToLogin = () => {
    setIsLogin(true);
    resetRegistration();
  };

  const getTitle = () => {
    if (user) return "Account";
    if (isLogin) return "Sign In";
    switch (registrationStep) {
      case 1: return "Enter Email";
      case 2: return "Verify Email";
      case 3: return "Set Password";
      default: return "Create Account";
    }
  };

  const getDescription = () => {
    if (user) return "Manage your account settings";
    if (isLogin) return "Sign in to access your account";
    switch (registrationStep) {
      case 1: return "We'll send you a verification code";
      case 2: return `Enter the 6-digit code sent to ${pendingEmail}`;
      case 3: return "Create a secure password for your account";
      default: return "Create a new account to get started";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-deep-purple" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {user ? (
            // User Profile - Already Logged In
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-deep-purple/10 rounded-full mx-auto">
                <User className="w-8 h-8 text-deep-purple" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Welcome back!</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-xs text-gray-400 mt-1">Role: {user.role}</p>
              </div>
              <div className="space-y-2">
                {user.role === 'admin' && (
                  <Button
                    onClick={() => {
                      setLocation("/admin");
                      onClose();
                    }}
                    className="w-full bg-deep-purple hover:bg-purple-700"
                  >
                    Go to Admin Dashboard
                  </Button>
                )}
                <Button
                  onClick={() => {
                    logoutMutation.mutate();
                    onClose();
                  }}
                  variant="outline"
                  className="w-full"
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? "Logging out..." : "Logout"}
                </Button>
              </div>
            </div>
          ) : isLogin ? (
            // Login Form
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter your password"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-deep-purple hover:bg-purple-700"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </Form>
          ) : (
            // Registration Flow
            <>
              {registrationStep === 0 && (
                <div className="text-center">
                  <User className="w-12 h-12 text-deep-purple mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Ready to create your account?</p>
                  <Button
                    onClick={() => setRegistrationStep(1)}
                    className="w-full bg-deep-purple hover:bg-purple-700"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {registrationStep === 1 && (
                <Form {...step1Form}>
                  <form onSubmit={step1Form.handleSubmit(handleStep1)} className="space-y-4">
                    <FormField
                      control={step1Form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                {...field}
                                type="email"
                                placeholder="Enter your email"
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-deep-purple hover:bg-purple-700"
                      disabled={registerStep1Mutation.isPending}
                    >
                      {registerStep1Mutation.isPending ? "Sending..." : "Send Verification Code"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </Form>
              )}

              {registrationStep === 2 && (
                <Form {...step2Form}>
                  <form onSubmit={step2Form.handleSubmit(handleStep2)} className="space-y-4">
                    <FormField
                      control={step2Form.control}
                      name="token"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verification Code</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter 6-digit code"
                              className="text-center text-lg tracking-widest"
                              maxLength={6}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-deep-purple hover:bg-purple-700"
                      disabled={registerStep2Mutation.isPending}
                    >
                      {registerStep2Mutation.isPending ? "Verifying..." : "Verify Code"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </Form>
              )}

              {registrationStep === 3 && (
                <Form {...step3Form}>
                  <form onSubmit={step3Form.handleSubmit(handleStep3)} className="space-y-4">
                    <FormField
                      control={step3Form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                {...field}
                                type="password"
                                placeholder="Create password (min 8 characters)"
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={step3Form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                {...field}
                                type="password"
                                placeholder="Confirm your password"
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-deep-purple hover:bg-purple-700"
                      disabled={registerStep3Mutation.isPending}
                    >
                      {registerStep3Mutation.isPending ? "Creating Account..." : "Complete Registration"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </Form>
              )}
            </>
          )}

          {/* Switch between login and registration */}
          <div className="flex items-center justify-between pt-4 border-t">
            {isLogin ? (
              <button
                onClick={switchToRegistration}
                className="text-sm text-deep-purple hover:underline"
              >
                Don't have an account? Sign up
              </button>
            ) : (
              <button
                onClick={switchToLogin}
                className="text-sm text-deep-purple hover:underline flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
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
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { z } from "zod";
import { useAuth } from "@/hooks/use-new-auth";

interface NewAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewAuthModal({ isOpen, onClose }: NewAuthModalProps) {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'verify' | 'password'>('email');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
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

  // Forgot password forms
  const forgotEmailForm = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email: z.string().email("Invalid email") })),
    defaultValues: { email: "" },
  });

  const forgotVerifyForm = useForm<{ token: string }>({
    resolver: zodResolver(z.object({ token: z.string().min(6, "Code must be 6 digits") })),
    defaultValues: { token: "" },
  });

  const forgotPasswordForm = useForm<{ password: string; confirmPassword: string }>({
    resolver: zodResolver(z.object({
      password: z.string().min(12, "Password must be at least 12 characters"),
      confirmPassword: z.string()
    }).refine(data => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"]
    })),
    defaultValues: { password: "", confirmPassword: "" },
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
      const result = await loginMutation.mutateAsync(data);
      // Close modal after successful login
      onClose();
      // Redirect admin users to dashboard
      if (result?.user?.role === 'admin') {
        setLocation("/admin");
      }
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
      const result = await registerStep3Mutation.mutateAsync(data);
      // Registration complete, user is now logged in
      // Close modal after successful registration
      onClose();
      // Redirect admin users to dashboard
      if (result?.user?.role === 'admin') {
        setLocation("/admin");
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Forgot password mutations
  const requestResetMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/admin/request-password-reset", { email });
      return await res.json();
    },
    onSuccess: () => {
      setForgotPasswordStep('verify');
    },
    onError: (error: any) => {
    },
  });

  const verifyResetMutation = useMutation({
    mutationFn: async ({ email, token }: { email: string; token: string }) => {
      const res = await apiRequest("POST", "/api/admin/verify-password-reset", { email, token });
      return await res.json();
    },
    onSuccess: () => {
      setForgotPasswordStep('password');
    },
    onError: (error: any) => {
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ email, newPassword }: { email: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/admin/reset-password", { email, newPassword });
      return await res.json();
    },
    onSuccess: () => {
      // Reset forgot password state and return to login
      setShowForgotPassword(false);
      setForgotPasswordStep('email');
      setForgotPasswordEmail('');
      forgotEmailForm.reset();
      forgotVerifyForm.reset();
      forgotPasswordForm.reset();
    },
    onError: (error: any) => {
    },
  });

  // Forgot password handlers
  const handleForgotEmail = async (data: { email: string }) => {
    setForgotPasswordEmail(data.email);
    await requestResetMutation.mutateAsync(data.email);
  };

  const handleForgotVerify = async (data: { token: string }) => {
    await verifyResetMutation.mutateAsync({ 
      email: forgotPasswordEmail, 
      token: data.token 
    });
  };

  const handleForgotPassword = async (data: { password: string }) => {
    await resetPasswordMutation.mutateAsync({ 
      email: forgotPasswordEmail, 
      newPassword: data.password 
    });
  };

  const handleModalClose = () => {
    resetRegistration();
    setIsLogin(true);
    setShowForgotPassword(false);
    setForgotPasswordStep('email');
    setForgotPasswordEmail('');
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
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600">
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
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Welcome back!</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Role: {user.role}</p>
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
                
                {/* Forgot Password Link */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-deep-purple hover:text-purple-700 hover:underline"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            </Form>
          ) : (
            // Registration Flow
            <>
              {registrationStep === 0 && (
                <div className="text-center">
                  <User className="w-12 h-12 text-deep-purple mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Ready to create your account?</p>
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

          {/* Forgot Password Flow */}
          {showForgotPassword && (
            <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg p-6 z-10">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Reset Password
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {forgotPasswordStep === 'email' && "Enter your email to receive a reset code"}
                    {forgotPasswordStep === 'verify' && "Enter the verification code sent to your email"}
                    {forgotPasswordStep === 'password' && "Create your new password"}
                  </p>
                </div>

                {forgotPasswordStep === 'email' && (
                  <Form {...forgotEmailForm}>
                    <form onSubmit={forgotEmailForm.handleSubmit(handleForgotEmail)} className="space-y-4">
                      <FormField
                        control={forgotEmailForm.control}
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
                        disabled={requestResetMutation.isPending}
                      >
                        {requestResetMutation.isPending ? "Sending..." : "Send Reset Code"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </form>
                  </Form>
                )}

                {forgotPasswordStep === 'verify' && (
                  <Form {...forgotVerifyForm}>
                    <form onSubmit={forgotVerifyForm.handleSubmit(handleForgotVerify)} className="space-y-4">
                      <FormField
                        control={forgotVerifyForm.control}
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
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => requestResetMutation.mutate(forgotPasswordEmail)}
                          disabled={requestResetMutation.isPending}
                          className="flex-1"
                        >
                          Resend Code
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-deep-purple hover:bg-purple-700"
                          disabled={verifyResetMutation.isPending}
                        >
                          {verifyResetMutation.isPending ? "Verifying..." : "Verify"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}

                {forgotPasswordStep === 'password' && (
                  <Form {...forgotPasswordForm}>
                    <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                      <FormField
                        control={forgotPasswordForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                  {...field}
                                  type="password"
                                  placeholder="Enter new password"
                                  className="pl-10"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={forgotPasswordForm.control}
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
                                  placeholder="Confirm new password"
                                  className="pl-10"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Password must be at least 12 characters with uppercase, lowercase, number, and symbol.
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-deep-purple hover:bg-purple-700"
                        disabled={resetPasswordMutation.isPending}
                      >
                        {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </form>
                  </Form>
                )}

                {/* Back to Login */}
                <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordStep('email');
                      setForgotPasswordEmail('');
                      forgotEmailForm.reset();
                      forgotVerifyForm.reset();
                      forgotPasswordForm.reset();
                    }}
                    className="text-sm text-deep-purple hover:underline flex items-center justify-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Sign In
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Switch between login and registration */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
            {isLogin && !showForgotPassword ? (
              <button
                onClick={switchToRegistration}
                className="text-sm text-deep-purple hover:underline"
              >
                Don't have an account? Sign up
              </button>
            ) : !showForgotPassword ? (
              <button
                onClick={switchToLogin}
                className="text-sm text-deep-purple hover:underline flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Sign In
              </button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
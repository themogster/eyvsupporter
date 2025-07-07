import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdminLogin, AdminRegisterEmail, AdminSetPassword, VerifyTwoFactor, adminLoginSchema, adminRegisterEmailSchema, adminSetPasswordSchema, verifyTwoFactorSchema } from "@shared/schema";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, Shield } from "lucide-react";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [, setLocation] = useLocation();
  const {
    loginMutation,
    registerMutation,
    verifyLoginMutation,
    verifyRegistrationMutation,
    pendingEmail,
    isLoginPending,
    isRegistrationPending,
    user,
  } = useAdminAuth();

  // Login form
  const loginForm = useForm<AdminLogin>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<AdminRegisterEmail>({
    resolver: zodResolver(adminRegisterEmailSchema),
    defaultValues: {
      email: "",
    },
  });

  // 2FA verification form
  const verifyForm = useForm<Pick<VerifyTwoFactor, 'token'>>({
    resolver: zodResolver(verifyTwoFactorSchema.pick({ token: true })),
    defaultValues: {
      token: "",
    },
  });

  const onLoginSubmit = async (data: AdminLogin) => {
    await loginMutation.mutateAsync(data);
  };

  const onRegisterSubmit = async (data: AdminRegister) => {
    await registerMutation.mutateAsync(data);
  };

  const onVerifySubmit = async (data: Pick<VerifyTwoFactor, 'token'>) => {
    if (!pendingEmail) return;

    const verificationData: VerifyTwoFactor = {
      email: pendingEmail,
      token: data.token,
      type: isLoginPending ? 'login' : 'registration',
    };

    if (isLoginPending) {
      await verifyLoginMutation.mutateAsync(verificationData);
    } else if (isRegistrationPending) {
      await verifyRegistrationMutation.mutateAsync(verificationData);
    }
  };

  // Close modal and redirect when user is authenticated
  useEffect(() => {
    if (user) {
      onClose();
      setLocation("/admin");
    }
  }, [user, onClose, setLocation]);

  const showVerification = isLoginPending || isRegistrationPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-deep-purple" />
            {showVerification ? "Verify Your Email" : "Admin Access"}
          </DialogTitle>
          <DialogDescription>
            {showVerification
              ? `Enter the 6-digit code sent to ${pendingEmail}`
              : "Sign in or register for admin access"}
          </DialogDescription>
        </DialogHeader>

        {showVerification ? (
          <Form {...verifyForm}>
            <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-4">
              <FormField
                control={verifyForm.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        className="text-center text-lg tracking-widest"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-deep-purple hover:bg-purple-700"
                disabled={verifyLoginMutation.isPending || verifyRegistrationMutation.isPending}
              >
                {verifyLoginMutation.isPending || verifyRegistrationMutation.isPending
                  ? "Verifying..."
                  : "Verify Code"}
              </Button>
            </form>
          </Form>
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input {...field} type="email" placeholder="admin@example.com" className="pl-10" />
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
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input {...field} type="password" placeholder="Enter password" className="pl-10" />
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
                    {loginMutation.isPending ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input {...field} type="email" placeholder="admin@example.com" className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input {...field} type="password" placeholder="Minimum 8 characters" className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input {...field} type="password" placeholder="Confirm password" className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-deep-purple hover:bg-purple-700"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
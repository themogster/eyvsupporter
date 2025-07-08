import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, Check, X, Mail, Lock, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

type Step = 'email' | 'verify' | 'password';

interface PasswordStrength {
  score: number;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    symbol: boolean;
  };
}

export function ChangePasswordModal({ isOpen, onClose, userEmail }: ChangePasswordModalProps) {
  const [step, setStep] = useState<Step>('email');
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Send 2FA code mutation
  const send2FAMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/request-password-change", { email: userEmail });
      return await res.json();
    },
    onSuccess: () => {
      setStep('verify');
      toast({
        title: "Verification Code Sent",
        description: "Check your email for the verification code",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify 2FA code mutation
  const verify2FAMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/admin/verify-password-change", { 
        email: userEmail, 
        token: code 
      });
      return await res.json();
    },
    onSuccess: () => {
      setStep('password');
      toast({
        title: "Code Verified",
        description: "Now set your new password",
      });
    },
    onError: (error) => {
      toast({
        title: "Invalid Code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/change-password", {
        email: userEmail,
        newPassword: newPassword
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const checkPasswordStrength = (password: string): PasswordStrength => {
    const requirements = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    const score = Object.values(requirements).filter(Boolean).length;
    return { score, requirements };
  };

  const passwordStrength = checkPasswordStrength(newPassword);
  const isPasswordStrong = passwordStrength.score === 5;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleClose = () => {
    setStep('email');
    setVerificationCode("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const handleSend2FA = () => {
    send2FAMutation.mutate();
  };

  const handleVerifyCode = () => {
    if (!verificationCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }
    verify2FAMutation.mutate(verificationCode);
  };

  const handleChangePassword = () => {
    if (!isPasswordStrong) {
      toast({
        title: "Weak Password",
        description: "Please ensure your password meets all security requirements",
        variant: "destructive",
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: "Passwords Don't Match",
        description: "Please ensure both password fields match",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate();
  };

  const getStepProgress = () => {
    switch (step) {
      case 'email': return 33;
      case 'verify': return 66;
      case 'password': return 100;
      default: return 0;
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score < 3) return 'bg-red-500';
    if (passwordStrength.score < 5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Secure your account by updating your password with 2FA verification
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {step === 'email' ? 1 : step === 'verify' ? 2 : 3} of 3</span>
              <span>{getStepProgress()}%</span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
          </div>

          {/* Step 1: Email Confirmation */}
          {step === 'email' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="w-4 h-4" />
                  Email Verification
                </CardTitle>
                <CardDescription>
                  We'll send a verification code to your email address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email Address</Label>
                  <Input value={userEmail} disabled className="bg-muted" />
                </div>
                <Button 
                  onClick={handleSend2FA} 
                  disabled={send2FAMutation.isPending}
                  className="w-full"
                >
                  {send2FAMutation.isPending ? "Sending..." : "Send Verification Code"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: 2FA Verification */}
          {step === 'verify' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="w-4 h-4" />
                  Enter Verification Code
                </CardTitle>
                <CardDescription>
                  Check your email for the 6-digit verification code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="text-center text-lg tracking-wider"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleSend2FA}
                    disabled={send2FAMutation.isPending}
                    className="flex-1"
                  >
                    Resend Code
                  </Button>
                  <Button 
                    onClick={handleVerifyCode}
                    disabled={verify2FAMutation.isPending || !verificationCode.trim()}
                    className="flex-1"
                  >
                    {verify2FAMutation.isPending ? "Verifying..." : "Verify"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: New Password */}
          {step === 'password' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lock className="w-4 h-4" />
                  Set New Password
                </CardTitle>
                <CardDescription>
                  Create a strong password that meets all security requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Password Strength:</span>
                      <div className={`h-2 w-20 rounded-full ${getPasswordStrengthColor()}`}>
                        <div 
                          className="h-full bg-current rounded-full transition-all"
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      {Object.entries(passwordStrength.requirements).map(([key, met]) => (
                        <div key={key} className={`flex items-center gap-1 ${met ? 'text-green-600' : 'text-red-500'}`}>
                          {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          <span>
                            {key === 'length' && 'At least 12 characters'}
                            {key === 'uppercase' && 'One uppercase letter'}
                            {key === 'lowercase' && 'One lowercase letter'}
                            {key === 'number' && 'One number'}
                            {key === 'symbol' && 'One symbol'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {confirmPassword && (
                    <div className={`flex items-center gap-1 text-xs mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                      {passwordsMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleChangePassword}
                  disabled={changePasswordMutation.isPending || !isPasswordStrong || !passwordsMatch}
                  className="w-full"
                >
                  {changePasswordMutation.isPending ? "Updating Password..." : "Update Password"}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {step !== 'email' && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  if (step === 'verify') setStep('email');
                  if (step === 'password') setStep('verify');
                }}
              >
                Back
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
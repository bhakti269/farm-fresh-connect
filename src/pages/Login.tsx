import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowRight, Sprout, Loader2, Mail, Smartphone, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const isEmail = (value: string) => value.trim().includes("@");

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signInWithOtpEmail, signInWithOtpPhone, verifyOtpPhone, signInWithGoogle, loading: authLoading } = useAuth();
  const [mobileOrEmail, setMobileOrEmail] = useState("");
  const [otpSent, setOtpSent] = useState<"email" | "phone" | null>(null);
  const [phoneForVerify, setPhoneForVerify] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      if (!user) return;

      const fromState = location.state as { from?: string; fromSell?: boolean; businessDetails?: unknown } | null;
      const cameFromFarmerRegister = fromState?.from === "/farmer-register" || fromState?.fromSell;

      // If they came from farmer-register (e.g. to complete seller registration), send them back there with state
      if (cameFromFarmerRegister) {
        navigate("/farmer-register", { state: location.state, replace: true });
        return;
      }

      // If they came from farmer-dashboard (e.g. not logged in), send them there after login
      if (fromState?.from === "/farmer-dashboard") {
        navigate("/farmer-dashboard", { replace: true });
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleData?.role === "farmer") {
        navigate("/farmer-dashboard", { replace: true });
      } else {
        navigate("/consumer-dashboard", { replace: true });
      }
    };

    checkRoleAndRedirect();
  }, [user, navigate, location.state]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = mobileOrEmail.trim();
    if (!value) {
      toast.error("Enter your Mobile Number or Email ID");
      return;
    }

    setIsLoading(true);
    setOtpSent(null);

    if (isEmail(value)) {
      const { error } = await signInWithOtpEmail(value);
      setIsLoading(false);
      if (error) {
        toast.error(error.message || "Failed to send link. Try again.");
        return;
      }
      setOtpSent("email");
      toast.success("Check your email for a one-time link to sign in.");
    } else {
      const { error } = await signInWithOtpPhone(value);
      setIsLoading(false);
      if (error) {
        toast.error(error.message || "Failed to send OTP. Try again.");
        return;
      }
      setOtpSent("phone");
      setPhoneForVerify(value);
      toast.success("OTP sent to your mobile. Enter it below.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error("Enter the OTP you received");
      return;
    }
    setIsVerifyLoading(true);
    const { error } = await verifyOtpPhone(phoneForVerify, otp);
    setIsVerifyLoading(false);
    if (error) {
      toast.error(error.message || "Invalid OTP. Try again.");
      return;
    }
    toast.success("Signed in successfully!");
  };

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message || "Google sign-in failed.");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-20 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gradient-hero flex items-center justify-center">
              <Sprout className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-serif text-2xl font-bold text-foreground">FarmFresh</span>
          </Link>

          {/* How to Login */}
          <Card className="shadow-md border-border bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                How to Login
              </CardTitle>
              <CardDescription>
                The login process uses Two-Factor Authentication (2FA) for security.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p><strong className="text-foreground">Step 1:</strong> Click &quot;Sign In&quot; at the top right.</p>
              <p><strong className="text-foreground">Step 2:</strong> Enter your Mobile Number or Email ID.</p>
              <p><strong className="text-foreground">Step 3:</strong> You will receive a One-Time Password (OTP). Enter it to gain access.</p>
              <p><strong className="text-foreground">Social Login:</strong> You can also use &quot;Sign in with Google&quot; for a faster experience.</p>
            </CardContent>
          </Card>

          {/* Sign In form */}
          <Card className="shadow-lg animate-fade-up">
            <CardHeader className="text-center">
              <CardTitle className="font-serif text-2xl">Sign In</CardTitle>
              <CardDescription>Enter your Mobile Number or Email ID to receive OTP</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobileOrEmail">Mobile Number or Email ID</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="mobileOrEmail"
                        type="text"
                        placeholder="e.g. +91 9876543210 or you@example.com"
                        value={mobileOrEmail}
                        onChange={(e) => setMobileOrEmail(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send OTP <ArrowRight className="w-5 h-5" /></>}
                  </Button>
                </form>
              ) : otpSent === "email" ? (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    We sent a one-time link to <strong className="text-foreground">{mobileOrEmail}</strong>. Click the link in that email to sign in.
                  </p>
                  <Button type="button" variant="outline" className="w-full" onClick={() => { setOtpSent(null); setMobileOrEmail(""); }}>
                    Use a different email
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        placeholder="6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="pl-10"
                        maxLength={6}
                        disabled={isVerifyLoading}
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isVerifyLoading}>
                    {isVerifyLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Sign In"}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => { setOtpSent(null); setOtp(""); setPhoneForVerify(""); }}>
                    Change number
                  </Button>
                </form>
              )}

              <div className="relative my-6">
                <span className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </span>
                <span className="relative flex justify-center text-xs uppercase text-muted-foreground bg-card px-2">or</span>
              </div>

              <Button type="button" variant="outline" size="lg" className="w-full gap-2" onClick={handleGoogleSignIn}>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </Button>

              <div className="text-center space-y-2 pt-2">
                <p className="text-sm text-muted-foreground">
                  New consumer?{" "}
                  <Link to="/consumer-register" className="text-primary hover:underline font-medium">
                    Register here
                  </Link>
                </p>
                <p className="text-sm text-muted-foreground">
                  Farmer?{" "}
                  <Link to="/sell" className="text-primary hover:underline font-medium">
                    Register to sell
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;

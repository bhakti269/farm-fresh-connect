import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ArrowRight, CheckCircle2, Crown, Shield, Gift, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";

const ConsumerRegister = () => {
  const navigate = useNavigate();
  const { user, signUp, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/consumer-dashboard");
    }
  }, [user, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check each required field individually and show specific error
    // Trim values to handle whitespace-only inputs
    if (!formData.fullName || !formData.fullName.trim()) {
      toast.error("Full Name is required");
      return;
    }
    
    if (!formData.email || !formData.email.trim()) {
      toast.error("Email Address is required");
      return;
    }
    
    // Basic email check - just ensure it contains @
    if (!formData.email.trim().includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (!formData.phone || !formData.phone.trim()) {
      toast.error("Phone Number is required");
      return;
    }
    
    if (!formData.password || !formData.password.trim()) {
      toast.error("Password is required");
      return;
    }
    
    if (formData.password.trim().length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    if (!formData.confirmPassword || !formData.confirmPassword.trim()) {
      toast.error("Please confirm your password");
      return;
    }
    
    if (formData.password.trim() !== formData.confirmPassword.trim()) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    const { data, error } = await signUp(formData.email, formData.password, formData.fullName, formData.phone);
    
    if (error) {
      setIsLoading(false);
      // Handle various Supabase error messages for better compatibility
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes("already registered") || 
          errorMessage.includes("user already registered") ||
          errorMessage.includes("email already in use") ||
          errorMessage.includes("already exists")) {
        toast.error("This email is already registered. Please use a different email or login instead.");
      } else if (errorMessage.includes("password")) {
        toast.error("Password must be at least 6 characters");
      } else if (errorMessage.includes("48 seconds") || 
                 errorMessage.includes("rate limit") || 
                 errorMessage.includes("security purposes") ||
                 errorMessage.includes("wait")) {
        // Suppress security/rate limit messages - show generic message instead
        toast.error("Please wait a moment and try again");
      } else {
        toast.error(error.message || "Registration failed. Please try again.");
      }
      return;
    }

    // Check if user needs email confirmation
    if (data?.needsEmailConfirmation) {
      setIsLoading(false);
      toast.error("Please check your email to confirm your account before logging in.");
      return;
    }

    // Wait a moment for auth state to update
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if user is now logged in (user state will be updated by auth context)
    setIsLoading(false);
    if (data?.user || data?.session) {
      setIsRegistered(true);
      toast.success("Registration successful! You are now logged in.");
      // Navigation will happen via useEffect when user state updates
    } else {
      setIsRegistered(true);
      toast.success("Registration successful! You can now login with your credentials.");
    }
  };

  const primeFeatures = [
    { icon: Crown, title: "Full Farmer Details", description: "Access complete contact information, address, and verified credentials" },
    { icon: Clock, title: "3-Day Purchase Window", description: "Connect with farmers within 3 days to complete your purchase" },
    { icon: Gift, title: "₹100 Cashback", description: "Get ₹100 refunded after successful purchase from admin" },
    { icon: Shield, title: "Verified Farmers", description: "All farmers are Aadhar verified for secure transactions" },
  ];

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
      
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {!isRegistered ? (
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <Badge variant="accent" className="mb-4">Consumer Registration</Badge>
                <h1 className="font-serif text-4xl font-bold text-foreground mb-4">
                  Join FarmFresh Today
                </h1>
                <p className="text-muted-foreground">
                  Free registration • Browse products • Become Prime for exclusive access
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Registration Form */}
                <Card className="animate-fade-up">
                  <CardHeader>
                    <CardTitle className="font-serif">Create Your Account</CardTitle>
                    <CardDescription>Registration is completely free</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          placeholder="Enter your full name"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 XXXXX XXXXX"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password (min 6 characters)"
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <Button type="submit" variant="warm" size="lg" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-5 h-5" /></>}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Prime Membership Info */}
                <div className="space-y-6 animate-fade-up" style={{ animationDelay: "100ms" }}>
                  <Card className="bg-gradient-card border-2 border-secondary">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-warm flex items-center justify-center">
                          <Crown className="w-6 h-6 text-accent-foreground" />
                        </div>
                        <div>
                          <CardTitle className="font-serif text-2xl">Prime Membership</CardTitle>
                          <CardDescription>Unlock full farmer details</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-4xl font-bold text-foreground">₹200</span>
                        <span className="text-muted-foreground">per farmer</span>
                      </div>
                      
                      <div className="space-y-4">
                        {primeFeatures.map((feature, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <feature.icon className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">{feature.title}</p>
                              <p className="text-xs text-muted-foreground">{feature.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 p-4 rounded-lg bg-success/10 border border-success/20">
                        <p className="text-sm text-success font-medium flex items-center gap-2">
                          <Gift className="w-4 h-4" />
                          Net cost only ₹100 after cashback!
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <h4 className="font-serif font-semibold text-lg mb-3">How it works</h4>
                      <ol className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex gap-2">
                          <span className="font-bold text-primary">1.</span>
                          Browse products with basic info (name, price, farmer ID)
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-primary">2.</span>
                          Pay ₹200 to unlock a specific farmer's details
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-primary">3.</span>
                          Contact farmer and buy directly within 3 days
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-primary">4.</span>
                          Receive ₹100 cashback after purchase
                        </li>
                      </ol>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            /* Success State */
            <div className="max-w-lg mx-auto">
              <Card className="animate-scale-in text-center">
                <CardContent className="pt-10 pb-10">
                  <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-success" />
                  </div>
                  <h2 className="font-serif text-3xl font-bold text-foreground mb-4">Welcome to FarmFresh!</h2>
                  <p className="text-muted-foreground mb-8">
                    Your account has been created successfully. Start exploring fresh products from local farmers.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button variant="hero" size="lg" onClick={() => navigate("/products")}>
                      Browse Products <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ConsumerRegister;

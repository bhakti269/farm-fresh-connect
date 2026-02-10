import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, FileText, Package, IndianRupee, Building2, MapPin, Mail, User, Info, Phone, LayoutDashboard, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Sell = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isAlreadySeller, setIsAlreadySeller] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    yourName: "",
    companyName: "",
    pincode: "",
    city: "",
    state: "",
    email: "",
    phone: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Check if current user is already a registered seller (has farmer profile)
  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading && !user) setIsAlreadySeller(false);
      return;
    }
    const check = async () => {
      const { data } = await supabase
        .from("farmers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      setIsAlreadySeller(!!data);
    };
    check();
  }, [user, authLoading]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const { yourName, companyName, pincode, city, state, email, phone } = formData;
    if (!yourName?.trim()) {
      toast.error("Your Name is required");
      return;
    }
    if (!companyName?.trim()) {
      toast.error("Company/Business/Shop Name is required");
      return;
    }
    if (!pincode?.trim()) {
      toast.error("Pin Code is required");
      return;
    }
    if (!city?.trim()) {
      toast.error("City is required");
      return;
    }
    if (!state?.trim()) {
      toast.error("State is required");
      return;
    }
    if (!email?.trim()) {
      toast.error("Email ID is required");
      return;
    }
    if (!email.trim().includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!phone?.trim()) {
      toast.error("Phone Number is required");
      return;
    }
    setIsSubmitting(true);
    toast.success("Business details saved. Proceeding to product details.");
    setIsSubmitting(false);
    navigate("/farmer-register", { state: { fromSell: true, businessDetails: formData } });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-20 min-h-screen">
        {/* Full-width progress bar – no slicing, all step names visible */}
        <div className="w-full border-b border-border bg-muted/20 py-4 mb-6">
          <div className="container mx-auto px-4">
            <p className="text-sm font-semibold text-foreground mb-3 text-center" id="registration-progress-label">
              Seller registration progress
            </p>
            <div
              className="grid grid-cols-2 sm:flex sm:flex-nowrap sm:items-center sm:justify-between gap-4 sm:gap-2 max-w-4xl mx-auto"
              role="progressbar"
              aria-labelledby="registration-progress-label"
              aria-valuenow={2}
              aria-valuemin={1}
              aria-valuemax={4}
            >
              <div className="flex items-center gap-2 sm:flex-1 sm:min-w-0">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Create Account</span>
              </div>
              <div className="flex items-center gap-2 sm:flex-1 sm:min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground whitespace-nowrap">Business Details</span>
              </div>
              <div className="flex items-center gap-2 sm:flex-1 sm:min-w-0">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Product Details</span>
              </div>
              <div className="flex items-center gap-2 sm:flex-1 sm:min-w-0">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <IndianRupee className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Add GST</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-2xl">
          {/* Already registered seller – show dashboard link */}
          {!authLoading && isAlreadySeller === true && (
            <Card className="mb-6 border-green-600/30 bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
                  <div>
                    <CardTitle className="text-lg">You're already a registered seller</CardTitle>
                    <CardDescription>Go to your seller dashboard to manage products and profile.</CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                  <Button onClick={() => navigate("/farmer-dashboard")} className="gap-2">
                    <LayoutDashboard className="w-4 h-4" /> Go to Seller Dashboard
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/farmer-register", { state: { addProductOnly: true } })} className="gap-2">
                    <Plus className="w-4 h-4" /> Add Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success banner (only when not already seller) */}
          {!isAlreadySeller && (
          <div className="rounded-lg bg-green-600/10 border border-green-600/20 text-green-800 dark:text-green-200 px-4 py-3 mb-6 text-center text-sm font-medium">
            Account created successfully
          </div>
          )}

          {/* Business Details form – hide when already seller */}
          {!isAlreadySeller && (
          <>
          {/* Title and form card */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-2xl text-primary">
                Business Details
              </CardTitle>
              <CardDescription>
                Start adding your business details:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="yourName" className="text-foreground">
                    Your Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="yourName"
                      type="text"
                      placeholder="Enter your name"
                      value={formData.yourName}
                      onChange={(e) => handleChange("yourName", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-foreground">
                    Company/Business/Shop Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative flex items-center gap-2">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Enter business name"
                      value={formData.companyName}
                      onChange={(e) => handleChange("companyName", e.target.value)}
                      className="pl-10 flex-1"
                      required
                    />
                    <button type="button" className="p-1 rounded-full hover:bg-muted text-muted-foreground" aria-label="Info">
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode" className="text-foreground">
                    Pin Code <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="pincode"
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter pin code"
                      value={formData.pincode}
                      onChange={(e) => handleChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="pl-10"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-foreground">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="city"
                        type="text"
                        placeholder="e.g. Mangalore"
                        value={formData.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-foreground">
                      State <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="state"
                        type="text"
                        placeholder="e.g. KA"
                        value={formData.state}
                        onChange={(e) => handleChange("state", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email ID <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2 mt-4"
                  disabled={isSubmitting}
                >
                  Verify
                  <Mail className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
          </>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link to="/" className="hover:text-primary transition-colors">← Back to Home</Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Sell;

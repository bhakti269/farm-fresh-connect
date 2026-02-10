import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Crown, Star, MapPin, Search, Heart } from "lucide-react";

interface ConsumerData {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
}

interface PrimeMembership {
  id: string;
  farmer_id: string;
  consumer_id: string;
  purchased_at: string;
  purchase_deadline: string;
  is_refunded: boolean;
  farmer_name: string;
  farmer_display_id: string;
  farmer_location?: string;
}

const LOCATIONS = ["Mangalore", "Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune"];

const ConsumerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [consumerData, setConsumerData] = useState<ConsumerData | null>(null);
  const [primeMemberships, setPrimeMemberships] = useState<PrimeMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationValue, setLocationValue] = useState(LOCATIONS[0]);

  const fetchConsumerData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      setConsumerData({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: user.phone || null,
      });
    }

    const { data: memberships } = await supabase
      .from("prime_memberships")
      .select(`
        id,
        farmer_id,
        consumer_id,
        purchased_at,
        purchase_deadline,
        is_refunded,
        farmers (
          full_name,
          farmer_display_id,
          address
        )
      `)
      .eq("consumer_id", user.id)
      .order("purchased_at", { ascending: false });

    if (memberships) {
      const formatted: PrimeMembership[] = memberships.map((m: {
        id: string;
        farmer_id: string;
        consumer_id: string;
        purchased_at: string;
        purchase_deadline: string;
        is_refunded: boolean;
        farmers: { full_name: string; farmer_display_id: string; address?: string } | null;
      }) => ({
        id: m.id,
        farmer_id: m.farmer_id,
        consumer_id: m.consumer_id,
        purchased_at: m.purchased_at,
        purchase_deadline: m.purchase_deadline,
        is_refunded: m.is_refunded,
        farmer_name: m.farmers?.full_name || "Unknown Farmer",
        farmer_display_id: m.farmers?.farmer_display_id || "N/A",
        farmer_location: m.farmers?.address || "—",
      }));
      setPrimeMemberships(formatted);
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchConsumerData();
    } else if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate, fetchConsumerData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) navigate(`/products?q=${encodeURIComponent(q)}`);
    else navigate("/products");
  };

  // Not logged in: don't render dashboard (redirect happens in useEffect)
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (authLoading || (user && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout
      userName={consumerData?.full_name || user?.email?.split("@")[0] || "User"}
      userLocation="Mangalore"
      userPhone={consumerData?.phone || user?.phone || null}
      isVerified={!!(consumerData?.phone || user?.phone)}
      verifiedLink={{ label: "Become Verified Buyer", path: "/consumer-register" }}
      sidebarLinks={[
        { path: "/consumer-dashboard", label: "Dashboard" },
        { path: "/consumer-dashboard", label: "Messages" },
        { path: "/consumer-dashboard", label: "My Profile" },
        { path: "/#help", label: "Help and support" },
      ]}
    >
      {/* Search bar - IndiaMART style */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
          <Select value={locationValue} onValueChange={setLocationValue}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 border-border bg-muted/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-1 min-w-0">
            <Input
              type="text"
              placeholder="Enter product / service"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-r-none border-r-0"
            />
            <Button type="submit" variant="default" size="default" className="h-10 rounded-l-none px-4 bg-primary hover:bg-primary/90">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Two columns: My Orders (center) | My Favourites (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Orders - center, takes 2 cols */}
        <div className="lg:col-span-2">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                My Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {primeMemberships.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium text-foreground">No orders yet</p>
                  <p className="text-sm mt-1">Your connected farmers and orders will appear here.</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/products")}>
                    Browse Products
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {primeMemberships.map((membership) => (
                    <div
                      key={membership.id}
                      className="rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">{membership.farmer_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" /> {membership.farmer_location || "—"}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Posted: {new Date(membership.purchased_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">1 Seller Connected · ID: {membership.farmer_display_id}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center gap-1 text-amber-600">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-medium">5</span>
                          <span className="text-xs text-muted-foreground">reviews</span>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs">
                          Rate Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* My Favourites - right panel */}
        <div className="lg:col-span-1">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                My Favourites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium text-foreground">No favourites yet</p>
                <p className="text-sm mt-1">Save products you like to find them here.</p>
                <Button
                  variant="default"
                  size="sm"
                  className="mt-4 bg-primary hover:bg-primary/90"
                  onClick={() => navigate("/products")}
                >
                  Start Exploring
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ConsumerDashboard;

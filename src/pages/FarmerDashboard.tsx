import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Package, Plus, TrendingUp, Users, Pencil, Trash2, Camera, CheckCircle2, LayoutDashboard, ArrowUp, Handshake, ChevronRight, ShoppingCart, Cloud, Settings, HelpCircle, Search } from "lucide-react";
import { toast } from "sonner";

interface FarmerData {
  id: string;
  full_name: string;
  farmer_display_id: string;
  is_verified: boolean;
  address: string | null;
  contact_number: string | null;
  gst_number: string | null;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: string;
  unit: string;
  is_active: boolean;
  description: string | null;
  image_url: string | null;
}

type DashboardSection = "dashboard" | "profile" | "buyleads" | "products" | "photos-docs" | "buyer-tools" | "settings" | "help";

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [farmerData, setFarmerData] = useState<FarmerData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<DashboardSection>("dashboard");
  const fetchProducts = async (farmerId: string) => {
    const { data: farmerProducts } = await supabase
      .from("products")
      .select("id, name, category, price, quantity, unit, is_active, description, image_url")
      .eq("farmer_id", farmerId)
      .order("created_at", { ascending: false });

    setProducts(farmerProducts || []);
  };

  const productsMissingPhoto = products.filter(p => !p.image_url || !p.image_url.trim()).length;

  useEffect(() => {
    const checkFarmerAccess = async () => {
      if (!user) {
        navigate("/login", { state: { from: "/farmer-dashboard" } });
        return;
      }

      // Use farmer data passed from registration (avoids DB timing delay right after signup)
      const state = location.state as { fromRegistration?: boolean; farmerData?: FarmerData } | null;
      if (state?.fromRegistration && state?.farmerData) {
        setFarmerData(state.farmerData);
        await fetchProducts(state.farmerData.id);
        setIsLoading(false);
        return;
      }

      const fetchFarmer = () =>
        supabase
          .from("farmers")
          .select("id, full_name, farmer_display_id, is_verified, address, contact_number, gst_number")
          .eq("user_id", user.id)
          .maybeSingle();

      let { data: farmer } = await fetchFarmer();

      // Retry multiple times (right after registration, DB may have slight delay)
      for (let i = 0; i < 3 && !farmer; i++) {
        await new Promise((r) => setTimeout(r, 400 * (i + 1)));
        const result = await fetchFarmer();
        farmer = result.data;
      }

      // If still no farmer profile, try to auto-create a minimal one for this logged-in user.
      if (!farmer) {
        const metadata: any = (user as any)?.user_metadata || {};
        const insertPayload: Record<string, any> = {
          user_id: user.id,
          full_name: String(metadata.full_name || metadata.name || "Seller"),
          address: "Address not provided",
          contact_number: metadata.phone || metadata.phone_number || "Not provided",
          aadhar_number: "Pending",
        };

        const { data: createdFarmer, error: createError } = await supabase
          .from("farmers")
          .insert(insertPayload)
          .select("id, full_name, farmer_display_id, is_verified, address, contact_number, gst_number")
          .single();

        if (!createError && createdFarmer) {
          farmer = createdFarmer;
        }
      }

      if (farmer) {
        setFarmerData(farmer);
        await fetchProducts(farmer.id);
      }

      setIsLoading(false);
    };

    if (!authLoading) {
      checkFarmerAccess();
    }
  }, [user, authLoading, navigate, location.state]);

  const handleEditProduct = (product: Product) => {
    setEditingProduct({ ...product });
    setIsEditDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;

    setIsSaving(true);
    const { error } = await supabase
      .from("products")
      .update({
        name: editingProduct.name,
        category: editingProduct.category,
        price: editingProduct.price,
        quantity: editingProduct.quantity,
        unit: editingProduct.unit,
        description: editingProduct.description,
        is_active: editingProduct.is_active,
      })
      .eq("id", editingProduct.id);

    setIsSaving(false);

    if (error) {
      toast.error("Failed to update product");
      return;
    }

    toast.success("Product updated successfully");
    setIsEditDialogOpen(false);
    if (farmerData) {
      await fetchProducts(farmerData.id);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      toast.error("Failed to delete product");
      return;
    }

    toast.success("Product deleted successfully");
    setProducts(products.filter(p => p.id !== productId));
  };

  const handleToggleActive = async (product: Product) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);

    if (error) {
      toast.error("Failed to update product status");
      return;
    }

    setProducts(products.map(p => 
      p.id === product.id ? { ...p, is_active: !p.is_active } : p
    ));
    toast.success(`Product ${!product.is_active ? "activated" : "deactivated"}`);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stepsComplete = [true, productsMissingPhoto === 0]; // Basic Details, Add Product Photos
  const stepsAway = stepsComplete.filter(Boolean).length < 2 ? 2 - stepsComplete.filter(Boolean).length : 0;

  const renderDashboardContent = () => {
    if (activeSection === "dashboard") {
      return (
        <>
          {/* Seller profile summary card for this specific seller */}
          <div className="mb-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Seller Profile</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    This dashboard shows details only for your account.
                  </p>
                </div>
                <Badge variant={farmerData?.is_verified ? "default" : "secondary"}>
                  {farmerData?.is_verified ? "Verified" : "Pending"}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0 space-y-1.5 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Name:</span>{" "}
                  {farmerData?.full_name || "Not available"}
                </p>
                <p>
                  <span className="font-medium text-foreground">Farmer ID:</span>{" "}
                  {farmerData?.farmer_display_id || "Not generated"}
                </p>
                {farmerData?.address && (
                  <p>
                    <span className="font-medium text-foreground">Address:</span>{" "}
                    {farmerData.address}
                  </p>
                )}
                {farmerData?.contact_number && (
                  <p>
                    <span className="font-medium text-foreground">Contact:</span>{" "}
                    {farmerData.contact_number}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Promotional banner */}
          <div className="mb-6 rounded-lg overflow-hidden border border-border shadow-sm flex flex-col sm:flex-row">
            <div className="flex-1 bg-gradient-to-br from-violet-600 to-violet-800 px-4 py-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-24 h-12 bg-emerald-400/30 rounded-br-full" aria-hidden />
              <p className="text-amber-300 text-sm font-medium">Limited Time Offer</p>
              <p className="text-white font-semibold mt-0.5">Get more visibility for your products</p>
              <p className="text-white/90 text-sm mt-1">+ Add product photos to become a Verified Seller</p>
            </div>
            <div className="flex-1 bg-gradient-to-br from-pink-500 to-rose-600 px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-white text-sm font-medium">
                  New buyers are looking for farm products in your area.
                </p>
                <p className="text-white/90 text-sm mt-0.5">Add details and photos to get more enquiries.</p>
              </div>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white shrink-0" asChild>
                <Link to="/farmer-register" state={{ addProductOnly: true }}>
                  Avail Offer
                </Link>
              </Button>
            </div>
          </div>

          {/* Complete your profile – shows what seller is missing from registration */}
          <Card className="mb-6 overflow-hidden border-border shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                Complete any missing details from your registration. Add product photos to become a Verified Seller.
              </p>
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex flex-col sm:flex-row lg:flex-col gap-6 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 shrink-0">
                      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                        <path className="text-muted/30" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-orange-500" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" strokeDasharray={`${stepsComplete.filter(Boolean).length * (100 / 2)} 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {stepsAway === 0 ? (
                          <CheckCircle2 className="w-8 h-8 text-green-600" />
                        ) : (
                          <>
                            <span className="text-lg font-bold text-foreground leading-tight">{stepsAway}</span>
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Step{stepsAway !== 1 ? "s" : ""} Away</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                      Complete your profile to become a Verified Seller
                      {farmerData?.is_verified && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />}
                    </h2>
                    <ul className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <li className="flex items-center gap-1.5">
                        <ArrowUp className="w-4 h-4 text-primary" />
                        Higher listing on FarmFresh
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Handshake className="w-4 h-4 text-primary" />
                        More buyer enquiries
                      </li>
                    </ul>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">Basic Details</span>
                    </div>
                    <span className="text-muted-foreground hidden sm:inline">→</span>
                    <div className={`flex items-center gap-1.5 ${productsMissingPhoto > 0 ? "text-foreground" : ""}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${productsMissingPhoto > 0 ? "border-2 border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400" : "bg-green-600 text-white"}`}>
                        {productsMissingPhoto > 0 ? "2" : <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </span>
                      <span className="text-sm font-medium">Add Product Photos</span>
                    </div>
                  </div>
                  {productsMissingPhoto > 0 && (
                    <div className="mt-6">
                      <p className="text-sm font-medium text-destructive mb-3">
                        {productsMissingPhoto} product{productsMissingPhoto !== 1 ? "s" : ""} with missing photo
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.filter((p) => !p.image_url || !p.image_url.trim()).map((product) => (
                          <div key={product.id} className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow">
                            <button type="button" className="w-full aspect-square bg-muted/50 flex flex-col items-center justify-center text-green-600 dark:text-green-500 hover:bg-muted/70 transition-colors cursor-pointer" onClick={() => handleEditProduct(product)}>
                              <span className="flex items-center gap-1 mb-2">
                                <Camera className="w-10 h-10" />
                                <Plus className="w-6 h-6" />
                              </span>
                              <span className="text-sm font-medium">Add Photo</span>
                            </button>
                            <div className="p-3 flex items-center justify-between gap-2 border-t">
                              <span className="font-medium text-sm truncate">{product.name}</span>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleEditProduct(product)}>
                                <Pencil className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Link to="/farmer-register" state={{ addProductOnly: true }} className="border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center aspect-square bg-muted/20 hover:bg-muted/40 hover:border-primary/50 transition-colors min-h-[140px]">
                          <Plus className="w-10 h-10 text-muted-foreground mb-2" />
                          <span className="text-sm font-medium text-muted-foreground">Add Product</span>
                        </Link>
                      </div>
                    </div>
                  )}
                  <div className="mt-6">
                    {productsMissingPhoto === 0 && products.length > 0 && (
                      <p className="text-sm font-medium text-muted-foreground mb-3">Your products</p>
                    )}
                    {(productsMissingPhoto === 0 || products.some((p) => p.image_url?.trim())) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {products.filter((p) => p.image_url?.trim()).map((product) => (
                          <div key={product.id} className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow">
                            <div className="aspect-square bg-muted/50 flex items-center justify-center relative group">
                              <img src={product.image_url!} alt={product.name} className="w-full h-full object-cover" />
                              <Button variant="secondary" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8" onClick={() => handleEditProduct(product)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="p-3 flex items-center justify-between gap-2">
                              <span className="font-medium text-sm truncate">{product.name}</span>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleEditProduct(product)}>
                                <Pencil className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Link to="/farmer-register" state={{ addProductOnly: true }} className="border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center aspect-square bg-muted/20 hover:bg-muted/40 hover:border-primary/50 transition-colors min-h-[140px]">
                          <Plus className="w-10 h-10 text-muted-foreground mb-2" />
                          <span className="text-sm font-medium text-muted-foreground">Add Product</span>
                        </Link>
                      </div>
                    )}
                    {products.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Add your first product to get started.{" "}
                        <Link to="/farmer-register" state={{ addProductOnly: true }} className="text-primary hover:underline">
                          Add Product
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
                <Package className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Listings</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.filter(p => p.is_active).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Account</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge variant={farmerData?.is_verified ? "default" : "secondary"}>
                  {farmerData?.is_verified ? "Verified" : "Pending"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Full product list */}
          {products.length > 0 && (
            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Manage Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.category} • ₹{product.price}/{product.unit}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={product.is_active ? "default" : "secondary"} className="cursor-pointer" onClick={() => handleToggleActive(product)}>
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="outline" size="icon" onClick={() => handleEditProduct(product)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure you want to delete "{product.name}"?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteProduct(product.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      );
    }

    if (activeSection === "profile") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Seller Profile</CardTitle>
            <CardDescription>Details you added during registration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input value={farmerData?.full_name || ""} readOnly />
              </div>
              <div>
                <Label>Farmer ID</Label>
                <Input value={farmerData?.farmer_display_id || ""} readOnly />
              </div>
              <div className="md:col-span-2">
                <Label>Address</Label>
                <Textarea value={farmerData?.address || ""} readOnly rows={2} />
              </div>
              <div>
                <Label>Contact Number</Label>
                <Input value={farmerData?.contact_number || ""} readOnly />
              </div>
              <div>
                <Label>Verification Status</Label>
                <div className="mt-2">
                  <Badge variant={farmerData?.is_verified ? "default" : "secondary"}>
                    {farmerData?.is_verified ? "Verified" : "Pending Verification"}
                  </Badge>
                </div>
              </div>
            </div>
            <Button>Edit Profile</Button>
          </CardContent>
        </Card>
      );
    }

    if (activeSection === "buyleads") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Buy Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No buy leads available. Add more products to get matched with buyers.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (activeSection === "products") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Products</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Your product listings added during registration and later</p>
            </div>
            <Button asChild>
              <Link to="/farmer-register" state={{ addProductOnly: true }}>
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </Link>
            </Button>
          </div>
          {products.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">You haven't added any products yet.</p>
                <Button asChild>
                  <Link to="/farmer-register" state={{ addProductOnly: true }}>
                    Add Your First Product
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
                    <p className="font-semibold mb-4">₹{product.price}/{product.unit}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </Button>
                      <Badge variant={product.is_active ? "default" : "secondary"} className="cursor-pointer" onClick={() => handleToggleActive(product)}>
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeSection === "photos-docs") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Photos & Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Cloud className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Upload product photos and documents</p>
                <Button>
                  <Camera className="w-4 h-4 mr-2" /> Upload Photos
                </Button>
              </div>
              {products.filter(p => p.image_url).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Product Photos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {products.filter(p => p.image_url).map((product) => (
                      <div key={product.id} className="border rounded-lg overflow-hidden">
                        <img src={product.image_url!} alt={product.name} className="w-full aspect-square object-cover" />
                        <p className="p-2 text-xs truncate">{product.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (activeSection === "buyer-tools") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Buyer Tools</CardTitle>
            <Badge variant="secondary" className="w-fit">New</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Product Search</h3>
                <p className="text-sm text-muted-foreground mb-3">Search for products you want to buy</p>
                <Button variant="outline" onClick={() => navigate("/products")}>Browse Products</Button>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Price Comparison</h3>
                <p className="text-sm text-muted-foreground mb-3">Compare prices from different sellers</p>
                <Button variant="outline">Compare Prices</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (activeSection === "settings") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground mb-2">Receive email updates about your products and leads</p>
              <Button variant="outline">Configure</Button>
            </div>
            <div>
              <Label>Account Security</Label>
              <p className="text-sm text-muted-foreground mb-2">Manage your password and security settings</p>
              <Button variant="outline">Security Settings</Button>
            </div>
            <div>
              <Label>Privacy</Label>
              <p className="text-sm text-muted-foreground mb-2">Control what information is visible to buyers</p>
              <Button variant="outline">Privacy Settings</Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (activeSection === "help") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Help & Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Getting Started</h3>
              <p className="text-sm text-muted-foreground">Learn how to add products and manage your seller account</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">FAQs</h3>
              <p className="text-sm text-muted-foreground">Find answers to common questions</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Contact Support</h3>
              <p className="text-sm text-muted-foreground mb-3">Need help? Reach out to our support team</p>
              <Button>Contact Us</Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Seller dashboard bar - IndiaMART-style: search + right links + Hi [Name] */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Seller Dashboard</span>
              <form onSubmit={(e) => { e.preventDefault(); navigate("/products"); }} className="flex flex-1 max-w-md">
                <Input
                  type="text"
                  placeholder="Enter product / service to search"
                  className="h-9 rounded-r-none border-r-0"
                  onKeyDown={(e) => e.key === "Enter" && navigate("/products")}
                />
                <Button type="submit" size="sm" className="h-9 rounded-l-none px-3 bg-primary hover:bg-primary/90">
                  <Search className="w-4 h-4" />
                </Button>
              </form>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Link to="/farmer-dashboard" className="text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                <Package className="w-4 h-4" /> Products
              </Link>
              <Link to="/#help" className="text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" /> Help
              </Link>
              <span className="font-medium text-foreground flex items-center gap-1.5">
                Hi, {farmerData?.full_name?.split(" ")[0] || "Seller"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left sidebar - IndiaMART-style: light grey, active pointer, badges */}
        <aside className="w-56 shrink-0 border-r border-border bg-slate-100 dark:bg-slate-900/50 py-4 hidden md:block">
          <nav className="px-2 space-y-0.5">
            <button
              onClick={() => setActiveSection("dashboard")}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md font-medium relative ${
                activeSection === "dashboard" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </span>
              {activeSection === "dashboard" && <ChevronRight className="w-4 h-4 opacity-80" />}
            </button>
            <button
              onClick={() => setActiveSection("profile")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md ${
                activeSection === "profile" 
                  ? "bg-primary text-primary-foreground font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Package className="w-4 h-4" /> Profile
            </button>
            <button
              onClick={() => setActiveSection("buyleads")}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md ${
                activeSection === "buyleads" 
                  ? "bg-primary text-primary-foreground font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-3">
                <ShoppingCart className="w-4 h-4" /> BuyLeads
              </span>
              {productsMissingPhoto > 0 && (
                <span className="min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {productsMissingPhoto}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveSection("products")}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md ${
                activeSection === "products" 
                  ? "bg-primary text-primary-foreground font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-3">
                <Package className="w-4 h-4" /> Products
              </span>
              {productsMissingPhoto > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" aria-hidden />
              )}
            </button>
            <button
              onClick={() => setActiveSection("photos-docs")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md ${
                activeSection === "photos-docs" 
                  ? "bg-primary text-primary-foreground font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Cloud className="w-4 h-4" /> Photos & Docs
            </button>
            <button
              onClick={() => setActiveSection("buyer-tools")}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md ${
                activeSection === "buyer-tools" 
                  ? "bg-primary text-primary-foreground font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-3">
                <ShoppingCart className="w-4 h-4" /> Buyer Tools
              </span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-500/20 text-amber-700 dark:text-amber-400 border-0">New</Badge>
            </button>
            <button
              onClick={() => setActiveSection("settings")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md ${
                activeSection === "settings" 
                  ? "bg-primary text-primary-foreground font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
            <button
              onClick={() => setActiveSection("help")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md ${
                activeSection === "help" 
                  ? "bg-primary text-primary-foreground font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <HelpCircle className="w-4 h-4" /> Help
            </button>
          </nav>
        </aside>

        <main className="flex-1 container mx-auto px-4 py-6">
          {renderDashboardContent()}
        </main>
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Product Name</Label>
                <Input
                  id="edit-name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price (₹)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Quantity</Label>
                  <Input
                    id="edit-quantity"
                    value={editingProduct.quantity}
                    onChange={(e) => setEditingProduct({ ...editingProduct, quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-unit">Unit</Label>
                  <Input
                    id="edit-unit"
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingProduct.description || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleSaveProduct} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default FarmerDashboard;

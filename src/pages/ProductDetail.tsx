import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MapPin, Phone, Mail, Clock, Lock, Crown, Star, MessageSquare, CheckCircle, Loader2, Droplets, Award, MapPinned, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import cerealsImage from "@/assets/cereals.jpg";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  farmerId: string;
  farmerName: string;
  phone: string;
  email: string;
  location: string;
  expiresIn: string;
  negotiable: boolean;
  description: string;
  features: string[];
  quantity: string;
  grade?: string;
  moistureContent?: number;
  purity?: number;
  origin?: string;
  harvestDate?: string;
}

const getCategoryImage = (_category?: string) => cerealsImage;

const ProductDetail = () => {
  const { id } = useParams();
  const [isPrime, setIsPrime] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          farmers (
            farmer_display_id,
            full_name,
            contact_number,
            address
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        console.error('Error fetching product:', error);
        setLoading(false);
        return;
      }

      const farmer = data.farmers as {
        farmer_display_id: string;
        full_name: string;
        contact_number: string;
        address: string;
      } | null;
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      setProduct({
        id: data.id,
        name: data.name,
        price: Number(data.price),
        image: data.image_url || getCategoryImage(data.category),
        category: data.category,
        farmerId: farmer?.farmer_display_id || 'N/A',
        farmerName: farmer?.full_name || 'Unknown Farmer',
        phone: farmer?.contact_number || 'N/A',
        email: 'Contact via app',
        location: farmer?.address || 'N/A',
        expiresIn: `${daysLeft} days`,
        negotiable: data.is_negotiable || false,
        description: data.description || '',
        features: data.features || [],
        quantity: `${data.quantity} ${data.unit} available`,
        grade: data.grade,
        moistureContent: data.moisture_content,
        purity: data.purity,
        origin: data.origin,
        harvestDate: data.harvest_date,
      });
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  const handleBecomePrime = () => {
    toast.success("Prime membership activated! You now have 3 days to complete purchase.");
    setIsPrime(true);
  };

  const handleSubmitFeedback = () => {
    if (!feedback || rating === 0) {
      toast.error("Please provide rating and feedback");
      return;
    }
    toast.success("Thank you for your feedback!");
    setFeedback("");
    setRating(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <Link to="/products">
              <Button variant="outline">Back to Products</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <Link to="/products" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="space-y-4">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-lg">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="capitalize">{product.category}</Badge>
                {product.negotiable && <Badge variant="warning">Negotiable</Badge>}
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {product.expiresIn}
                </Badge>
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="font-serif text-4xl font-bold text-foreground mb-2">{product.name}</h1>
                <p className="text-3xl font-bold text-primary">₹{product.price}<span className="text-lg font-normal text-muted-foreground">/kg</span></p>
              </div>

              <p className="text-muted-foreground">{product.description}</p>

              <div>
                <h3 className="font-semibold mb-2">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {product.features.map((feature: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-success" /> {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Product Specifications */}
              {(product.grade || product.moistureContent || product.purity || product.origin || product.harvestDate) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="font-serif text-lg">Product Specifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {product.grade && (
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Grade</p>
                            <p className="font-medium capitalize">{product.grade.replace('-', ' ')}</p>
                          </div>
                        </div>
                      )}
                      {product.moistureContent && (
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Moisture</p>
                            <p className="font-medium">{product.moistureContent}%</p>
                          </div>
                        </div>
                      )}
                      {product.purity && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Purity</p>
                            <p className="font-medium">{product.purity}%</p>
                          </div>
                        </div>
                      )}
                      {product.origin && (
                        <div className="flex items-center gap-2">
                          <MapPinned className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Origin</p>
                            <p className="font-medium">{product.origin}</p>
                          </div>
                        </div>
                      )}
                      {product.harvestDate && (
                        <div className="flex items-center gap-2 col-span-2">
                          <CalendarDays className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Harvest Date</p>
                            <p className="font-medium">{new Date(product.harvestDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="text-sm text-muted-foreground">
                <p><strong>Quantity Available:</strong> {product.quantity}</p>
                <p><strong>Farmer ID:</strong> {product.farmerId}</p>
              </div>

              {/* Farmer Details Card */}
              <Card className={!isPrime ? "relative overflow-hidden" : ""}>
                {!isPrime && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                    <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-serif font-semibold text-xl mb-2">Farmer Details Locked</h3>
                    <p className="text-sm text-muted-foreground mb-4">Become a Prime member to unlock full contact details</p>
                    <Button variant="warm" onClick={handleBecomePrime}>
                      <Crown className="w-4 h-4" /> Unlock for ₹200
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">Get ₹100 back after purchase</p>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <Crown className="w-5 h-5 text-secondary" /> Farmer Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">{product.farmerName.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{product.farmerName}</p>
                      <p className="text-sm text-muted-foreground">Verified Farmer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{product.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{product.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{product.email}</span>
                  </div>
                  {isPrime && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-success flex items-center gap-2 mb-3">
                        <CheckCircle className="w-4 h-4" /> Prime access active - Complete purchase within 3 days
                      </p>
                      <Button variant="hero" className="w-full">
                        <MessageSquare className="w-4 h-4" /> Contact Farmer
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Feedback Section */}
              {isPrime && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">Leave Feedback</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Rating</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="transition-colors"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= rating ? "text-warning fill-warning" : "text-muted-foreground"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <Textarea
                      placeholder="Share your experience with this product and farmer..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={3}
                    />
                    <Button variant="default" onClick={handleSubmitFeedback}>
                      Submit Feedback
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;

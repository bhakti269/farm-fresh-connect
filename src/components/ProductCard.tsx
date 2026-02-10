import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Eye, MapPin, Clock, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  farmerId: string;
  farmerName?: string;
  location?: string;
  expiresIn?: string;
  negotiable?: boolean;
  isPrime?: boolean;
}

const ProductCard = ({
  id,
  name,
  price,
  image,
  category,
  farmerId,
  farmerName,
  location,
  expiresIn,
  negotiable = false,
  isPrime = false,
}: ProductCardProps) => {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-card">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="secondary" className="capitalize">{category}</Badge>
          {negotiable && <Badge variant="warning">Negotiable</Badge>}
        </div>
        {expiresIn && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            {expiresIn}
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-serif font-semibold text-lg text-foreground line-clamp-1">{name}</h3>
          <p className="text-2xl font-bold text-primary">₹{price}<span className="text-sm font-normal text-muted-foreground">/kg</span></p>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium">Farmer ID:</span>
            <span>{farmerId}</span>
          </div>

          {isPrime ? (
            <>
              {farmerName && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Farmer:</span>
                  <span>{farmerName}</span>
                </div>
              )}
              {location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{location}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <Lock className="w-4 h-4" />
              <span className="text-xs">Become Prime to see full details</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Link to={`/product/${id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="w-4 h-4" />
              View
            </Button>
          </Link>
          {isPrime && (
            <Button variant="default" size="sm">
              <MessageSquare className="w-4 h-4" />
              Contact
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;

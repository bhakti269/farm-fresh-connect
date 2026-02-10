import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sprout, Menu, X, Search } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ProfileDropdown from "@/components/ProfileDropdown";

const LOCATIONS = [{ value: "", label: "Select city" }, { value: "Mumbai", label: "Mumbai" }, { value: "Delhi", label: "Delhi" }, { value: "Bangalore", label: "Bangalore" }, { value: "Chennai", label: "Chennai" }, { value: "Kolkata", label: "Kolkata" }, { value: "Hyderabad", label: "Hyderabad" }, { value: "Pune", label: "Pune" }, { value: "Ahmedabad", label: "Ahmedabad" }];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [locationValue, setLocationValue] = useState(LOCATIONS[0].value);
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (q) navigate(`/products?q=${encodeURIComponent(q)}`);
    else navigate("/products");
  };

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/sell", label: "Sell" },
    { path: "/#help", label: "Help" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center">
              <Sprout className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-bold text-foreground">FarmFresh</span>
          </Link>

          {/* Desktop: Location + Search (IndiaMART-style) */}
          <div className="hidden md:flex flex-1 items-center gap-3 max-w-2xl mx-4">
            <Select value={locationValue || " "} onValueChange={(v) => setLocationValue(v === " " ? "" : v)}>
              <SelectTrigger className="w-[130px] h-10 border-border bg-muted/50">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((city) => (
                  <SelectItem key={city.value || "all"} value={city.value || " "}>{city.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <form onSubmit={handleSearch} className="flex flex-1 min-w-0">
              <Input
                type="text"
                placeholder="Enter product / service to search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-10 rounded-r-none border-r-0"
              />
              <Button type="submit" variant="default" size="default" className="h-10 rounded-l-none px-4 bg-primary hover:bg-primary/90">
                <Search className="w-4 h-4" />
              </Button>
            </form>
            <Link to="/products">
              <Button variant="secondary" size="sm" className="h-10 whitespace-nowrap">Get Best Price</Button>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === link.path ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <ProfileDropdown
                userName={user.email?.split("@")[0] || "User"}
                userPhone={user.phone || null}
                isVerified={!!user.phone}
              />
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/consumer-register">
                  <Button variant="hero" size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-up">
            <form onSubmit={handleSearch} className="flex gap-2 px-4 pb-3">
              <Input
                type="text"
                placeholder="Enter product or crop"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm">Search</Button>
            </form>
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === link.path
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-2 px-4 pt-2">
                {user ? (
                  <ProfileDropdown
                    userName={user.email?.split("@")[0] || "User"}
                    userPhone={user.phone || null}
                    isVerified={!!user.phone}
                  />
                ) : (
                  <>
                    <Link to="/login" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">Sign In</Button>
                    </Link>
                    <Link to="/consumer-register" className="flex-1">
                      <Button variant="hero" size="sm" className="w-full">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

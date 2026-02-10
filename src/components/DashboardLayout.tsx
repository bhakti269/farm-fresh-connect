import { Link, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sprout, MessageCircle, HelpCircle, MapPin } from "lucide-react";
import ProfileDropdown from "@/components/ProfileDropdown";

interface DashboardLayoutProps {
  children: React.ReactNode;
  /** Display name for sidebar and header (e.g. "Bhakti") */
  userName: string;
  /** Location for profile card (e.g. "Mangalore") */
  userLocation?: string;
  /** Phone number for profile dropdown */
  userPhone?: string | null;
  /** Show Verified badge in profile dropdown */
  isVerified?: boolean;
  /** Optional: "Become Verified Buyer" or "Become Verified Farmer" link */
  verifiedLink?: { label: string; path: string };
  /** Sidebar nav items - Dashboard, Messages, My Profile, Help */
  sidebarLinks?: { path: string; label: string; badge?: string }[];
}

const DEFAULT_SIDEBAR_LINKS = [
  { path: "/consumer-dashboard", label: "Dashboard" },
  { path: "/consumer-dashboard/messages", label: "Messages" },
  { path: "/consumer-dashboard/profile", label: "My Profile" },
  { path: "/#help", label: "Help and support" },
];

const DashboardLayout = ({
  children,
  userName,
  userLocation = "Set location",
  userPhone,
  isVerified = false,
  verifiedLink,
  sidebarLinks = DEFAULT_SIDEBAR_LINKS,
}: DashboardLayoutProps) => {
  const location = useLocation();
  const firstName = userName?.split(" ")[0] || "User";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header - IndiaMART style: Logo | Sell | Messages | Hi [name] | Help */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-hero flex items-center justify-center">
                <Sprout className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-serif text-lg font-bold text-foreground">FarmFresh</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/sell"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Sell
              </Link>
              <Link
                to="/consumer-dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <MessageCircle className="w-4 h-4" /> Messages
              </Link>

              <ProfileDropdown
                userName={userName}
                userPhone={userPhone ?? undefined}
                isVerified={isVerified}
              />

              <Link
                to="/#help"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <HelpCircle className="w-4 h-4" /> Help
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Left sidebar - Profile card + nav */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:border-r lg:border-border lg:bg-muted/30">
          <div className="p-4 space-y-6 sticky top-14">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-16 w-16 rounded-full border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                    {firstName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="font-semibold text-foreground mt-2">{userName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {userLocation}
                </p>
                {verifiedLink && (
                  <Link
                    to={verifiedLink.path}
                    className="text-xs text-primary hover:underline font-medium mt-2"
                  >
                    {verifiedLink.label}
                  </Link>
                )}
              </div>
            </div>

            <nav className="space-y-0.5">
              {sidebarLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-xs bg-primary-foreground/20 px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

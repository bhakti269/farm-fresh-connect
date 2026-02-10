import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  LogOut,
  User,
  Home,
  FileUp,
  UserCheck,
  FolderOpen,
  MessageSquare,
  LayoutGrid,
  Settings,
  Smartphone,
  Pencil,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ProfileDropdownProps {
  userName: string;
  userPhone?: string | null;
  isVerified?: boolean;
}

export default function ProfileDropdown({ userName, userPhone, isVerified = false }: ProfileDropdownProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const firstName = userName?.split(" ")[0] || "User";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-foreground font-medium">
          <User className="w-4 h-4" />
          Hi {firstName}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-0 min-h-[200px]">
        <div className="p-4 border-b border-border bg-card">
          <p className="font-semibold text-foreground text-base">{userName}</p>
          {userPhone && (
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
              {userPhone}
              {isVerified && (
                <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </p>
          )}
          <Link
            to="/consumer-dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium mt-2"
          >
            <Pencil className="w-3.5 h-3.5" /> View Profile
          </Link>
        </div>

        <div className="py-1">
          <DropdownMenuItem asChild>
            <Link to="/" className="flex items-center gap-3 cursor-pointer">
              <Home className="w-4 h-4 text-muted-foreground" /> Home
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/sell" className="flex items-center gap-3 cursor-pointer">
              <FileUp className="w-4 h-4 text-muted-foreground" /> Post Your Requirement
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/consumer-register" className="flex items-center gap-3 cursor-pointer">
              <UserCheck className="w-4 h-4 text-muted-foreground" /> Verified Business Buyer
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/products" className="flex items-center gap-3 cursor-pointer">
              <FolderOpen className="w-4 h-4 text-muted-foreground" /> Products/Services Directory
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/consumer-dashboard" className="flex items-center gap-3 cursor-pointer">
              <MessageSquare className="w-4 h-4 text-muted-foreground" /> My Orders
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/consumer-dashboard" className="flex items-center gap-3 cursor-pointer">
              <LayoutGrid className="w-4 h-4 text-muted-foreground" /> Recent Activity
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/consumer-dashboard" className="flex items-center gap-3 cursor-pointer w-full">
              <Settings className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="flex-1">Settings</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800">NEW</Badge>
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />

        <div className="py-1">
          <DropdownMenuItem asChild>
            <Link to="/#help" className="flex flex-col items-start gap-0.5 cursor-pointer py-2.5">
              <span className="flex items-center gap-2 w-full">
                <span className="font-medium">Business Loans</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800">NEW</Badge>
              </span>
              <span className="text-xs text-muted-foreground">Loans made simple.</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/#help" className="flex flex-col items-start gap-0.5 cursor-pointer py-2.5">
              <span className="font-medium">Ship With FarmFresh</span>
              <span className="text-xs text-muted-foreground">Easy booking of transport.</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/#help" className="flex items-center gap-3 cursor-pointer">
              <Smartphone className="w-4 h-4 text-muted-foreground" /> Download App
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />

        <div className="p-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

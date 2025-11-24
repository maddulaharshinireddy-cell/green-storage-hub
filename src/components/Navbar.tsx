import { Leaf, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gradient">GreenData</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link to="/">
              <Button 
                variant={location.pathname === "/" ? "default" : "ghost"} 
                size="sm"
                className="gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
            
            {isAdmin && (
              <Link to="/admin">
                <Button 
                  variant={location.pathname === "/admin" ? "default" : "ghost"} 
                  size="sm"
                  className="gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </Button>
              </Link>
            )}

            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

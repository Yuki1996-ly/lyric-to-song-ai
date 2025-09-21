import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/leaderboard", label: "Leaderboard" },
    { path: "/my-songs", label: "My Songs" },
  ];

  return (
    <header className="flex justify-between items-center p-4 bg-card shadow-card border-b">
      <Link to="/" className="text-2xl font-bold text-primary hover:text-primary-light transition-colors">
        Private KTV AI
      </Link>
      <nav className="flex items-center gap-6">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`text-foreground hover:text-primary transition-colors ${
              location.pathname === item.path ? "text-primary font-medium" : ""
            }`}
          >
            {item.label}
          </Link>
        ))}
        <Button variant="default" size="sm" className="btn-shadow">
          Login
        </Button>
      </nav>
    </header>
  );
};

export default Navigation;
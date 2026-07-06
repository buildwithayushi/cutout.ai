import { Link } from "@tanstack/react-router";
import { Moon, Sun, Sparkles, LogOut, User, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Header() {
  const { theme, toggle } = useTheme();
  const { user, profile, signOut } = useAuth();

  const getInitials = (email: string) => {
    return email ? email.substring(0, 2).toUpperCase() : "U";
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full"
    >
      <div className="mx-auto mt-4 max-w-6xl px-4">
        <div className="glass flex items-center justify-between rounded-2xl px-4 py-3 shadow-soft">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-hero text-white shadow-glow">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">Cutout.ai</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden items-center gap-6 md:flex">
            {["Features", "How it works", "Pricing", "FAQ"].map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {l}
              </a>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Toggle theme"
              className="rounded-full"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {user ? (
              /* ---------- Logged-in: user avatar dropdown ---------- */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full p-0 border border-primary/30 hover:border-primary/60"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {getInitials(user.email || "")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-60 glass border-border/50 shadow-soft"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-3 py-1">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-semibold leading-none">My Account</p>
                        <p className="text-xs leading-none text-muted-foreground mt-1 break-all">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <div className="px-4 py-2 flex flex-col gap-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Active Plan:</span>
                      <span className="font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                        {profile?.plan || "Free"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-muted-foreground">Credits:</span>
                      <span className="font-semibold text-foreground">
                        {profile ? (
                          `${Math.max(
                            0,
                            (profile.plan === "pro" ? 10 : 5) -
                              (profile.last_processed_date === new Date().toISOString().split("T")[0]
                                ? profile.credits_used
                                : 0)
                          )} / ${profile.plan === "pro" ? 10 : 5}`
                        ) : (
                          "0 / 5"
                        )} left
                      </span>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <Link to="/dashboard">
                    <DropdownMenuItem className="cursor-pointer gap-2">
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-red-500/10 cursor-pointer gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* ---------- Logged-out: Sign In + Sign Up ---------- */
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-sm font-medium px-4"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button
                    size="sm"
                    className="rounded-full bg-gradient-hero text-white shadow-glow hover:opacity-90 text-sm font-medium px-4"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
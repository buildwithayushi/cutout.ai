import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowLeft, Mail, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

export const Route = createFileRoute("/signup")({
  component: Signup,
});

function Signup() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate({ to: "/" });
    }
  }, [user, loading, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // In Supabase, if email confirmation is required, the user object
      // is returned but has no active session. If it's not required, a session is active.
      if (data.user && !data.session) {
        setIsRegistered(true);
        toast.success("Registration successful! Check your email.");
      } else {
        toast.success("Account created successfully!");
        navigate({ to: "/" });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to start Google login");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* Back button */}
      <div className="absolute top-6 left-6">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2 rounded-full">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Button>
        </Link>
      </div>
      {/* Sign In shortcut */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <span className="text-sm text-muted-foreground hidden sm:block">Already have an account?</span>
        <Link to="/login">
          <Button variant="outline" size="sm" className="rounded-full border-border/60 text-sm">
            Sign In
          </Button>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass shadow-glow border-none">
          {isRegistered ? (
            <CardContent className="pt-6 pb-6 text-center space-y-4">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/20 text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-bold">Check your email</CardTitle>
              <CardDescription className="text-sm">
                We've sent a verification link to <strong className="text-foreground">{email}</strong>.
                Please click the link to activate your account.
              </CardDescription>
              <Link to="/login" className="block w-full">
                <Button className="w-full rounded-xl bg-gradient-hero text-white shadow-soft">
                  Proceed to Sign In
                </Button>
              </Link>
            </CardContent>
          ) : (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-hero text-white shadow-glow">
                  <Sparkles className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">Create your account</CardTitle>
                <CardDescription>
                  Start removing image backgrounds in high definition today
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="•••••••• (Min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-hero text-white shadow-glow hover:opacity-90 mt-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...
                      </>
                    ) : (
                      "Sign Up"
                    )}
                  </Button>
                </form>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-border/50"></div>
                  <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase">Or continue with</span>
                  <div className="flex-grow border-t border-border/50"></div>
                </div>

                <Button
                  variant="outline"
                  type="button"
                  className="w-full rounded-xl border-border/50 hover:bg-muted/50"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                >
                  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                  </svg>
                  Google
                </Button>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
                <div>
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </div>
              </CardFooter>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

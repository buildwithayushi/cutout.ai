import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Handle both hash fragment (email link) and query params (OAuth)
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const queryParams = new URLSearchParams(window.location.search);
      
      const access_token = hashParams.get("access_token") || queryParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token") || queryParams.get("refresh_token");
      const error_description = hashParams.get("error_description") || queryParams.get("error_description");

      if (error_description) {
        toast.error(error_description);
        navigate({ to: "/login" });
        return;
      }

      if (access_token && refresh_token) {
        try {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) throw error;

          toast.success("Email verified successfully!");
          navigate({ to: "/" });
        } catch (error: any) {
          toast.error(error.message || "Failed to verify email");
          navigate({ to: "/login" });
        }
      } else {
        navigate({ to: "/" });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <p className="text-lg text-muted-foreground">Verifying your email...</p>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Zap,
  Crown,
  ArrowDown,
  Download,
  Trash2,
  AlertTriangle,
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  Image as ImageIcon,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import type { HistoryItem } from "@/components/site/BackgroundRemover";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Cutout.ai" },
      { name: "description", content: "Manage your Cutout.ai account, view history and credits." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [downgrading, setDowngrading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<HistoryItem | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !profile) {
      // Small delay to allow auth to initialise
      const t = setTimeout(() => {
        if (!user) navigate({ to: "/login" });
      }, 800);
      return () => clearTimeout(t);
    }
  }, [user, navigate, profile]);

  // Fetch all history (no limit for dashboard)
  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }
    (async () => {
      setHistoryLoading(true);
      try {
        const { data, error } = await supabase
          .from("image_history")
          .select("id, name, original_url, processed_url, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setHistory(data ?? []);
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setHistoryLoading(false);
      }
    })();
  }, [user]);

  // Credits calculation
  const maxCredits = profile?.plan === "pro" ? 10 : 5;
  const todayStr = new Date().toISOString().split("T")[0];
  const isToday = profile?.last_processed_date === todayStr;
  const creditsUsedToday = isToday ? (profile?.credits_used ?? 0) : 0;
  const remainingCredits = profile ? Math.max(0, maxCredits - creditsUsedToday) : 0;
  const creditPct = maxCredits > 0 ? ((creditsUsedToday / maxCredits) * 100) : 0;

  const handleDowngrade = async () => {
    setDowngrading(true);
    try {
      const { error } = await supabase.rpc("downgrade_to_free");
      if (error) throw error;
      await refreshProfile();
      toast.success("Switched to Free plan successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to downgrade plan.");
    } finally {
      setDowngrading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") {
      toast.error('Please type "DELETE" to confirm.');
      return;
    }
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("delete_account");
      if (error) throw error;
      // Sign out on the client side after deletion
      await supabase.auth.signOut();
      toast.success("Account deleted. Goodbye!");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      await supabase.from("image_history").delete().eq("id", id);
      setHistory((h) => h.filter((item) => item.id !== id));
      if (selectedImage?.id === id) setSelectedImage(null);
      toast.success("Image removed from history");
    } catch {
      toast.error("Failed to delete image");
    }
  };

  const downloadImage = async (url: string, name: string) => {
    try {
      let blobUrl = url;
      if (!url.startsWith("blob:")) {
        const response = await fetch(url);
        const blob = await response.blob();
        blobUrl = URL.createObjectURL(blob);
      }
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `cutout-${name || Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (!url.startsWith("blob:")) URL.revokeObjectURL(blobUrl);
      toast.success("Download started");
    } catch {
      toast.error("Failed to download image");
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
            <span className="text-muted-foreground/50">|</span>
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-hero text-white shadow-glow">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold tracking-tight">Cutout.ai</span>
              <span className="text-muted-foreground/50">/</span>
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <LayoutDashboard className="h-4 w-4 text-primary" />
                Dashboard
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="gap-2 text-muted-foreground hover:text-foreground rounded-full"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back{user.email ? `, ${user.email.split("@")[0]}` : ""}! 👋
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Manage your account, view history, and track your credits.
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid gap-4 sm:grid-cols-3"
        >
          {/* Plan card */}
          <div className={`relative overflow-hidden rounded-2xl p-6 shadow-soft ${profile?.plan === "pro" ? "bg-gradient-hero text-white" : "glass"}`}>
            {profile?.plan === "pro" && (
              <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
            )}
            <div className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider ${profile?.plan === "pro" ? "text-white/70" : "text-muted-foreground"}`}>
              {profile?.plan === "pro" ? <Crown className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
              Current Plan
            </div>
            <p className={`mt-2 text-3xl font-bold capitalize ${profile?.plan === "pro" ? "text-white" : ""}`}>
              {profile?.plan || "Free"}
            </p>
            <p className={`mt-1 text-sm ${profile?.plan === "pro" ? "text-white/70" : "text-muted-foreground"}`}>
              {profile?.plan === "pro" ? "10 daily credits · HD quality" : "5 daily credits · Standard quality"}
            </p>
          </div>

          {/* Credits card */}
          <div className="glass rounded-2xl p-6 shadow-soft">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Zap className="h-3.5 w-3.5" />
              Today's Credits
            </div>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-3xl font-bold tabular-nums">{remainingCredits}</span>
              <span className="mb-1 text-muted-foreground text-sm">/ {maxCredits} left</span>
            </div>
            {/* Credit bar */}
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-hero transition-all duration-700"
                style={{ width: `${Math.max(0, 100 - creditPct)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {creditsUsedToday} used today · resets at midnight
            </p>
          </div>

          {/* Images processed */}
          <div className="glass rounded-2xl p-6 shadow-soft">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <ImageIcon className="h-3.5 w-3.5" />
              Total History
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums">{historyLoading ? "—" : history.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">images processed</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </motion.div>

        {/* History section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass rounded-2xl p-6 shadow-soft"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-lg">Image History</h2>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                onClick={async () => {
                  await supabase.from("image_history").delete().eq("user_id", user.id);
                  setHistory([]);
                  setSelectedImage(null);
                  toast.success("History cleared");
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear all
              </Button>
            )}
          </div>

          {historyLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground mb-3">
                <ImageIcon className="h-7 w-7" />
              </div>
              <p className="font-medium">No images yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Process your first image to see it here.
              </p>
              <Link to="/">
                <Button size="sm" className="mt-4 rounded-full bg-gradient-hero text-white shadow-glow hover:opacity-90">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Go to editor
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedImage(item)}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-muted/50 transition-all hover:scale-105 hover:shadow-md"
                >
                  <img
                    src={item.processed_url}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Download className="h-5 w-5 text-white" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Plan Management */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="glass rounded-2xl p-6 shadow-soft"
        >
          <h2 className="font-semibold text-lg mb-1">Plan Management</h2>
          <p className="text-sm text-muted-foreground mb-5">
            You are currently on the <strong className="text-foreground capitalize">{profile?.plan || "free"}</strong> plan.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Free plan */}
            <div className={`rounded-xl border p-4 ${profile?.plan === "free" ? "border-primary/40 bg-primary/5" : "border-border"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-primary" /> Free
                </span>
                {profile?.plan === "free" && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Current</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3">₹0 · 5 daily credits · Standard quality</p>
              {profile?.plan === "pro" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-lg gap-1.5"
                  onClick={handleDowngrade}
                  disabled={downgrading}
                >
                  {downgrading ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowDown className="h-3.5 w-3.5" />
                  )}
                  Switch to Free
                </Button>
              )}
            </div>

            {/* Pro plan */}
            <div className={`rounded-xl border p-4 ${profile?.plan === "pro" ? "border-primary/40 bg-gradient-hero text-white" : "border-border"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium flex items-center gap-1.5 ${profile?.plan === "pro" ? "text-white" : ""}`}>
                  <Crown className={`h-4 w-4 ${profile?.plan === "pro" ? "text-yellow-300" : "text-primary"}`} /> Pro
                </span>
                {profile?.plan === "pro" && (
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">Current</span>
                )}
              </div>
              <p className={`text-xs mb-3 ${profile?.plan === "pro" ? "text-white/70" : "text-muted-foreground"}`}>₹499/month · 10 daily credits · HD quality</p>
              {profile?.plan === "free" && (
                <Button
                  size="sm"
                  className="w-full rounded-lg bg-gradient-hero text-white shadow-soft hover:opacity-90 gap-1.5"
                  onClick={() => {
                    navigate({ to: "/" });
                    setTimeout(() => {
                      document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
                    }, 300);
                  }}
                >
                  <Crown className="h-3.5 w-3.5" />
                  Upgrade to Pro
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6"
        >
          <h2 className="font-semibold text-lg text-red-500 mb-1 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>

          {!deleteConfirm ? (
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/40 text-red-500 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/60 gap-2 rounded-lg"
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete my account
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-red-500/30 bg-background p-4 space-y-3"
            >
              <p className="text-sm font-medium text-red-500 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                This will permanently delete:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Your account and login credentials</li>
                <li>All image processing history ({history.length} images)</li>
                <li>Your profile and plan data</li>
              </ul>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">
                  Type <strong className="text-foreground">DELETE</strong> to confirm
                </label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/60"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setDeleteConfirm(false);
                    setDeleteInput("");
                  }}
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={deleteInput !== "DELETE" || deleting}
                  onClick={handleDeleteAccount}
                  className="bg-red-500 hover:bg-red-600 text-white gap-1.5 rounded-lg"
                >
                  {deleting ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  {deleting ? "Deleting…" : "Delete account"}
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Image preview modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-4 shadow-glow max-w-lg w-full"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium truncate">{selectedImage.name || "Processed image"}</p>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="rounded-full p-1.5 hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="overflow-hidden rounded-xl bg-muted/30 mb-3">
                <img
                  src={selectedImage.processed_url}
                  alt={selectedImage.name}
                  className="w-full object-contain max-h-96"
                />
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {new Date(selectedImage.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-hero text-white shadow-glow hover:opacity-90 rounded-lg gap-1.5"
                  onClick={() => downloadImage(selectedImage.processed_url, selectedImage.name)}
                >
                  <Download className="h-3.5 w-3.5" /> Download PNG
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg"
                  onClick={() => deleteHistoryItem(selectedImage.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

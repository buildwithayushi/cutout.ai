import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Image as ImageIcon,
  Download,
  Copy,
  RotateCcw,
  Loader2,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CompareSlider } from "./CompareSlider";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Link } from "@tanstack/react-router";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;

type Status = "idle" | "preview" | "processing" | "success" | "error";
type Quality = "standard" | "hd";

export interface HistoryItem {
  id: string;
  name: string;
  original_url: string | null;
  processed_url: string;
  created_at: string;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

async function readDimensions(url: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 0, h: 0 });
    img.src = url;
  });
}

export function BackgroundRemover() {
  const { user, profile, refreshProfile } = useAuth();
  const [status, setStatus] = useState<Status>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [quality, setQuality] = useState<Quality>("standard");
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const maxCredits = profile?.plan === "pro" ? 10 : 5;
  const todayStr = new Date().toISOString().split("T")[0];
  const isToday = profile?.last_processed_date === todayStr;
  const creditsUsedToday = isToday ? profile!.credits_used : 0;
  const remainingCredits = profile ? Math.max(0, maxCredits - creditsUsedToday) : 0;

  // Load history from DB — only when user is authenticated
  const fetchHistory = useCallback(async (userId: string) => {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("image_history")
        .select("id, name, original_url, processed_url, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      setHistory(data ?? []);
    } catch (err) {
      console.error("Failed to load history:", err);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      // Clear history immediately when user logs out
      setHistory([]);
      return;
    }
    fetchHistory(user.id);
  }, [user, fetchHistory]);

  const validate = (f: File): string | null => {
    if (!ACCEPTED.includes(f.type)) return "Unsupported format. Use JPG, PNG or WebP.";
    if (f.size > MAX_SIZE) return "File is larger than 10MB.";
    return null;
  };

  const handleFile = useCallback(async (f: File) => {
    const err = validate(f);
    if (err) {
      setError(err);
      setStatus("error");
      toast.error(err);
      return;
    }
    setError(null);
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setProcessedUrl(null);
    setStatus("preview");
    const d = await readDimensions(url);
    setDims(d);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const process = async () => {
    if (!file || !previewUrl) return;

    if (!user) {
      toast.error("Please sign in to remove backgrounds");
      return;
    }

    setStatus("processing");
    setProgress(5);
    progressTimer.current = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.random() * 8 : p));
    }, 250);

    const finish = async (url: string) => {
      if (progressTimer.current) clearInterval(progressTimer.current);
      setProgress(100);
      setProcessedUrl(url);
      setStatus("success");
      toast.success("Background removed successfully");
      await refreshProfile();

      // Save to DB (only if URL is a real URL, not a blob)
      const isBlob = url.startsWith("blob:");
      try {
        const { data: inserted, error: insertErr } = await supabase
          .from("image_history")
          .insert({
            user_id: user.id,
            name: file.name,
            original_url: isBlob ? null : previewUrl,
            processed_url: url,
          })
          .select()
          .single();
        if (insertErr) throw insertErr;
        if (inserted) {
          setHistory((h) => [inserted, ...h].slice(0, 6));
        }
      } catch (e) {
        console.error("Failed to save history:", e);
        // Non-fatal: history save failure shouldn't block the user
      }
    };

    const fail = async (msg: string, shouldRefund = false) => {
      if (progressTimer.current) clearInterval(progressTimer.current);
      if (shouldRefund) {
        try {
          await supabase.rpc("refund_credit");
          await refreshProfile();
        } catch (e) {
          console.error("Failed to refund credit:", e);
        }
      }
      setError(msg);
      setStatus("error");
      toast.error(msg);
    };

    try {
      const { data: success, error: rpcError } = await supabase.rpc("consume_credit");
      if (rpcError) {
        throw new Error(rpcError.message || "Failed to verify credits.");
      }
      if (!success) {
        throw new Error(
          profile?.plan === "pro"
            ? "You have run out of daily credits (10/10 used). Please try again tomorrow!"
            : "You have run out of free daily credits (5/5 used). Upgrade to Pro for 10 daily credits!"
        );
      }
      
      await refreshProfile();

      const webhook = "https://ayushicanvas.app.n8n.cloud/webhook/remove-background";
      const fd = new FormData();
      fd.append("image", file);
      fd.append("quality", quality);
      
      const res = await fetch(webhook, { method: "POST", body: fd });
      
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      
      const contentType = res.headers.get("content-type") || "";
      
      if (contentType.includes("image/")) {
        const blob = await res.blob();
        const processedImageUrl = URL.createObjectURL(blob);
        finish(processedImageUrl);
      } else if (contentType.includes("application/json")) {
        const json = await res.json();
        const imageUrl = json.url || json.myField || json.imageUrl || json.image;
        if (imageUrl) {
          const cleanUrl = imageUrl.trim().replace(/^`|`$/g, '');
          finish(cleanUrl);
        } else {
          throw new Error("No image URL found in response");
        }
      } else {
        const blob = await res.blob();
        if (blob.size > 0 && blob.type.startsWith("image/")) {
          const processedImageUrl = URL.createObjectURL(blob);
          finish(processedImageUrl);
        } else {
          throw new Error("Invalid response from server");
        }
      }
    } catch (e) {
      const isOutofCreditsErr = e instanceof Error && (e.message.includes("run out of") || e.message.includes("verify credits"));
      const shouldRefund = !isOutofCreditsErr;
      fail(e instanceof Error ? e.message : "Something went wrong", shouldRefund);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setProcessedUrl(null);
    setProgress(0);
    setDims(null);
    setError(null);
    setStatus("idle");
  };

  useEffect(() => {
    reset();
  }, [user]);

  const download = async () => {
    if (!processedUrl) return;
    try {
      let blobUrl = processedUrl;
      // If it's an external URL, fetch it as a blob first
      if (!processedUrl.startsWith("blob:")) {
        const response = await fetch(processedUrl);
        const blob = await response.blob();
        blobUrl = URL.createObjectURL(blob);
      }
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `cutout-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Clean up the blob URL if we created one
      if (!processedUrl.startsWith("blob:")) {
        URL.revokeObjectURL(blobUrl);
      }
      toast.success("Download started");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download image");
    }
  };

  const copyLink = async () => {
    if (!processedUrl) return;
    try {
      await navigator.clipboard.writeText(processedUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const clearHistory = async () => {
    if (!user) return;
    try {
      await supabase.from("image_history").delete().eq("user_id", user.id);
      setHistory([]);
      toast.success("History cleared");
    } catch {
      toast.error("Failed to clear history");
    }
  };

  return (
    <div className="w-full">
      <div className="glass overflow-hidden rounded-3xl p-2 shadow-glow">
        <div className="rounded-[20px] bg-card/40 p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {status === "idle" || status === "error" ? (
              <motion.div
                key="drop"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={`relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                    dragging
                      ? "border-primary bg-primary/5 scale-[1.01]"
                      : "border-border hover:border-primary/60 hover:bg-primary/[0.03]"
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED.join(",")}
                    className="sr-only"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                  <motion.div
                    animate={{ y: dragging ? -6 : 0 }}
                    className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-hero text-white shadow-glow"
                  >
                    <Upload className="h-7 w-7" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold">Drop your image here</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      or click to browse — JPG, PNG, WebP up to 10MB
                    </p>
                  </div>
                  {error && (
                    <div className="mt-2 flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1.5 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  )}
                </label>
              </motion.div>
            ) : (
              <motion.div
                key="work"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{file?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file && formatBytes(file.size)}
                        {dims && ` · ${dims.w}×${dims.h}px`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="glass flex rounded-full p-1">
                      {(["standard", "hd"] as Quality[]).map((q) => (
                        <button
                          key={q}
                          onClick={() => setQuality(q)}
                          disabled={status === "processing"}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            quality === q
                              ? "bg-gradient-hero text-white shadow-soft"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {q === "standard" ? "Standard" : "HD"}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={reset}
                      aria-label="Remove"
                      className="rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {status === "processing" && (
                  <div className="space-y-4">
                    <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          AI processing your image…
                        </span>
                        <span className="font-medium tabular-nums">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </div>
                )}

                {status === "preview" && previewUrl && (
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-2xl border bg-muted/30">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="mx-auto max-h-[420px] w-full object-contain"
                      />
                    </div>

                    {!user ? (
                      <div className="space-y-3">
                        <Link to="/login" className="block w-full">
                          <Button
                            size="lg"
                            className="w-full rounded-xl bg-gradient-hero text-white shadow-glow hover:opacity-90"
                          >
                            Sign in to remove background
                          </Button>
                        </Link>
                        <p className="text-center text-xs text-muted-foreground">
                          Sign up or sign in to get 5 free daily credits.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            Plan: <strong className="text-foreground capitalize">{profile?.plan || "Free"}</strong>
                          </span>
                          <span>
                            Daily credits: <strong className="text-foreground">{remainingCredits} / {maxCredits} left</strong>
                          </span>
                        </div>

                        {remainingCredits === 0 ? (
                          <div className="space-y-2">
                            <Button
                              size="lg"
                              disabled
                              className="w-full rounded-xl bg-muted text-muted-foreground cursor-not-allowed border"
                            >
                              Out of daily credits
                            </Button>
                            {profile?.plan === "free" ? (
                              <p className="text-center text-xs text-muted-foreground">
                                You have used all 5 of your free daily credits.{" "}
                                <a href="#pricing" className="text-primary hover:underline font-medium">
                                  Upgrade to Pro
                                </a>{" "}
                                for 10 daily credits!
                              </p>
                            ) : (
                              <p className="text-center text-xs text-muted-foreground">
                                You have used all 10 of your daily Pro credits. Please try again tomorrow!
                              </p>
                            )}
                          </div>
                        ) : (
                          <Button
                            onClick={process}
                            size="lg"
                            className="w-full rounded-xl bg-gradient-hero text-white shadow-glow hover:opacity-90"
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Remove background (1 credit)
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {status === "success" && previewUrl && processedUrl && (
                  <div className="space-y-4">
                    <CompareSlider before={previewUrl} after={processedUrl} />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Ready to download
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="ghost" size="sm" onClick={copyLink} className="rounded-full">
                          <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy link
                        </Button>
                        <Button variant="ghost" size="sm" onClick={reset} className="rounded-full">
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> New image
                        </Button>
                        <Button
                          size="sm"
                          onClick={download}
                          className="rounded-full bg-gradient-hero text-white shadow-glow hover:opacity-90"
                        >
                          <Download className="mr-1.5 h-3.5 w-3.5" /> Download PNG
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Recent History — only show when logged in */}
      {user && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Recent uploads</h3>
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Link>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          {historyLoading ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : history.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    if (h.original_url) setPreviewUrl(h.original_url);
                    setProcessedUrl(h.processed_url);
                    setStatus("success");
                  }}
                  className="group glass relative aspect-square overflow-hidden rounded-xl transition-transform hover:scale-105"
                >
                  <img src={h.processed_url} alt={h.name} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              No history yet — process an image to see it here.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  Sparkles,
  Image as ImageIcon,
  Download,
  Upload,
  Check,
  Star,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.5, ease: "easeOut" as const },
  }),
};

function SectionTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <motion.span
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
        className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-primary"
      >
        <Sparkles className="h-3 w-3" /> {eyebrow}
      </motion.span>
      <motion.h2
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        custom={1}
        variants={fadeUp}
        className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          custom={2}
          variants={fadeUp}
          className="mt-3 text-muted-foreground"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

const features = [
  { icon: Zap, title: "Lightning fast", desc: "AI processes most images in under 3 seconds — no waiting around." },
  { icon: Sparkles, title: "Pixel-perfect edges", desc: "Hair, fur, transparent fabric — handled by a model trained on millions of images." },
  { icon: Shield, title: "Private by default", desc: "Your uploads are encrypted in transit and never used for training." },
  { icon: ImageIcon, title: "Any format", desc: "JPG, PNG, WebP in — transparent PNG out, ready for any canvas." },
  { icon: Download, title: "HD downloads", desc: "Export full-resolution cutouts up to 4K with a single click." },
  { icon: Upload, title: "Batch ready", desc: "Drop multiple images and process them in parallel on Pro." },
];

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-24">
      <SectionTitle
        eyebrow="Features"
        title="Built for serious creators"
        subtitle="Everything you need to ship clean cutouts at scale, from quick social posts to production assets."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            custom={i}
            variants={fadeUp}
            className="glass group rounded-2xl p-6 shadow-soft transition-transform hover:-translate-y-1"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-gradient-hero group-hover:text-white">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const steps = [
  { icon: Upload, title: "Upload", desc: "Drop a JPG, PNG or WebP file under 10MB." },
  { icon: Sparkles, title: "AI Processing", desc: "Our model isolates the subject with pixel-level precision." },
  { icon: Download, title: "Download", desc: "Grab your transparent PNG, ready for any background." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-24">
      <SectionTitle
        eyebrow="How it works"
        title="Three steps to a clean cutout"
      />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={i}
            variants={fadeUp}
            className="glass relative rounded-2xl p-6 shadow-soft"
          >
            <span className="absolute top-4 right-5 text-5xl font-bold text-primary/10">
              0{i + 1}
            </span>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-hero text-white shadow-glow">
              <s.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    desc: "Perfect for personal projects and trying things out.",
    features: ["10 images / month", "Standard quality", "PNG downloads", "Web access"],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/month",
    desc: "For creators and teams shipping content every day.",
    features: [
      "Unlimited images",
      "HD 4K quality",
      "Batch processing",
      "API access",
      "Priority queue",
      "Commercial license",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
];

export function Pricing() {
  const { user, profile, refreshProfile } = useAuth();
  const [downgrading, setDowngrading] = useState(false);

  useEffect(() => {
    // Load Razorpay script on mount
    loadRazorpayScript();
  }, []);

  const handleProClick = async () => {
    if (!user) {
      toast.error("Please sign in or sign up before upgrading to Pro.");
      return;
    }

    const res = await loadRazorpayScript();
    if (!res) {
      toast.error("Failed to load Razorpay");
      return;
    }

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      toast.error("Razorpay Key ID not found. Please check your .env file.");
      return;
    }

    const options = {
      key: razorpayKey,
      amount: 49900, // Amount in paise (₹499)
      currency: "INR",
      name: "Cutout.ai",
      description: "Pro Plan - Monthly",
      image: "",
      handler: async function (response: any) {
        console.log("Payment Successful:", response);
        try {
          const { error } = await supabase
            .from("profiles")
            .update({ plan: "pro" })
            .eq("id", user.id);

          if (error) throw error;
          
          await refreshProfile();
          toast.success("Payment Successful! Welcome to Pro!");
        } catch (err: any) {
          console.error("Error updating plan to Pro:", err);
          toast.error("Payment was successful, but we failed to update your account. Please contact support.");
        }
      },
      prefill: {
        name: "",
        email: user.email || "",
        contact: "",
      },
      notes: {
        address: "Cutout.ai Office",
      },
      theme: {
        color: "#6366f1",
      },
      method: {
        netbanking: true,
        card: true,
        upi: { qr: true, collect: true, intent: true },
        wallet: true,
        paylater: true,
        emi: true,
      },
    };

    // @ts-ignore - Razorpay will be available globally
    const rzp = new window.Razorpay(options);
    rzp.open();

    rzp.on("payment.failed", function (response: any) {
      console.error("Payment Failed:", response.error);
      toast.error("Payment Failed! Please try again.");
    });
  };

  const handleDowngrade = async () => {
    setDowngrading(true);
    try {
      const { error } = await supabase.rpc("downgrade_to_free");
      if (error) throw error;
      await refreshProfile();
      toast.success("Switched to Free plan.");
    } catch (err: any) {
      toast.error(err.message || "Failed to switch plan.");
    } finally {
      setDowngrading(false);
    }
  };

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-24">
      <SectionTitle
        eyebrow="Pricing"
        title="Simple, honest pricing"
        subtitle="Start free. Upgrade when you outgrow it."
      />
      <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
        {plans.map((p, i) => (
          <motion.div
            key={p.name}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={i}
            variants={fadeUp}
            className={`relative rounded-3xl p-8 shadow-soft ${
              p.highlighted ? "bg-gradient-hero text-white shadow-glow" : "glass"
            }`}
          >
            {p.highlighted && (
              <span className="absolute -top-3 right-6 rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary shadow-soft">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-semibold">{p.name}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight">{p.price}</span>
              <span className={p.highlighted ? "text-white/80" : "text-muted-foreground"}>
                {p.period}
              </span>
            </div>
            <p className={`mt-2 text-sm ${p.highlighted ? "text-white/85" : "text-muted-foreground"}`}>
              {p.desc}
            </p>
            <ul className="mt-6 space-y-3">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className={`h-4 w-4 ${p.highlighted ? "text-white" : "text-primary"}`} />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => {
                if (p.name === "Pro") {
                  handleProClick();
                } else if (p.name === "Free" && profile?.plan === "pro") {
                  handleDowngrade();
                } else if (!user) {
                  window.location.href = "/signup";
                }
              }}
              disabled={
                downgrading ||
                !!user && (
                  (p.name === "Pro" && profile?.plan === "pro") ||
                  (p.name === "Free" && profile?.plan === "free")
                )
              }
              className={`mt-8 w-full rounded-xl ${
                p.highlighted
                  ? "bg-white text-primary hover:bg-white/90"
                  : "bg-gradient-hero text-white shadow-soft hover:opacity-90"
              }`}
            >
              {p.name === "Pro"
                ? (profile?.plan === "pro" ? "Current Plan" : "Upgrade to Pro")
                : (user && profile?.plan === "pro" ? (downgrading ? "Switching…" : "Switch to Free") : (user && profile?.plan === "free" ? "Current Plan" : p.cta))}
            </Button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const testimonials = [
  {
    name: "Maya Chen",
    role: "Brand Designer, Lumen",
    quote:
      "I removed backgrounds from 40 product photos in an afternoon. The hair detail on portraits is unreal.",
  },
  {
    name: "Diego Alvarez",
    role: "Founder, Stoke Studio",
    quote:
      "We replaced our paid Photoshop step with Cutout.ai. Saved us hours every week and the edges are cleaner.",
  },
  {
    name: "Priya Raman",
    role: "Content Lead, Northwave",
    quote:
      "The compare slider sold me. I can see exactly what the AI did before I commit to the download.",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24">
      <SectionTitle eyebrow="Loved by creators" title="What our users say" />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <motion.figure
            key={t.name}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={i}
            variants={fadeUp}
            className="glass rounded-2xl p-6 shadow-soft"
          >
            <div className="flex gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <blockquote className="mt-3 text-sm leading-relaxed">"{t.quote}"</blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-hero text-sm font-semibold text-white">
                {t.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "What image formats are supported?",
    a: "JPG, JPEG, PNG and WebP up to 10MB per file. Output is always a transparent PNG.",
  },
  {
    q: "Are my uploads private?",
    a: "Yes. Uploads are encrypted in transit, processed in an isolated worker, and deleted within 24 hours. We never use them for training.",
  },
  {
    q: "How accurate is the AI?",
    a: "Our model handles complex edges like hair, fur and translucent fabric. For most product and portrait shots the result is production-ready as-is.",
  },
  {
    q: "What's the difference between Standard and HD?",
    a: "Standard renders at the original resolution with optimized speed. HD uses a higher-fidelity pass for 4K output, best for print and marketing assets.",
  },
  {
    q: "Can I use the output commercially?",
    a: "Yes. Free and Pro both include a commercial license for the cutouts you generate.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-24">
      <SectionTitle eyebrow="FAQ" title="Frequently asked questions" />
      <div className="glass mt-10 rounded-2xl p-2 shadow-soft">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`} className="px-4">
              <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/50 mt-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-hero text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold">Cutout.ai</span>
          <span className="text-sm text-muted-foreground">© {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-2">
          {[Twitter, Github, Linkedin].map((Icon, i) => (
            <a
              key={i}
              href="#"
              aria-label="Social link"
              className="glass grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
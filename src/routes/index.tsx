import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Header } from "@/components/site/Header";
import { BackgroundRemover } from "@/components/site/BackgroundRemover";
import {
  FeaturesSection,
  HowItWorks,
  Pricing,
  Testimonials,
  FAQ,
  Footer,
} from "@/components/site/Sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cutout.ai — AI Background Remover, Free & Instant" },
      {
        name: "description",
        content:
          "Remove image backgrounds in seconds with AI. Upload JPG, PNG or WebP and download a transparent PNG instantly. Free to start.",
      },
      { property: "og:title", content: "Cutout.ai — AI Background Remover" },
      {
        property: "og:description",
        content:
          "Upload any image and instantly get a transparent background with high-quality AI processing.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section id="upload-section" className="relative mx-auto max-w-6xl px-4 pt-16 pb-24 sm:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Powered by next-gen AI
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">
              Remove Image Background in{" "}
              <span className="text-gradient">Seconds with AI</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Upload any image and instantly get a transparent background with
              high-quality AI processing.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto mt-12 max-w-3xl"
          >
            <BackgroundRemover />
          </motion.div>
        </section>

        <FeaturesSection />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

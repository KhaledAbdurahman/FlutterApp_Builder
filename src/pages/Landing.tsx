import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Smartphone,
  Zap,
  Code2,
  Layers,
  ArrowRight,
  Sparkles,
  Box,
  Palette,
  Download,
  Github,
} from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Drag & Drop Builder",
    description:
      "Build beautiful Flutter UIs with an intuitive drag-and-drop interface. No coding required.",
  },
  {
    icon: Code2,
    title: "Clean Code Generation",
    description:
      "Export production-ready Flutter code that follows best practices and conventions.",
  },
  {
    icon: Palette,
    title: "Theme Customization",
    description:
      "Customize colors, typography, and styles to match your brand identity.",
  },
  {
    icon: Zap,
    title: "Instant Preview",
    description:
      "See your changes in real-time with our live phone preview canvas.",
  },
  {
    icon: Box,
    title: "20+ Widgets",
    description:
      "Access a comprehensive library of Flutter widgets ready to use.",
  },
  {
    icon: Download,
    title: "Export & Download",
    description:
      "Download your complete Flutter project as a ready-to-run application.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-25 h-10 rounded-xl bg-white flex items-center justify-center">
              <img
                src="/Builder.png"
                alt="AppBuilder Logo"
                className="w-25 h-12"
              />
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/auth?mode=register">
              <Button size="sm" className="gradient-primary glow-primary">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_70%)]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-5xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">
              Visual Flutter Development
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Build Flutter Apps
            <br />
            <span className="text-gradient">Without Code</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Design beautiful mobile interfaces with our drag-and-drop builder.
            Export clean, production-ready Flutter code in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth?mode=register">
              <Button
                size="lg"
                className="gradient-primary glow-primary text-lg px-8 py-6"
              >
                Start Building Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a
              href="https://github.com/NabilDev0/FlutterApp_Builder_Project"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                <Github className="w-5 h-5 mr-2" />
                View on GitHub
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Hero Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative max-w-6xl mx-auto mt-16"
        >
          <div className="relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-2 shadow-elevated">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <span className="text-sm text-muted-foreground ml-4">
                AppBuilder Builder
              </span>
            </div>
            <div className="aspect-[16/9] bg-gradient-to-br from-muted to-background rounded-b-xl flex items-center justify-center">
              <div className="flex items-center gap-8">
                {/* Widget Palette Preview */}
                <div className="w-48 h-80 rounded-xl bg-card border border-border p-4 space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground mb-4">
                    WIDGETS
                  </div>
                  {["Container", "Text", "Button", "Image", "Column"].map(
                    (w) => (
                      <div
                        key={w}
                        className="p-3 rounded-lg bg-muted/50 border border-border text-sm"
                      >
                        {w}
                      </div>
                    ),
                  )}
                </div>

                {/* Phone Preview */}
                <div className="w-64 h-[500px] rounded-[3rem] bg-background border-4 border-muted p-3 relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-muted rounded-b-2xl" />
                  <div className="w-full h-full rounded-[2.5rem] bg-gradient-to-b from-primary/20 to-accent/10 flex flex-col items-center justify-center p-6">
                    <div className="w-16 h-16 rounded-2xl gradient-primary mb-4" />
                    <div className="w-32 h-4 rounded bg-foreground/20 mb-2" />
                    <div className="w-24 h-3 rounded bg-foreground/10" />
                  </div>
                </div>

                {/* Properties Preview */}
                <div className="w-48 h-80 rounded-xl bg-card border border-border p-4 space-y-4">
                  <div className="text-xs font-semibold text-muted-foreground mb-4">
                    PROPERTIES
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Width</div>
                    <div className="h-8 rounded bg-muted/50 border border-border" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Color</div>
                    <div className="h-8 rounded gradient-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Padding</div>
                    <div className="h-8 rounded bg-muted/50 border border-border" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Glow effect */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 -z-10 blur-xl opacity-30" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to
              <span className="text-gradient"> Build Apps</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete toolkit for designing and exporting Flutter
              applications
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group p-6 rounded-2xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative rounded-3xl gradient-primary p-px">
            <div className="rounded-3xl bg-background/95 backdrop-blur-xl p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Build Your App?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of developers who are building Flutter apps
                faster with AppBuilder.
              </p>
              <Link to="/auth?mode=register">
                <Button
                  size="lg"
                  className="gradient-primary glow-primary text-lg px-10 py-6"
                >
                  Get Started Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-25 h-10 rounded-xl bg-white flex items-center justify-center">
              <img
                src="/Builder.png"
                alt="AppBuilder Logo"
                className="w-25 h-10"
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 AppBuilder. Built with ❤️ for Flutter developers.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/NabilDev0/FlutterApp_Builder_Project"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

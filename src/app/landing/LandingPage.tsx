import Link from "next/link";
import {
  TrendingUp,
  Truck,
  Send,
  Clock,
  SlidersHorizontal,
  Calculator,
  CheckCircle,
  Check,
} from "lucide-react";
import { AppLogo } from "@/components/AppLogo";

// ── Shared logo ───────────────────────────────────────────────────────────────

function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return <AppLogo size={size} />;
}

// ── Mock quote result card (pure HTML/CSS — no images) ────────────────────────

function QuoteMockup() {
  const breakdown = [
    { label: "Labor (2 crew · 2.5 hrs)", amount: "$105" },
    { label: "Disposal fee", amount: "$72" },
    { label: "Travel", amount: "$25" },
    { label: "Overhead", amount: "$43" },
  ];

  return (
    <div
      className="w-full max-w-[310px] mx-auto rounded-[22px] overflow-hidden"
      style={{
        background: "#fff",
        boxShadow: "0 16px 64px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {/* Card header */}
      <div
        className="px-5 pt-5 pb-4"
        style={{ borderBottom: "1px solid var(--color-qm-border)" }}
      >
        {/* Example quote label + job description */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: "var(--color-qm-surface-alt)",
              color: "var(--color-qm-text-faint)",
              border: "1px solid var(--color-qm-border)",
            }}
          >
            Example quote
          </span>
        </div>
        <p
          className="text-[12px] font-medium mb-3"
          style={{ color: "var(--color-qm-text-muted)" }}
        >
          2-bedroom cleanout · Full load
        </p>

        {/* Job tags */}
        <div className="flex gap-2 flex-wrap mb-4">
          {["Full load", "2-person crew", "2.5 hrs"].map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{
                background: "var(--color-qm-surface-alt)",
                color: "var(--color-qm-text-muted)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Price + margin badge */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.5px] mb-1"
              style={{ color: "var(--color-qm-text-faint)" }}
            >
              Recommended price
            </p>
            <p
              className="text-[40px] font-bold leading-none tracking-tight"
              style={{ color: "var(--color-qm-text)" }}
            >
              $465
            </p>
          </div>
          <div
            className="px-3 py-1.5 rounded-full shrink-0 mb-1"
            style={{ background: "var(--color-qm-excellent-soft)" }}
          >
            <span
              className="text-[11px] font-bold"
              style={{ color: "var(--color-qm-excellent)" }}
            >
              Excellent · 52%
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="px-5 py-4">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.6px] mb-3"
          style={{ color: "var(--color-qm-text-faint)" }}
        >
          Cost breakdown
        </p>
        <div className="space-y-2.5">
          {breakdown.map(({ label, amount }) => (
            <div key={label} className="flex justify-between items-center">
              <span
                className="text-[12.5px]"
                style={{ color: "var(--color-qm-text-muted)" }}
              >
                {label}
              </span>
              <span
                className="text-[12.5px] font-semibold"
                style={{ color: "var(--color-qm-text)" }}
              >
                {amount}
              </span>
            </div>
          ))}
          <div
            className="pt-2.5 mt-1"
            style={{ borderTop: "1px solid var(--color-qm-border)" }}
          >
            <div className="flex justify-between items-center mb-1.5">
              <span
                className="text-[12.5px] font-semibold"
                style={{ color: "var(--color-qm-text)" }}
              >
                Total cost
              </span>
              <span
                className="text-[12.5px] font-bold"
                style={{ color: "var(--color-qm-text)" }}
              >
                $245
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span
                className="text-[12.5px] font-semibold"
                style={{ color: "var(--color-qm-accent)" }}
              >
                Your profit
              </span>
              <span
                className="text-[13px] font-bold"
                style={{ color: "var(--color-qm-accent)" }}
              >
                $220
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Send button */}
      <div className="px-5 pb-5">
        <div
          className="w-full h-11 rounded-[12px] flex items-center justify-center gap-2 text-[13px] font-semibold text-white"
          style={{ background: "var(--color-qm-accent)" }}
        >
          <Send size={14} strokeWidth={2.3} />
          Send to customer
        </div>
      </div>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: "rgba(14,20,20,0.96)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size="sm" />
          <span className="text-[16px] font-bold text-white tracking-tight">
            QuoteMate
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="h-9 px-4 rounded-[10px] text-[13.5px] font-semibold flex items-center"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="h-9 px-4 rounded-[10px] text-[13.5px] font-semibold text-white flex items-center"
            style={{ background: "var(--color-qm-accent)" }}
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: "#0E1414" }}
    >
      {/* Subtle green glow behind the card on large screens */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.07] pointer-events-none hidden md:block"
        style={{
          background: "radial-gradient(circle, #10B981 0%, transparent 70%)",
        }}
      />

      <div className="max-w-5xl mx-auto px-5 py-16 md:py-24 grid md:grid-cols-2 gap-12 md:gap-8 items-center">
        {/* Left: copy */}
        <div>
          {/* Tags */}
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold"
              style={{
                background: "rgba(16,185,129,0.12)",
                color: "var(--color-qm-accent)",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--color-qm-accent)" }}
              />
              Built for junk removal pros
            </div>
          </div>

          <h1
            className="text-[36px] md:text-[46px] font-bold leading-[1.1] tracking-tight mb-5"
            style={{ color: "#F4F6F4" }}
          >
            Quote faster. Price smarter.{" "}
            <span style={{ color: "var(--color-qm-accent)" }}>
              Know your profit.
            </span>
          </h1>

          <p
            className="text-[16px] md:text-[17px] leading-relaxed mb-8 max-w-md"
            style={{ color: "rgba(244,246,244,0.6)" }}
          >
            QuoteMate calculates your recommended price, profit margin, and cost
            breakdown for every junk removal job — in under 60 seconds. Stop
            guessing. Start profiting.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/signup"
              className="px-7 py-3 rounded-[16px] font-semibold text-white flex flex-col items-center justify-center"
              style={{ background: "var(--color-qm-accent)" }}
            >
              <span className="text-[16px]">Get started free</span>
              <span className="text-[11px] font-normal mt-0.5" style={{ color: "rgba(255,255,255,0.72)" }}>No credit card required</span>
            </Link>
          </div>
        </div>

        {/* Right: mock UI */}
        <div className="flex justify-center md:justify-end">
          <QuoteMockup />
        </div>
      </div>
    </section>
  );
}

// ── Trust bar ─────────────────────────────────────────────────────────────────

function TrustBar() {
  const items = [
    "No credit card for free tier",
    "Setup in under 2 minutes",
    "Cancel anytime",
  ];

  return (
    <section
      className="w-full py-5"
      style={{
        background: "var(--color-qm-surface)",
        borderBottom: "1px solid var(--color-qm-border)",
      }}
    >
      <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8">
        {items.map((item, i) => (
          <div key={item} className="flex items-center gap-2">
            {i > 0 && (
              <span
                className="hidden sm:block text-qm-text-faint"
                aria-hidden="true"
              >
                ·
              </span>
            )}
            <CheckCircle
              size={14}
              style={{ color: "var(--color-qm-accent)" }}
              strokeWidth={2.3}
            />
            <span
              className="text-[13px] font-medium"
              style={{ color: "var(--color-qm-text-muted)" }}
            >
              {item}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      num: "1",
      title: "Enter job details",
      desc: "Pick the load size, set crew size and hours, add any dump fees or surcharges. Takes about 30 seconds.",
    },
    {
      num: "2",
      title: "Get your price instantly",
      desc: "QuoteMate calculates your recommended price with a full cost breakdown and profit margin — color-coded so you know where you stand.",
    },
    {
      num: "3",
      title: "Send the quote",
      desc: "Share the quote with your customer via email or copy and paste it into any channel — straight from the app.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="w-full py-16 md:py-24"
      style={{ background: "var(--color-qm-bg)" }}
    >
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center mb-12">
          <p
            className="text-[12px] font-semibold uppercase tracking-[0.8px] mb-3"
            style={{ color: "var(--color-qm-accent)" }}
          >
            How it works
          </p>
          <h2
            className="text-[28px] md:text-[34px] font-bold tracking-tight"
            style={{ color: "var(--color-qm-text)" }}
          >
            From job details to quote in 3 steps
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="rounded-[18px] p-6"
              style={{
                background: "var(--color-qm-surface)",
                border: "1px solid var(--color-qm-border)",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold text-white mb-4"
                style={{ background: "var(--color-qm-accent)" }}
              >
                {step.num}
              </div>
              <h3
                className="text-[17px] font-bold mb-2"
                style={{ color: "var(--color-qm-text)" }}
              >
                {step.title}
              </h3>
              <p
                className="text-[14px] leading-relaxed"
                style={{ color: "var(--color-qm-text-muted)" }}
              >
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────

function Features() {
  const features = [
    {
      icon: Calculator,
      title: "Instant quote calculator",
      desc: "Enter load size, labor hours, crew size, and dump fees — get a recommended price in seconds, every time.",
    },
    {
      icon: TrendingUp,
      title: "Profit margin tracking",
      desc: "Every quote shows your margin percentage, color-coded from Low to Excellent so you never fly blind.",
    },
    {
      icon: Truck,
      title: "Truckload tier pricing",
      desc: "Set custom prices for min load, ⅛, ¼, ½, ¾, and full loads. The calculator picks the right tier automatically.",
    },
    {
      icon: SlidersHorizontal,
      title: "Surcharge builder",
      desc: "Add complexity fees for stairs, heavy items, or difficult access. One tap adds them to the cost breakdown.",
    },
    {
      icon: Send,
      title: "Email & SMS delivery",
      desc: "Send a professional quote directly to the customer via text or email — straight from the app.",
    },
    {
      icon: Clock,
      title: "Full quote history",
      desc: "Every quote is saved. Review past jobs, resend quotes, and track which ones were accepted or declined.",
    },
  ];

  return (
    <section
      id="features"
      className="w-full py-16 md:py-24"
      style={{ background: "var(--color-qm-surface)" }}
    >
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center mb-12">
          <p
            className="text-[12px] font-semibold uppercase tracking-[0.8px] mb-3"
            style={{ color: "var(--color-qm-accent)" }}
          >
            Features
          </p>
          <h2
            className="text-[28px] md:text-[34px] font-bold tracking-tight"
            style={{ color: "var(--color-qm-text)" }}
          >
            Everything you need to price jobs right
          </h2>
          <p
            className="text-[15px] mt-3 max-w-lg mx-auto leading-relaxed"
            style={{ color: "var(--color-qm-text-muted)" }}
          >
            No spreadsheets. No guessing. Just fast, accurate quotes with
            real margin numbers.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-[18px] p-5"
                style={{
                  background: "var(--color-qm-bg)",
                  border: "1px solid var(--color-qm-border)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-[11px] flex items-center justify-center mb-4"
                  style={{ background: "var(--color-qm-accent-soft)" }}
                >
                  <Icon
                    size={19}
                    style={{ color: "var(--color-qm-accent)" }}
                    strokeWidth={2}
                  />
                </div>
                <h3
                  className="text-[15px] font-bold mb-1.5"
                  style={{ color: "var(--color-qm-text)" }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-[13.5px] leading-relaxed"
                  style={{ color: "var(--color-qm-text-muted)" }}
                >
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────

function PricingSection() {
  return (
    <section
      id="pricing"
      className="w-full py-16 md:py-24"
      style={{ background: "var(--color-qm-bg)" }}
    >
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center mb-12">
          <p
            className="text-[12px] font-semibold uppercase tracking-[0.8px] mb-3"
            style={{ color: "var(--color-qm-accent)" }}
          >
            Pricing
          </p>
          <h2
            className="text-[28px] md:text-[34px] font-bold tracking-tight"
            style={{ color: "var(--color-qm-text)" }}
          >
            Free to get started
          </h2>
          <p
            className="text-[15px] mt-3 max-w-md mx-auto"
            style={{ color: "var(--color-qm-text-muted)" }}
          >
            All features included, no credit card required. Set up your account in under 2 minutes.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div
            className="rounded-[22px] p-8 flex flex-col items-center text-center relative overflow-hidden"
            style={{
              background: "#0E1414",
              border: "1.5px solid rgba(16,185,129,0.25)",
            }}
          >
            {/* Subtle glow */}
            <div
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20 pointer-events-none"
              style={{
                background: "radial-gradient(circle, #10B981 0%, transparent 70%)",
              }}
            />

            <div className="flex items-end gap-1 mb-2">
              <span className="text-[52px] font-bold leading-none tracking-tight text-white">
                $0
              </span>
              <span
                className="text-[15px] mb-3"
                style={{ color: "rgba(244,246,244,0.45)" }}
              >
                /month
              </span>
            </div>
            <p
              className="text-[14px] mb-8"
              style={{ color: "rgba(244,246,244,0.5)" }}
            >
              All features included. No credit card required.
            </p>

            <Link
              href="/signup"
              className="w-full h-12 rounded-[14px] text-[15px] font-semibold text-white flex items-center justify-center relative z-10"
              style={{ background: "var(--color-qm-accent)" }}
            >
              Get started free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section
      className="w-full py-16 md:py-24"
      style={{ background: "var(--color-qm-surface)" }}
    >
      <div className="max-w-5xl mx-auto px-5 text-center">
        <h2
          className="text-[28px] md:text-[36px] font-bold tracking-tight mb-4"
          style={{ color: "var(--color-qm-text)" }}
        >
          Ready to start quoting like a pro?
        </h2>
        <p
          className="text-[15px] md:text-[16px] leading-relaxed mb-8 max-w-md mx-auto"
          style={{ color: "var(--color-qm-text-muted)" }}
        >
          Start pricing every job with confidence — and stop leaving money on the table.
        </p>
        <Link
          href="/signup"
          className="inline-flex h-14 px-10 rounded-[16px] text-[16px] font-semibold text-white items-center justify-center"
          style={{ background: "var(--color-qm-accent)" }}
        >
          Get started free
        </Link>
        <p
          className="text-[12.5px] mt-4"
          style={{ color: "var(--color-qm-text-faint)" }}
        >
          Free to get started · All features included · No credit card required
        </p>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      className="w-full py-8"
      style={{
        background: "#0E1414",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" />
          <div>
            <p className="text-[14px] font-bold text-white leading-tight">
              QuoteMate
            </p>
            <p
              className="text-[11.5px]"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Quote calculator for junk removal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-[13px] font-medium"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-[13px] font-medium"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Sign up
          </Link>
          <a
            href="mailto:support@goquotemate.com"
            className="text-[13px] font-medium"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Support
          </a>
          <Link
            href="/terms"
            className="text-[13px] font-medium"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="text-[13px] font-medium"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Privacy Policy
          </Link>
          <span
            className="text-[12px]"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            © 2025 QuoteMate
          </span>
        </div>
      </div>
    </footer>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Nav />
      <main className="flex-1">
        <Hero />
        <TrustBar />
        <HowItWorks />
        <Features />
        <PricingSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

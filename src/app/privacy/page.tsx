import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — QuoteMate",
  description: "How QuoteMate collects, uses, and protects your information.",
};

const Logo = () => (
  <div className="w-10 h-10 rounded-[10px] bg-qm-accent flex items-center justify-center flex-shrink-0">
    <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
      <path
        d="M13 14h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H17l-4 3v-3h-1a2 2 0 0 1-2-2v-8c0-1.1.9-2 2-2z"
        fill="white"
        opacity="0.2"
      />
      <path
        d="M19.5 16.5c-2.2 0-3.7 1.2-3.7 3 0 3.4 5.4 2 5.4 3.7 0 .6-.7 1-1.7 1s-1.8-.4-2.2-1.2"
        stroke="#fff"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M19.5 15v1.5M19.5 23.2v1.5"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-qm-bg px-5 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <Link href="/" className="inline-flex items-center gap-3 mb-10 group">
          <Logo />
          <span className="text-[17px] font-semibold text-qm-text group-hover:text-qm-accent transition-colors">
            QuoteMate
          </span>
        </Link>

        {/* Title */}
        <h1 className="text-[28px] font-bold text-qm-text tracking-tight leading-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-qm-text-muted mt-2">Last updated: May 2026</p>

        <p className="mt-6 text-[15px] text-qm-text-muted leading-relaxed">
          QuoteMate is a quote generation tool for junk removal and local service
          businesses. This policy explains what information we collect, how we use
          it, and how we protect it. We keep things simple and do not sell your data.
        </p>

        <div className="mt-10 space-y-9">

          {/* Section 1 */}
          <section>
            <h2 className="text-[18px] font-semibold text-qm-text mb-3">
              1. Information we collect
            </h2>
            <div className="space-y-3 text-[15px] text-qm-text-muted leading-relaxed">
              <p>
                <span className="font-medium text-qm-text">Account information.</span>{" "}
                When you create an account we collect your name, email address, and
                business name.
              </p>
              <p>
                <span className="font-medium text-qm-text">Payment information.</span>{" "}
                Payments are processed by Stripe. We never store your card number, CVC,
                or full card details — only a Stripe customer ID that lets us manage
                your subscription.
              </p>
              <p>
                <span className="font-medium text-qm-text">Phone numbers.</span>{" "}
                If you use SMS quote delivery, you will enter your customers&apos; phone
                numbers to send quotes. These numbers are used only to deliver the
                message you request.
              </p>
              <p>
                <span className="font-medium text-qm-text">Usage data.</span>{" "}
                We collect basic usage information such as the number of quotes you
                create and which features you use, to help us improve the product.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-[18px] font-semibold text-qm-text mb-3">
              2. How we use your information
            </h2>
            <ul className="space-y-2 text-[15px] text-qm-text-muted leading-relaxed list-none">
              {[
                "To provide the QuoteMate service and maintain your account.",
                "To process payments through Stripe.",
                "To send transactional emails such as quote confirmations and account notifications.",
                "To send SMS messages to your customers on your behalf when you use the SMS delivery feature.",
                "To improve and develop the product using aggregate usage data.",
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="text-qm-accent mt-0.5 flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-[18px] font-semibold text-qm-text mb-3">
              3. How we share your information
            </h2>
            <p className="text-[15px] text-qm-text-muted leading-relaxed mb-3">
              We share your data only with the third-party services required to operate
              QuoteMate:
            </p>
            <ul className="space-y-2 text-[15px] text-qm-text-muted leading-relaxed list-none">
              {[
                { name: "Stripe", desc: "Payment processing and subscription management." },
                { name: "Twilio", desc: "SMS delivery for quote messages sent to your customers." },
                { name: "Brevo", desc: "Transactional email delivery." },
              ].map(({ name, desc }) => (
                <li key={name} className="flex gap-2.5">
                  <span className="text-qm-accent mt-0.5 flex-shrink-0">•</span>
                  <span>
                    <span className="font-medium text-qm-text">{name}</span> — {desc}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[15px] text-qm-text-muted leading-relaxed">
              We do not sell your personal information to any third party, ever.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-[18px] font-semibold text-qm-text mb-3">
              4. Data retention
            </h2>
            <p className="text-[15px] text-qm-text-muted leading-relaxed">
              We retain your account data for as long as your account is active. If
              you close your account or request deletion, we will remove your personal
              data from our systems within 30 days, except where we are required to
              retain it by law (for example, billing records).
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-[18px] font-semibold text-qm-text mb-3">
              5. Your rights
            </h2>
            <p className="text-[15px] text-qm-text-muted leading-relaxed mb-3">
              You can access, correct, or delete the personal information associated
              with your account at any time by contacting us. You can also export or
              delete your data directly from your account settings where available.
            </p>
            <p className="text-[15px] text-qm-text-muted leading-relaxed">
              To exercise any of these rights, email us at{" "}
              <a
                href="mailto:support@goquotemate.com"
                className="text-qm-accent font-medium hover:underline"
              >
                support@goquotemate.com
              </a>
              .
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-[18px] font-semibold text-qm-text mb-3">
              6. Cookies and tracking
            </h2>
            <p className="text-[15px] text-qm-text-muted leading-relaxed">
              We use cookies only as required to maintain your login session. We do
              not use advertising cookies or third-party tracking pixels.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-[18px] font-semibold text-qm-text mb-3">
              7. Contact
            </h2>
            <p className="text-[15px] text-qm-text-muted leading-relaxed">
              Questions about this policy? Contact us at{" "}
              <a
                href="mailto:support@goquotemate.com"
                className="text-qm-accent font-medium hover:underline"
              >
                support@goquotemate.com
              </a>
              .
            </p>
          </section>

        </div>

        {/* Bottom back link */}
        <div className="mt-14 pt-8 border-t border-qm-border">
          <Link
            href="/"
            className="text-sm text-qm-text-muted hover:text-qm-accent transition-colors font-medium"
          >
            ← Back to QuoteMate
          </Link>
        </div>

      </div>
    </div>
  );
}

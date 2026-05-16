import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — QuoteMate",
  description: "Terms and conditions for using the QuoteMate platform.",
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

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-sm text-qm-text-muted mt-2">Last updated: May 2026</p>

        <p className="mt-6 text-[15px] text-qm-text-muted leading-relaxed">
          These terms govern your use of QuoteMate. By creating an account you agree
          to these terms. Please read them — they are written in plain language and
          are not excessively long.
        </p>

        <div className="mt-10 space-y-9">

          {/* Section 1 */}
          <section>
            <h2 className="text-[18px] font-semibold text-qm-text mb-3">
              1. What QuoteMate is
            </h2>
            <p className="text-[15px] text-qm-text-muted leading-relaxed">
              QuoteMate is a quote generation tool designed for junk removal operators
              and other local service businesses. It helps you build job estimates
              quickly based on your own pricing inputs.
            </p>
            <p className="mt-3 text-[15px] text-qm-text-muted leading-relaxed">
              QuoteMate does not guarantee the accuracy of any quote or estimate
              generated. You are solely responsible for reviewing quotes before
              presenting them to customers and for all pricing decisions made in your
              business.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-[18px] font-semibold text-qm-text mb-3">
              2. Accounts
            </h2>
            <ul className="space-y-2 text-[15px] text-qm-text-muted leading-relaxed list-none">
              {[
                "You must be at least 18 years old to create an account.",
                "You must provide accurate and complete information when signing up.",
                "You are responsible for all activity that occurs under your account.",
                "Keep your password secure. Notify us immediately at support@goquotemate.com if you believe your account has been compromised.",
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
              3. Free and Pro plans
            </h2>
            <div className="space-y-3 text-[15px] text-qm-text-muted leading-relaxed">
              <p>
                <span className="font-medium text-qm-text">Free plan.</span>{" "}
                Includes up to 5 quotes per month and access to core features at no
                charge.
              </p>
              <p>
                <span className="font-medium text-qm-text">Pro plan.</span>{" "}
                $19/month, billed monthly. Includes unlimited quotes and all Pro
                features. New subscribers receive a 14-day free trial. A valid payment
                method is required to start the trial. If you do not cancel before day
                15, your card is charged automatically and your subscription continues
                on a monthly basis.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-[18px] font-semibold text-qm-text mb-3">
              4. Cancellation and refunds
            </h2>
            <ul className="space-y-2 text-[15px] text-qm-text-muted leading-relaxed list-none">
              {[
                "You can cancel your Pro subscription at any time from your account settings.",
                "We do not offer refunds for partial billing periods.",
                "After cancellation, you retain Pro access until the end of the current billing period. Your account then reverts to the free plan.",
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="text-qm-accent mt-0.5 flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-[18px] font-semibold text-qm-text mb-3">
              5. SMS messaging
            </h2>
            <ul className="space-y-2 text-[15px] text-qm-text-muted leading-relaxed list-none">
              {[
                "By using the SMS quote delivery feature, you confirm that you have obtained appropriate consent from each recipient to receive text messages from you.",
                "Standard message and data rates may apply to recipients depending on their carrier plan.",
                "QuoteMate is not responsible for SMS delivery failures, carrier filtering, or delays outside our control.",
                "You must not use the SMS feature to send spam, unsolicited marketing, or messages unrelated to quote delivery.",
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="text-qm-accent mt-0.5 flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-[18px] font-semibold text-qm-text mb-3">
              6. Prohibited use
            </h2>
            <p className="text-[15px] text-qm-text-muted leading-relaxed mb-3">
              You agree not to:
            </p>
            <ul className="space-y-2 text-[15px] text-qm-text-muted leading-relaxed list-none">
              {[
                "Use QuoteMate to generate fraudulent quotes or deceive customers.",
                "Create multiple free accounts to bypass the free-tier quote limit.",
                "Attempt to reverse-engineer, scrape, or otherwise abuse the platform.",
                "Use QuoteMate for any purpose that violates applicable law.",
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="text-qm-accent mt-0.5 flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-[18px] font-semibold text-qm-text mb-3">
              7. Limitation of liability
            </h2>
            <p className="text-[15px] text-qm-text-muted leading-relaxed">
              QuoteMate is provided &ldquo;as is&rdquo; without warranty of any kind. We are not
              liable for lost profits, lost business, or any indirect or consequential
              damages arising from your use of the platform or from pricing decisions
              made based on quotes generated by the tool. Our total liability to you
              for any claim is limited to the amount you paid us in the 3 months
              preceding the claim.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-[18px] font-semibold text-qm-text mb-3">
              8. Changes to these terms
            </h2>
            <p className="text-[15px] text-qm-text-muted leading-relaxed">
              We may update these terms from time to time. When we do, we will update
              the date at the top of this page and notify you by email if the changes
              are significant. Continued use of QuoteMate after changes take effect
              constitutes acceptance of the updated terms.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-[18px] font-semibold text-qm-text mb-3">
              9. Contact
            </h2>
            <p className="text-[15px] text-qm-text-muted leading-relaxed">
              Questions about these terms? Email us at{" "}
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

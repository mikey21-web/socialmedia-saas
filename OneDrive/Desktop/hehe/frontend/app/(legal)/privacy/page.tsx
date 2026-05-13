import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Diyaa AI",
  description: "How Diyaa AI collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <article className="space-y-10 max-w-3xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Effective date: June 1, 2026 · Last updated: June 1, 2026
        </p>
        <p className="text-muted-foreground leading-7">
          Diyaa AI (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the Diyaa AI platform, accessible at{" "}
          <Link href="https://diyaa.ai" className="underline">diyaa.ai</Link>. This Privacy Policy explains what
          personal data we collect, why we collect it, how we use it, and your rights regarding that data.
          By using our service, you agree to the practices described here.
        </p>
      </div>

      <Section title="1. Information We Collect">
        <SubSection title="1.1 Account Information">
          When you register, we collect your name, email address, password (stored as a bcrypt hash — never
          in plain text), and team/workspace details. If you sign in via Google OAuth, we receive your name,
          email, and profile picture from Google.
        </SubSection>
        <SubSection title="1.2 Social Platform Credentials">
          When you connect a social media account (Instagram, X, LinkedIn, Facebook, TikTok, YouTube), we
          store OAuth access tokens and refresh tokens. These are encrypted at rest using AES-256-GCM with a
          per-user key. We never store your social media passwords.
        </SubSection>
        <SubSection title="1.3 Content You Create">
          We store posts, captions, images, videos, carousels, and other content you create or approve
          through the platform. This content is associated with your team workspace.
        </SubSection>
        <SubSection title="1.4 Usage Data">
          We collect information about how you use the platform: pages visited, features used, posts
          published, errors encountered, and session metadata (IP address, browser type, device type,
          timestamps). This data is used to improve the product and diagnose issues.
        </SubSection>
        <SubSection title="1.5 Payment Information">
          Payments are processed by Stripe. We do not store your card number, CVV, or full payment details.
          We store your Stripe customer ID and subscription status to manage your plan.
        </SubSection>
        <SubSection title="1.6 AI-Generated Content">
          When you use AI generation features, your prompts, brand voice settings, and generated outputs
          are processed by our AI providers (Groq, Anthropic). We store the outputs in your workspace.
          We do not use your content to train third-party AI models.
        </SubSection>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-7">
          <li>To provide, operate, and improve the Diyaa AI platform</li>
          <li>To authenticate your identity and secure your account</li>
          <li>To publish content to social platforms on your behalf</li>
          <li>To send transactional emails (welcome, payment receipts, publish failure alerts, weekly digests)</li>
          <li>To process payments and manage subscriptions via Stripe</li>
          <li>To analyze product usage and improve features (using aggregated, de-identified data)</li>
          <li>To detect and prevent fraud, abuse, and security incidents</li>
          <li>To comply with legal obligations</li>
        </ul>
        <p className="text-muted-foreground leading-7 mt-4">
          We do not sell your personal data to third parties. We do not use your content for advertising
          targeting. We do not share your data with social platforms beyond what is necessary to publish
          content on your behalf.
        </p>
      </Section>

      <Section title="3. Data Sharing and Third-Party Processors">
        <p className="text-muted-foreground leading-7 mb-4">
          We share limited data with trusted service providers who process it only as needed to provide
          services to us:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 font-semibold">Provider</th>
                <th className="text-left py-2 pr-4 font-semibold">Purpose</th>
                <th className="text-left py-2 font-semibold">Data shared</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                ["Stripe", "Payment processing", "Email, billing details"],
                ["Resend / SendGrid", "Transactional email", "Email address, name"],
                ["Groq", "AI content generation", "Prompts, brand context"],
                ["Anthropic", "AI content generation", "Prompts, brand context"],
                ["Replicate", "Image/video generation", "Image prompts"],
                ["AWS S3 / Cloudflare R2", "Media storage", "Uploaded files"],
                ["Sentry", "Error monitoring", "Error logs, stack traces"],
                ["Railway / Vercel", "Hosting", "Application data"],
              ].map(([p, pu, d]) => (
                <tr key={p} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium text-foreground">{p}</td>
                  <td className="py-2 pr-4">{pu}</td>
                  <td className="py-2">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground leading-7 mt-4">
          We may also disclose your information if required by law, court order, or to protect the rights,
          property, or safety of Diyaa AI, our users, or the public.
        </p>
      </Section>

      <Section title="4. Data Retention">
        <p className="text-muted-foreground leading-7">
          We retain your account and workspace data for as long as your account is active. If you delete
          your account, we will delete or anonymize your personal data within 30 days, except where we are
          required to retain it for legal, tax, or fraud-prevention purposes (typically up to 7 years for
          financial records). Backups may retain data for up to 90 days after deletion.
        </p>
      </Section>

      <Section title="5. Data Security">
        <p className="text-muted-foreground leading-7">
          We implement industry-standard security measures including:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
          <li>AES-256-GCM encryption for OAuth tokens at rest</li>
          <li>bcrypt hashing for passwords (never stored in plain text)</li>
          <li>TLS/HTTPS for all data in transit</li>
          <li>JWT-based authentication with short-lived access tokens and refresh token rotation</li>
          <li>Rate limiting and IP-based abuse detection</li>
          <li>Row-level data isolation (your data is never accessible to other teams)</li>
        </ul>
        <p className="text-muted-foreground leading-7 mt-4">
          No system is 100% secure. If you discover a security vulnerability, please report it to{" "}
          <a href="mailto:security@diyaa.ai" className="underline">security@diyaa.ai</a>.
        </p>
      </Section>

      <Section title="6. Cookies and Tracking">
        <p className="text-muted-foreground leading-7">
          We use cookies and similar technologies for:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
          <li><strong>Authentication:</strong> Keeping you logged in across sessions</li>
          <li><strong>Security:</strong> CSRF protection and session management</li>
          <li><strong>Analytics:</strong> Understanding how users navigate the product (PostHog, anonymized)</li>
          <li><strong>Preferences:</strong> Remembering your theme and settings</li>
        </ul>
        <p className="text-muted-foreground leading-7 mt-4">
          We do not use third-party advertising cookies. You can disable cookies in your browser settings,
          but this may affect your ability to use the platform.
        </p>
      </Section>

      <Section title="7. Your Rights">
        <p className="text-muted-foreground leading-7 mb-4">
          Depending on your location, you may have the following rights:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
          <li><strong>Correction:</strong> Request correction of inaccurate data</li>
          <li><strong>Deletion:</strong> Request deletion of your account and personal data</li>
          <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
          <li><strong>Restriction:</strong> Request that we limit how we process your data</li>
          <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
          <li><strong>Withdrawal of consent:</strong> Withdraw consent where processing is based on consent</li>
        </ul>
        <p className="text-muted-foreground leading-7 mt-4">
          To exercise any of these rights, email{" "}
          <a href="mailto:privacy@diyaa.ai" className="underline">privacy@diyaa.ai</a>. We will respond
          within 30 days. We may need to verify your identity before completing your request.
        </p>
      </Section>

      <Section title="8. International Data Transfers">
        <p className="text-muted-foreground leading-7">
          Diyaa AI is operated from India. Our servers and service providers may be located in the United
          States, European Union, and other countries. By using our service, you consent to the transfer
          of your data to these locations. We ensure appropriate safeguards are in place for international
          transfers in compliance with applicable data protection laws.
        </p>
      </Section>

      <Section title="9. Children's Privacy">
        <p className="text-muted-foreground leading-7">
          Diyaa AI is not directed at children under 13 years of age. We do not knowingly collect personal
          data from children under 13. If you believe we have inadvertently collected such data, please
          contact us at <a href="mailto:privacy@diyaa.ai" className="underline">privacy@diyaa.ai</a> and
          we will delete it promptly.
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p className="text-muted-foreground leading-7">
          We may update this Privacy Policy from time to time. We will notify you of material changes by
          email or by displaying a notice in the product at least 14 days before the changes take effect.
          Your continued use of the service after the effective date constitutes acceptance of the updated
          policy.
        </p>
      </Section>

      <Section title="11. Contact Us">
        <p className="text-muted-foreground leading-7">
          For privacy questions, data requests, or concerns:
        </p>
        <div className="mt-3 space-y-1 text-muted-foreground">
          <p><strong>Email:</strong> <a href="mailto:privacy@diyaa.ai" className="underline">privacy@diyaa.ai</a></p>
          <p><strong>Support:</strong> <a href="mailto:support@diyaa.ai" className="underline">support@diyaa.ai</a></p>
          <p><strong>Address:</strong> Diyaa AI, India</p>
        </div>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h3 className="font-medium">{title}</h3>
      <p className="text-muted-foreground leading-7">{children}</p>
    </div>
  );
}

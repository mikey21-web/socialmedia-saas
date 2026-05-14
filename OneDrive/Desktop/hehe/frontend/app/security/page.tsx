import { Shield, Lock, Eye, Server, Key, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Security — Diyaa AI",
  description: "How Diyaa AI protects your data, credentials, and content. Security practices and compliance.",
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="size-8 text-emerald-500" />
            <h1 className="text-4xl font-bold">Security</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            We handle your social media credentials, brand data, and content. Here&apos;s how we keep it safe.
          </p>
        </div>

        <div className="space-y-10">
          <Section icon={Lock} title="Encryption">
            <ul className="space-y-3 text-muted-foreground">
              <li><strong>OAuth tokens:</strong> AES-256-GCM encrypted at rest with per-user derived keys</li>
              <li><strong>Passwords:</strong> bcrypt hashed (never stored in plain text)</li>
              <li><strong>Data in transit:</strong> TLS 1.3 enforced on all connections</li>
              <li><strong>Database:</strong> Encrypted at rest (managed PostgreSQL)</li>
              <li><strong>Backups:</strong> Encrypted and stored in a separate region</li>
            </ul>
          </Section>

          <Section icon={Key} title="Authentication">
            <ul className="space-y-3 text-muted-foreground">
              <li><strong>JWT tokens:</strong> Short-lived access tokens (24h) + refresh token rotation</li>
              <li><strong>Google OAuth:</strong> Delegated authentication, we never see your Google password</li>
              <li><strong>Rate limiting:</strong> 120 requests/minute per user, Redis-backed</li>
              <li><strong>Session management:</strong> Active sessions visible in settings, revocable</li>
              <li><strong>IP whitelisting:</strong> Available for Agency/Enterprise plans</li>
            </ul>
          </Section>

          <Section icon={Server} title="Infrastructure">
            <ul className="space-y-3 text-muted-foreground">
              <li><strong>Hosting:</strong> Railway (backend) + Vercel (frontend) — SOC 2 compliant providers</li>
              <li><strong>Database:</strong> Managed PostgreSQL with automated daily backups</li>
              <li><strong>CDN:</strong> Cloudflare for static assets and DDoS protection</li>
              <li><strong>Monitoring:</strong> Sentry for error tracking, uptime monitoring every 60s</li>
              <li><strong>Isolation:</strong> Row-level multi-tenancy — your data is never accessible to other teams</li>
            </ul>
          </Section>

          <Section icon={Eye} title="Data Access">
            <ul className="space-y-3 text-muted-foreground">
              <li><strong>Principle of least privilege:</strong> Team members only see their own workspace data</li>
              <li><strong>Audit logging:</strong> Every admin action, credential access, and publish event is logged</li>
              <li><strong>No employee access:</strong> We cannot read your OAuth tokens (they&apos;re encrypted with your key)</li>
              <li><strong>Third-party access:</strong> AI providers (Groq, Anthropic) process prompts but don&apos;t store them</li>
              <li><strong>Data deletion:</strong> Full account deletion within 30 days of request</li>
            </ul>
          </Section>

          <Section icon={AlertTriangle} title="Vulnerability Reporting">
            <p className="text-muted-foreground leading-7">
              If you discover a security vulnerability, please report it responsibly to{" "}
              <a href="mailto:security@diyaa.ai" className="underline font-medium text-foreground">security@diyaa.ai</a>.
              We will acknowledge receipt within 24 hours and provide a fix timeline within 72 hours.
            </p>
            <p className="text-muted-foreground leading-7 mt-3">
              We do not currently run a formal bug bounty program, but we will credit responsible
              disclosures publicly (with your permission) and may offer rewards for critical findings.
            </p>
          </Section>

          <Section icon={Shield} title="Compliance">
            <ul className="space-y-3 text-muted-foreground">
              <li><strong>GDPR:</strong> Data processing agreements available, right to deletion honored</li>
              <li><strong>IT Act (India):</strong> Compliant with Information Technology Act, 2000</li>
              <li><strong>Platform policies:</strong> We comply with all connected platform developer policies</li>
              <li><strong>Data residency:</strong> Primary data stored in AWS Mumbai (ap-south-1) region</li>
            </ul>
          </Section>
        </div>

        <div className="mt-12 p-6 bg-muted/30 border border-border rounded-xl">
          <p className="text-sm text-muted-foreground">
            <strong>Last updated:</strong> June 1, 2026. For security questions, contact{" "}
            <a href="mailto:security@diyaa.ai" className="underline">security@diyaa.ai</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Shield; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Icon className="size-5 text-primary" />
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

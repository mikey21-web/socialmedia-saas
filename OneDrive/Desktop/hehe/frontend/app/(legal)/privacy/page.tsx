const sections = [
  {
    title: "Data We Collect",
    body: "We collect account information such as your name, email address, team details, and login metadata. We also collect usage data about features you use, posts you create, integrations you connect, and device or browser information, including cookies and similar technologies used for authentication, security, and product analytics.",
  },
  {
    title: "How We Use It",
    body: "We use your information to provide the service, operate team workspaces, process publishing requests, send transactional emails, secure accounts, troubleshoot issues, and improve product quality. We may also use aggregated or de-identified information to understand feature performance and capacity needs.",
  },
  {
    title: "Third Parties",
    body: "We share limited data with trusted processors that help us run the service, including Stripe for payments, Resend for email delivery, and Neon for database hosting. These providers process data only as needed to perform services for us and are subject to their own security and privacy commitments.",
  },
  {
    title: "Data Retention",
    body: "We retain account and workspace data while your account is active and for a reasonable period afterward for legal, billing, backup, and security purposes. You may request deletion of your account data, although some records may be retained where required by law or legitimate business obligations.",
  },
  {
    title: "Your Rights",
    body: "Depending on your location, including under GDPR or CCPA, you may have rights to access, correct, delete, export, or restrict use of your personal data. You may also object to certain processing or request information about categories of data we collect and disclose.",
  },
  {
    title: "Contact",
    body: "For privacy requests or questions, contact support at support@diyaa.ai. We may need to verify your identity before completing a request, especially when it involves account access, deletion, or export.",
  },
];

export default function PrivacyPage() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Effective date: June 1, 2026</p>
      </div>
      {sections.map((section) => (
        <section key={section.title} className="space-y-2">
          <h2 className="text-lg font-semibold">{section.title}</h2>
          <p className="leading-7 text-muted-foreground">{section.body}</p>
        </section>
      ))}
    </article>
  );
}

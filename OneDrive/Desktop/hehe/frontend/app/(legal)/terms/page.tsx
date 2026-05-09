const sections = [
  {
    title: "Acceptance",
    body: "By creating an account or using Diyaa AI, you agree to these Terms of Service. If you use the service on behalf of a company, you confirm that you have authority to bind that company to these terms.",
  },
  {
    title: "Service Description",
    body: "Diyaa AI provides tools for planning, generating, approving, scheduling, and publishing social media content. Features may change over time as we improve the platform, and some capabilities may depend on third-party services such as social networks, payment processors, or email providers.",
  },
  {
    title: "User Accounts",
    body: "You are responsible for keeping your login credentials secure and for all activity under your account. You must provide accurate account information and promptly update it when it changes.",
  },
  {
    title: "Acceptable Use",
    body: "You may not use the service to publish illegal, deceptive, infringing, abusive, or harmful content. You also may not attempt to bypass security controls, overload the service, scrape private data, or interfere with other users.",
  },
  {
    title: "Payment & Billing",
    body: "Paid plans are billed through Stripe according to the pricing and billing interval shown at checkout. You authorize us and Stripe to charge your selected payment method for subscription fees, taxes, and applicable renewals.",
  },
  {
    title: "Cancellation",
    body: "You may cancel a paid subscription at any time from the billing portal or by contacting support. Cancellation stops future renewals, but your paid features may remain available until the end of the current billing period.",
  },
  {
    title: "Intellectual Property",
    body: "You retain ownership of the content you upload, draft, approve, or publish through the service. We retain ownership of the platform, software, workflows, designs, and underlying technology used to provide Diyaa AI.",
  },
  {
    title: "Disclaimer of Warranties",
    body: "The service is provided on an as-is and as-available basis. We do not guarantee that generated content will be error-free, that third-party integrations will always be available, or that publishing attempts will always succeed.",
  },
  {
    title: "Limitation of Liability",
    body: "To the maximum extent permitted by law, Diyaa AI will not be liable for indirect, incidental, special, consequential, or punitive damages. Our total liability for any claim related to the service is limited to the amount you paid for the service during the three months before the event giving rise to the claim.",
  },
  {
    title: "Governing Law",
    body: "These terms are governed by the laws applicable in the jurisdiction where Diyaa AI operates, without regard to conflict-of-law rules. Courts in that jurisdiction will have exclusive authority to resolve disputes that cannot be handled informally.",
  },
];

export default function TermsPage() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Terms of Service</h1>
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

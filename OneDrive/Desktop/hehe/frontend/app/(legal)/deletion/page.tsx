const sections = [
  {
    title: "What Data We Store",
    body: "We store the information you provide when you create an account and use Diyaa AI, including your name, email address, profile picture, connected social media platform tokens, scheduled and published posts, analytics data, workspace settings, team membership records, billing history, and communication preferences. We also retain server logs and usage metrics for security and product improvement.",
  },
  {
    title: "How to Request Deletion",
    body: "You may request deletion of your personal data at any time by emailing support@diyaa.ai from the email address associated with your account. Include your full name, account email, and workspace name in the request. You may also delete your account directly from the Settings page, which will trigger an automatic deletion workflow for your data.",
  },
  {
    title: "What Happens When You Request Deletion",
    body: "Once we receive and verify your deletion request, we will permanently remove your personal data including account profile, social media tokens, scheduled and draft posts, analytics snapshots, and team records. We will confirm completion of the deletion by email within the timeline stated below.",
  },
  {
    title: "Deletion Timeline",
    body: "We will complete all deletion requests within 30 days of receiving and verifying the request. Complex requests involving large workspaces or multiple team members may take up to 30 days. You will receive an email confirmation when your data has been fully deleted.",
  },
  {
    title: "Automatic Deletion on Account Close",
    body: "When you close your account — either by canceling your subscription and confirming closure or by requesting deletion — an automated deletion workflow begins immediately. Within 30 days, all personal data tied to your account will be purged from active databases. Backup copies are rotated and removed within 90 days of account closure in accordance with our standard backup retention cycle.",
  },
  {
    title: "Data We May Retain",
    body: "Certain data may be retained after a deletion request where required by law or legitimate business obligations. This includes transaction and payment records required for tax compliance, anonymized or aggregated analytics that cannot be linked back to you, and records of abuse or policy violations necessary to enforce platform safety. Retained records are kept only as long as legally required and are not used for any marketing or product purposes.",
  },
  {
    title: "Third-Party Platform Data",
    body: "Deletion of your Diyaa AI account removes the tokens we hold to access your connected social media accounts, but it does not delete posts already published to those platforms. To remove published content, you must do so directly through the respective social platform. We recommend disconnecting your social accounts from the integrations settings before submitting a deletion request.",
  },
  {
    title: "Contact",
    body: "For deletion requests or questions about this policy, contact us at support@diyaa.ai. We may need to verify your identity before processing a request to ensure we delete the correct account. We do not charge any fee for processing a data deletion request.",
  },
];

export default function DeletionPage() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Data Deletion Policy</h1>
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

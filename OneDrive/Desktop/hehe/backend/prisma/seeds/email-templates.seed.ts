import { PrismaClient } from '@prisma/client';

const TEMPLATES = [
  {
    slug: 'welcome',
    subject: 'Welcome to {{appName}} — let\'s get started',
    htmlBody: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f9fafb; margin:0; padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:48px 32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:28px;">Welcome to {{appName}}</h1>
      <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:16px;">Your AI marketing team is ready</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi {{userName}},</p>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">
        Your <strong>{{teamName}}</strong> workspace is ready. Here's what to do next:
      </p>
      <ol style="color:#374151;font-size:15px;line-height:1.8;padding-left:24px;">
        <li>Connect your first social platform</li>
        <li>Tell us about your brand (90 second setup)</li>
        <li>Let our AI generate your first week of content</li>
      </ol>
      <div style="margin-top:32px;text-align:center;">
        <a href="{{dashboardUrl}}" style="display:inline-block;background:#6366f1;color:white;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
          Open Dashboard →
        </a>
      </div>
    </div>
    <div style="padding:24px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#6b7280;font-size:13px;margin:0;">Need help? Reply to this email and we'll respond within 24 hours.</p>
    </div>
  </div>
</body>
</html>`,
    textBody: 'Welcome to {{appName}}. Your {{teamName}} workspace is ready. Open dashboard: {{dashboardUrl}}',
    variables: ['appName', 'userName', 'teamName', 'dashboardUrl'],
  },
  {
    slug: 'payment_success',
    subject: 'Payment confirmed - {{plan}} plan active',
    htmlBody: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; background:#f9fafb; margin:0; padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:12px;padding:32px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:64px;height:64px;background:#dcfce7;border-radius:50%;line-height:64px;font-size:32px;">✓</div>
    </div>
    <h2 style="text-align:center;color:#111827;margin:0 0 8px;">Payment Successful</h2>
    <p style="text-align:center;color:#6b7280;margin:0 0 32px;">Your {{plan}} plan is now active</p>
    <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Plan</td><td style="padding:8px 0;text-align:right;font-weight:600;">{{plan}}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Amount</td><td style="padding:8px 0;text-align:right;font-weight:600;">{{amount}}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Renewal date</td><td style="padding:8px 0;text-align:right;font-weight:600;">{{renewalDate}}</td></tr>
      </table>
    </div>
    <div style="text-align:center;">
      <a href="{{billingUrl}}" style="display:inline-block;background:#6366f1;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">View Billing</a>
    </div>
  </div>
</body>
</html>`,
    textBody: 'Payment confirmed. Plan: {{plan}}. Amount: {{amount}}. Renewal: {{renewalDate}}.',
    variables: ['plan', 'amount', 'renewalDate', 'billingUrl'],
  },
  {
    slug: 'payment_failed',
    subject: 'Action required: Payment failed',
    htmlBody: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; background:#f9fafb; margin:0; padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:12px;padding:32px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;width:64px;height:64px;background:#fef2f2;border-radius:50%;line-height:64px;font-size:32px;color:#dc2626;">!</div>
    </div>
    <h2 style="text-align:center;color:#111827;margin:0 0 8px;">Payment Failed</h2>
    <p style="text-align:center;color:#6b7280;margin:0 0 24px;">Your subscription payment didn't go through</p>
    <p style="color:#374151;line-height:1.6;">
      Don't worry, we'll automatically retry the payment in 3 days. To avoid any service interruption, please update your billing details now.
    </p>
    <div style="text-align:center;margin-top:32px;">
      <a href="{{billingUrl}}" style="display:inline-block;background:#dc2626;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Update Payment Method</a>
    </div>
  </div>
</body>
</html>`,
    textBody: 'Payment failed. Please update your billing: {{billingUrl}}',
    variables: ['billingUrl'],
  },
  {
    slug: 'publish_failed',
    subject: 'Post failed to publish',
    htmlBody: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; background:#f9fafb; margin:0; padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:12px;padding:32px;">
    <h2 style="color:#111827;margin:0 0 16px;">Post Failed to Publish</h2>
    <p style="color:#6b7280;margin:0 0 24px;">We couldn't publish your post on these platforms:</p>
    <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;margin-bottom:24px;">
      <strong style="color:#991b1b;">{{platforms}}</strong>
      <p style="color:#7f1d1d;font-size:14px;margin:8px 0 0;">{{error}}</p>
    </div>
    <p style="color:#374151;line-height:1.6;font-size:14px;">
      Most common causes: expired access tokens (re-connect the platform) or rate limits (we'll auto-retry).
    </p>
    <div style="text-align:center;margin-top:24px;">
      <a href="{{postUrl}}" style="display:inline-block;background:#6366f1;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">View Post</a>
    </div>
  </div>
</body>
</html>`,
    textBody: 'Post failed on {{platforms}}: {{error}}. View at {{postUrl}}',
    variables: ['platforms', 'error', 'postUrl'],
  },
  {
    slug: 'weekly_digest',
    subject: 'Your weekly social media report',
    htmlBody: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; background:#0f172a; margin:0; padding:32px;">
  <div style="max-width:600px;margin:0 auto;background:#1e293b;color:#f8fafc;border-radius:12px;overflow:hidden;">
    <div style="padding:32px;">
      <h2 style="color:#a5b4fc;margin:0 0 8px;">Weekly Report</h2>
      <p style="color:#94a3b8;margin:0 0 32px;">Hi {{userName}}, here's your week at a glance.</p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
        <div style="background:#0f172a;padding:20px;border-radius:8px;">
          <div style="color:#94a3b8;font-size:11px;letter-spacing:1px;margin-bottom:4px;">POSTS PUBLISHED</div>
          <div style="font-size:32px;font-weight:700;">{{postsPublished}}</div>
        </div>
        <div style="background:#0f172a;padding:20px;border-radius:8px;">
          <div style="color:#94a3b8;font-size:11px;letter-spacing:1px;margin-bottom:4px;">IMPRESSIONS</div>
          <div style="font-size:32px;font-weight:700;">{{totalImpressions}}</div>
        </div>
        <div style="background:#0f172a;padding:20px;border-radius:8px;">
          <div style="color:#94a3b8;font-size:11px;letter-spacing:1px;margin-bottom:4px;">ENGAGEMENTS</div>
          <div style="font-size:32px;font-weight:700;">{{totalEngagements}}</div>
        </div>
        <div style="background:#0f172a;padding:20px;border-radius:8px;">
          <div style="color:#94a3b8;font-size:11px;letter-spacing:1px;margin-bottom:4px;">ENG. RATE</div>
          <div style="font-size:32px;font-weight:700;">{{engagementRate}}%</div>
        </div>
      </div>

      <div style="background:#0f172a;padding:20px;border-radius:8px;margin-bottom:24px;">
        <div style="color:#94a3b8;font-size:11px;letter-spacing:1px;margin-bottom:8px;">TOP PERFORMING POST</div>
        <div style="font-weight:600;font-size:15px;margin-bottom:4px;">{{topPostTitle}}</div>
        <div style="color:#a5b4fc;font-size:13px;">{{topPostEngagements}} engagements</div>
      </div>

      <div style="text-align:center;">
        <a href="{{appUrl}}/analytics" style="display:inline-block;background:#6366f1;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
          View Full Analytics →
        </a>
      </div>
    </div>
  </div>
</body>
</html>`,
    textBody: 'Weekly report: {{postsPublished}} posts, {{totalImpressions}} impressions, {{totalEngagements}} engagements ({{engagementRate}}% rate). Top post: "{{topPostTitle}}" with {{topPostEngagements}} engagements.',
    variables: ['userName', 'postsPublished', 'totalImpressions', 'totalEngagements', 'engagementRate', 'topPostTitle', 'topPostEngagements', 'appUrl'],
  },
];

export async function seedEmailTemplates(prisma: PrismaClient) {
  for (const template of TEMPLATES) {
    await prisma.emailTemplate.upsert({
      where: { slug: template.slug },
      create: {
        slug: template.slug,
        subject: template.subject,
        htmlBody: template.htmlBody,
        textBody: template.textBody,
        variables: template.variables,
      },
      update: {
        subject: template.subject,
        htmlBody: template.htmlBody,
        textBody: template.textBody,
        variables: template.variables,
      },
    });
  }
  console.log(`Seeded ${TEMPLATES.length} email templates`);
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedEmailTemplates(prisma)
    .then(() => prisma.$disconnect())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

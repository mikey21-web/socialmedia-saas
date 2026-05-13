import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Diyaa AI",
  description: "Terms and conditions for using the Diyaa AI platform.",
};

export default function TermsPage() {
  return (
    <article className="space-y-10 max-w-3xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          Effective date: June 1, 2026 · Last updated: June 1, 2026
        </p>
        <p className="text-muted-foreground leading-7">
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Diyaa AI platform
          (&quot;Service&quot;) operated by Diyaa AI (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;). By creating an account or using
          the Service, you agree to be bound by these Terms. If you use the Service on behalf of a company
          or organization, you represent that you have authority to bind that entity to these Terms.
        </p>
      </div>

      <Section title="1. The Service">
        <p className="text-muted-foreground leading-7">
          Diyaa AI provides an AI-powered social media management platform that enables users to plan,
          generate, approve, schedule, and publish content across social media platforms including
          Instagram, X (Twitter), LinkedIn, Facebook, TikTok, and YouTube. The Service includes AI content
          generation, brand voice training, analytics, carousel creation, animated video generation,
          competitor monitoring, and agency management tools.
        </p>
        <p className="text-muted-foreground leading-7 mt-3">
          We reserve the right to modify, suspend, or discontinue any part of the Service at any time with
          reasonable notice. We will not be liable to you or any third party for any modification,
          suspension, or discontinuation of the Service.
        </p>
      </Section>

      <Section title="2. Account Registration">
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-7">
          <li>You must be at least 18 years old to create an account.</li>
          <li>You must provide accurate, complete, and current account information.</li>
          <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
          <li>You are responsible for all activity that occurs under your account.</li>
          <li>You must notify us immediately at <a href="mailto:support@diyaa.ai" className="underline">support@diyaa.ai</a> if you suspect unauthorized access to your account.</li>
          <li>You may not create accounts for the purpose of abuse, spam, or circumventing restrictions.</li>
        </ul>
      </Section>

      <Section title="3. Acceptable Use">
        <p className="text-muted-foreground leading-7 mb-3">
          You agree not to use the Service to:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-7">
          <li>Publish content that is illegal, defamatory, harassing, abusive, threatening, or fraudulent</li>
          <li>Infringe the intellectual property rights of others</li>
          <li>Publish spam, unsolicited commercial messages, or misleading content</li>
          <li>Violate the terms of service of any social media platform you connect</li>
          <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts</li>
          <li>Reverse engineer, decompile, or attempt to extract the source code of the Service</li>
          <li>Use automated means to access the Service in a way that exceeds normal usage</li>
          <li>Resell or sublicense access to the Service without our written permission</li>
          <li>Use the Service to generate content that promotes violence, discrimination, or illegal activity</li>
        </ul>
        <p className="text-muted-foreground leading-7 mt-3">
          We reserve the right to suspend or terminate accounts that violate these rules without prior notice.
        </p>
      </Section>

      <Section title="4. Subscription Plans and Billing">
        <SubSection title="4.1 Plans">
          We offer Free, Solo, Pro, Agency, and Enterprise plans. Features and limits vary by plan as
          described on our pricing page. We reserve the right to change plan features and pricing with
          30 days&apos; notice to existing subscribers.
        </SubSection>
        <SubSection title="4.2 Payment">
          Paid plans are billed in advance on a monthly or annual basis through Stripe. By subscribing,
          you authorize us to charge your payment method for the applicable fees, taxes, and renewals.
          All fees are in Indian Rupees (INR) unless otherwise stated.
        </SubSection>
        <SubSection title="4.3 Automatic Renewal">
          Subscriptions automatically renew at the end of each billing period unless you cancel before
          the renewal date. You can cancel at any time from the billing portal in your account settings.
        </SubSection>
        <SubSection title="4.4 Failed Payments">
          If a payment fails, we will retry automatically. After multiple failed attempts, your account
          may be downgraded to the Free plan. You will receive email notifications before any downgrade.
        </SubSection>
        <SubSection title="4.5 Refunds">
          We offer a 7-day refund on first-time purchases if you are not satisfied. After 7 days, all
          payments are non-refundable except where required by applicable law. To request a refund,
          contact <a href="mailto:support@diyaa.ai" className="underline">support@diyaa.ai</a>.
        </SubSection>
      </Section>

      <Section title="5. Intellectual Property">
        <SubSection title="5.1 Your Content">
          You retain full ownership of all content you upload, create, or publish through the Service,
          including posts, images, videos, brand assets, and writing samples. By using the Service, you
          grant us a limited, non-exclusive license to process, store, and transmit your content solely
          to provide the Service to you.
        </SubSection>
        <SubSection title="5.2 Our Platform">
          We own all rights to the Diyaa AI platform, including its software, design, workflows, AI
          models, prompts, and underlying technology. Nothing in these Terms transfers ownership of our
          intellectual property to you.
        </SubSection>
        <SubSection title="5.3 AI-Generated Content">
          Content generated by our AI tools is provided to you for your use. We make no warranty that
          AI-generated content is original, non-infringing, or suitable for any particular purpose.
          You are responsible for reviewing AI-generated content before publishing it.
        </SubSection>
        <SubSection title="5.4 Feedback">
          If you provide feedback, suggestions, or ideas about the Service, you grant us a perpetual,
          irrevocable, royalty-free license to use that feedback without any obligation to you.
        </SubSection>
      </Section>

      <Section title="6. Third-Party Integrations">
        <p className="text-muted-foreground leading-7">
          The Service integrates with third-party platforms (Instagram, X, LinkedIn, Facebook, TikTok,
          YouTube, Stripe, etc.). Your use of these integrations is subject to the respective platform&apos;s
          terms of service. We are not responsible for the availability, accuracy, or actions of
          third-party platforms. If a platform revokes API access or changes its policies, certain
          features of the Service may become unavailable.
        </p>
      </Section>

      <Section title="7. Disclaimers">
        <p className="text-muted-foreground leading-7">
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS
          OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
          PURPOSE, AND NON-INFRINGEMENT.
        </p>
        <p className="text-muted-foreground leading-7 mt-3">
          We do not warrant that: (a) the Service will be uninterrupted or error-free; (b) AI-generated
          content will be accurate, complete, or suitable for your purposes; (c) publishing to social
          platforms will always succeed; (d) analytics data will be perfectly accurate; or (e) the Service
          will meet your specific requirements.
        </p>
      </Section>

      <Section title="8. Limitation of Liability">
        <p className="text-muted-foreground leading-7">
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, DIYAA AI AND ITS OFFICERS, DIRECTORS,
          EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
          OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, GOODWILL, OR BUSINESS OPPORTUNITIES,
          ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.
        </p>
        <p className="text-muted-foreground leading-7 mt-3">
          OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED THE
          AMOUNT YOU PAID TO US IN THE THREE (3) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO
          THE CLAIM.
        </p>
      </Section>

      <Section title="9. Indemnification">
        <p className="text-muted-foreground leading-7">
          You agree to indemnify, defend, and hold harmless Diyaa AI and its officers, directors,
          employees, and agents from any claims, damages, losses, liabilities, costs, and expenses
          (including reasonable legal fees) arising from: (a) your use of the Service; (b) content you
          publish through the Service; (c) your violation of these Terms; or (d) your violation of any
          third party&apos;s rights.
        </p>
      </Section>

      <Section title="10. Termination">
        <p className="text-muted-foreground leading-7">
          You may terminate your account at any time by deleting it from account settings or contacting
          support. We may suspend or terminate your account immediately if you violate these Terms, engage
          in fraudulent activity, or if required by law. Upon termination, your right to use the Service
          ceases immediately. We will delete your data in accordance with our Privacy Policy.
        </p>
      </Section>

      <Section title="11. Governing Law and Disputes">
        <p className="text-muted-foreground leading-7">
          These Terms are governed by the laws of India. Any disputes arising from these Terms or your
          use of the Service shall first be attempted to be resolved through good-faith negotiation. If
          negotiation fails, disputes shall be submitted to binding arbitration in accordance with the
          Arbitration and Conciliation Act, 1996 of India. The seat of arbitration shall be India.
        </p>
        <p className="text-muted-foreground leading-7 mt-3">
          Notwithstanding the above, either party may seek injunctive or other equitable relief in any
          court of competent jurisdiction to prevent irreparable harm.
        </p>
      </Section>

      <Section title="12. Changes to These Terms">
        <p className="text-muted-foreground leading-7">
          We may update these Terms from time to time. We will notify you of material changes by email
          or by displaying a notice in the product at least 14 days before the changes take effect.
          Your continued use of the Service after the effective date constitutes acceptance of the
          updated Terms.
        </p>
      </Section>

      <Section title="13. Contact">
        <p className="text-muted-foreground leading-7">
          For questions about these Terms:
        </p>
        <div className="mt-3 space-y-1 text-muted-foreground">
          <p><strong>Email:</strong> <a href="mailto:legal@diyaa.ai" className="underline">legal@diyaa.ai</a></p>
          <p><strong>Support:</strong> <a href="mailto:support@diyaa.ai" className="underline">support@diyaa.ai</a></p>
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

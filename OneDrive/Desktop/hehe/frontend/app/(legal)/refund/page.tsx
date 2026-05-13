import Link from "next/link";

export const metadata = {
  title: "Refund Policy — Diyaa AI",
  description: "Diyaa AI refund and cancellation policy.",
};

export default function RefundPage() {
  return (
    <article className="space-y-10 max-w-3xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Refund Policy</h1>
        <p className="text-sm text-muted-foreground">Effective date: June 1, 2026</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">7-Day Money-Back Guarantee</h2>
        <p className="text-muted-foreground leading-7">
          If you subscribe to a paid plan for the first time and are not satisfied, you may request a
          full refund within 7 days of your initial payment. No questions asked.
        </p>
        <p className="text-muted-foreground leading-7">
          To request a refund, email{" "}
          <a href="mailto:support@diyaa.ai" className="underline">support@diyaa.ai</a> with the subject
          line &quot;Refund Request&quot; and include your account email. We will process the refund within 5-7
          business days to your original payment method.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">After 7 Days</h2>
        <p className="text-muted-foreground leading-7">
          After the 7-day window, subscription payments are non-refundable. You may cancel your
          subscription at any time, and you will retain access to paid features until the end of your
          current billing period.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Cancellation</h2>
        <p className="text-muted-foreground leading-7">
          You can cancel your subscription at any time from{" "}
          <strong>Settings → Billing → Manage Billing</strong>. Cancellation stops future renewals.
          Your account will remain on the paid plan until the end of the current billing period, then
          automatically downgrade to the Free plan.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Exceptions</h2>
        <p className="text-muted-foreground leading-7">
          We may issue refunds outside the 7-day window in exceptional circumstances, such as:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>Extended service outages that prevented you from using the platform</li>
          <li>Billing errors (duplicate charges, incorrect amounts)</li>
          <li>Cases where applicable consumer protection law requires a refund</li>
        </ul>
        <p className="text-muted-foreground leading-7 mt-3">
          Contact <a href="mailto:support@diyaa.ai" className="underline">support@diyaa.ai</a> to
          discuss your situation.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Annual Plans</h2>
        <p className="text-muted-foreground leading-7">
          Annual plan subscribers may request a prorated refund for unused months within the first 30
          days of purchase. After 30 days, annual plans are non-refundable.
        </p>
      </section>
    </article>
  );
}

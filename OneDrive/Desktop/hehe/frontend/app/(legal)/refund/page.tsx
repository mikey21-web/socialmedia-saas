export default function RefundPage() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Refund Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Effective date: June 1, 2026</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Monthly Plans</h2>
        <p className="leading-7 text-muted-foreground">
          Monthly subscriptions may be canceled at any time from the billing portal or by contacting support.
          We do not provide refunds or credits for partial monthly billing periods, unused features, or periods when the account remains active after cancellation.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Annual Plans</h2>
        <p className="leading-7 text-muted-foreground">
          Annual subscriptions are eligible for a refund within 14 days of the original purchase or renewal date.
          After the 14-day window, annual plan fees are non-refundable except where required by law.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">How to Request a Refund</h2>
        <p className="leading-7 text-muted-foreground">
          To request a refund, email support@diyaa.ai with your account email, workspace name, billing date, and reason for the request.
          Approved refunds are returned to the original payment method through Stripe and may take several business days to appear.
        </p>
      </section>
    </article>
  );
}

ALTER TABLE "Subscription" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "stripePriceId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "Subscription" ADD COLUMN "currentPeriodEnd" TIMESTAMP(3);

CREATE INDEX "Subscription_stripeCustomerId_idx" ON "Subscription"("stripeCustomerId");
CREATE INDEX "Subscription_stripePriceId_idx" ON "Subscription"("stripePriceId");

import { SetMetadata } from '@nestjs/common';
import { SUBSCRIPTION_FEATURE_KEY, SubscriptionFeature } from '../guards/subscription.guard';

export const SubscriptionFeatureLimit = (feature: SubscriptionFeature) =>
  SetMetadata(SUBSCRIPTION_FEATURE_KEY, feature);

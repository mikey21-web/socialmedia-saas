---
name: posthog
description: Implement product analytics with PostHog. Use when tracking user events, implementing feature flags, conducting A/B tests, setting up session recording, creating funnels/cohorts, or integrating PostHog with React/Next.js apps.
---

# PostHog Product Analytics Expert

## Setup

```bash
npm install posthog-js posthog-node
```

```typescript
// lib/posthog.ts (client)
import posthog from 'posthog-js'

export function initPostHog() {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      capture_pageview: false,  // handle manually in Next.js
      capture_pageleave: true,
      session_recording: { maskAllInputs: false },
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') ph.opt_out_capturing()
      },
    })
  }
}
```

```tsx
// app/providers.tsx (Next.js App Router)
'use client'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      posthog.capture('$pageview', { $current_url: window.location.href })
    }
  }, [pathname, searchParams])

  return null
}

export function PostHogProvider({ children }) {
  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PHProvider>
  )
}
```

## Event Tracking

```typescript
import posthog from 'posthog-js'

// Basic event
posthog.capture('button_clicked', {
  button_name: 'signup_cta',
  location: 'hero_section',
})

// User action with context
posthog.capture('checkout_completed', {
  plan: 'pro',
  billing_cycle: 'annual',
  amount: 99,
  currency: 'USD',
  items: ['feature_a', 'feature_b'],
})

// Form interaction
posthog.capture('form_submitted', {
  form_name: 'contact',
  fields_filled: 4,
  time_to_complete: 45,  // seconds
})

// Identify user (after login)
posthog.identify(user.id, {
  email: user.email,
  name: user.name,
  plan: user.subscription.plan,
  created_at: user.createdAt,
})

// Group (organization/team)
posthog.group('company', company.id, {
  name: company.name,
  plan: company.plan,
  employee_count: company.size,
})

// Reset on logout
posthog.reset()
```

## Feature Flags

```typescript
// Client-side
import { useFeatureFlagEnabled, useFeatureFlagPayload } from 'posthog-js/react'

function NewDashboard() {
  const isEnabled = useFeatureFlagEnabled('new-dashboard')
  const config = useFeatureFlagPayload('experiment-config')  // JSON payload

  if (!isEnabled) return <OldDashboard />
  return <NewDashboard config={config} />
}

// Imperative check
const isEnabled = posthog.isFeatureEnabled('beta-feature')
posthog.onFeatureFlags(() => {
  if (posthog.isFeatureEnabled('new-checkout')) {
    loadNewCheckout()
  }
})
```

```typescript
// Server-side (Node.js / Next.js)
import { PostHog } from 'posthog-node'

const posthog = new PostHog(process.env.POSTHOG_KEY!, {
  host: 'https://app.posthog.com',
})

// In API route or server component
const isEnabled = await posthog.isFeatureEnabled('new-feature', userId)
const flags = await posthog.getAllFlags(userId)

// Server-side event
posthog.capture({ distinctId: userId, event: 'api_called', properties: { endpoint: '/api/data' } })
await posthog.shutdown()  // flush in serverless
```

## A/B Testing

```typescript
// posthog automatically assigns users to variants
const variant = posthog.getFeatureFlag('checkout-button-test')
// variant will be 'control', 'variant_a', or 'variant_b'

function CheckoutButton() {
  const variant = useFeatureFlagVariantKey('checkout-cta-test')

  if (variant === 'bold_cta') return <button className="font-black text-xl">GET STARTED NOW →</button>
  if (variant === 'minimal_cta') return <button>Start free trial</button>
  return <button>Sign up</button>  // control
}

// Track variant exposure
posthog.capture('experiment_viewed', {
  experiment_name: 'checkout-cta-test',
  variant,
})
```

## React Hook Pattern

```typescript
// hooks/useAnalytics.ts
import posthog from 'posthog-js'

export function useAnalytics() {
  const track = (event: string, properties?: Record<string, any>) => {
    posthog.capture(event, properties)
  }

  const identify = (userId: string, traits?: Record<string, any>) => {
    posthog.identify(userId, traits)
  }

  return { track, identify }
}

// Usage
const { track } = useAnalytics()
<button onClick={() => track('upgrade_clicked', { source: 'banner', plan: 'pro' })}>
```

## Common Events to Track

```typescript
// User lifecycle
'user_signed_up'     // registration complete
'user_logged_in'     // each login
'user_upgraded'      // free → paid
'user_churned'       // subscription canceled

// Product engagement
'feature_used'       // { feature_name, ... }
'onboarding_step_completed' // { step_number, step_name }
'search_performed'   // { query, results_count }
'content_shared'     // { content_type, platform }

// Errors
'error_encountered'  // { error_code, error_message, page }
```

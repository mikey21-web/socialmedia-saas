---
name: sendgrid
description: Send transactional and marketing emails with SendGrid. Use when sending emails via SendGrid API, creating email templates, handling SendGrid webhooks/events, implementing email verification flows, managing mailing lists, or configuring SendGrid with Node.js/Python.
---

# SendGrid Expert Guide

## Setup

```bash
npm install @sendgrid/mail @sendgrid/client
```

```typescript
// lib/sendgrid.ts
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export { sgMail }
```

## Send Emails

```typescript
import sgMail from '@sendgrid/mail'

// Simple email
await sgMail.send({
  to: 'user@example.com',
  from: 'noreply@yourapp.com',  // must be verified in SendGrid
  subject: 'Welcome to our app!',
  text: 'Plain text body',
  html: '<h1>Welcome!</h1><p>Thanks for signing up.</p>',
})

// Send with template
await sgMail.send({
  to: 'user@example.com',
  from: { email: 'noreply@yourapp.com', name: 'Your App' },
  templateId: 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxx',  // Dynamic Template ID
  dynamicTemplateData: {
    firstName: 'Alice',
    orderNumber: '12345',
    items: [
      { name: 'Product A', price: '$29.99' },
    ],
    ctaUrl: 'https://app.com/orders/12345',
  },
})

// Send to multiple recipients
await sgMail.sendMultiple({
  to: ['user1@example.com', 'user2@example.com'],
  from: 'noreply@yourapp.com',
  subject: 'Newsletter',
  html: '<p>Your newsletter content</p>',
})

// Personalized batch (different data per recipient)
await sgMail.send({
  personalizations: [
    {
      to: [{ email: 'alice@example.com' }],
      dynamicTemplateData: { name: 'Alice', discount: '20%' },
    },
    {
      to: [{ email: 'bob@example.com' }],
      dynamicTemplateData: { name: 'Bob', discount: '15%' },
    },
  ],
  from: 'noreply@yourapp.com',
  templateId: 'd-xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
})
```

## Common Email Patterns

```typescript
// Welcome email
export async function sendWelcomeEmail(user: { email: string; name: string }) {
  await sgMail.send({
    to: user.email,
    from: { email: 'hello@yourapp.com', name: 'Your App' },
    templateId: process.env.SENDGRID_WELCOME_TEMPLATE_ID!,
    dynamicTemplateData: {
      firstName: user.name.split(' ')[0],
      dashboardUrl: `${process.env.BASE_URL}/dashboard`,
    },
  })
}

// Password reset
export async function sendPasswordReset(email: string, resetToken: string) {
  const resetUrl = `${process.env.BASE_URL}/reset-password?token=${resetToken}`
  await sgMail.send({
    to: email,
    from: 'security@yourapp.com',
    subject: 'Reset your password',
    html: `
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>If you didn't request this, ignore this email.</p>
    `,
  })
}

// Order confirmation with attachment
export async function sendOrderConfirmation(order: Order, pdfBuffer: Buffer) {
  await sgMail.send({
    to: order.customerEmail,
    from: 'orders@yourapp.com',
    subject: `Order #${order.id} confirmed`,
    templateId: process.env.SENDGRID_ORDER_TEMPLATE_ID!,
    dynamicTemplateData: {
      orderId: order.id,
      items: order.items,
      total: order.total,
    },
    attachments: [
      {
        content: pdfBuffer.toString('base64'),
        filename: `order-${order.id}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  })
}

// Email verification
export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.BASE_URL}/verify-email?token=${token}`
  await sgMail.send({
    to: email,
    from: 'noreply@yourapp.com',
    subject: 'Verify your email address',
    html: `<p>Click to verify: <a href="${verifyUrl}">Verify Email</a></p>`,
  })
}
```

## Error Handling

```typescript
import sgMail from '@sendgrid/mail'

try {
  await sgMail.send({ ... })
} catch (error: any) {
  if (error.response) {
    // SendGrid API error
    const { status, body } = error.response
    console.error('SendGrid error:', status, body.errors)

    // Common codes
    // 400 - Bad request (invalid fields)
    // 401 - Invalid API key
    // 403 - Forbidden (unverified sender)
    // 429 - Rate limit exceeded
  }
  throw error
}
```

## Inbound Email Parsing Webhook

```typescript
// Express route to receive inbound emails
import express from 'express'
import multer from 'multer'

const upload = multer()

app.post('/webhooks/email/inbound', upload.none(), (req, res) => {
  const from = req.body.from
  const to = req.body.to
  const subject = req.body.subject
  const text = req.body.text
  const html = req.body.html
  const attachments = JSON.parse(req.body.attachments || '{}')

  console.log(`Email from ${from} to ${to}: ${subject}`)
  // Process inbound email...

  res.status(200).send('OK')
})
```

## Event Webhook (Delivery Tracking)

```typescript
// Webhook to track email events
app.post('/webhooks/email/events', express.json(), async (req, res) => {
  const events = req.body  // array of events

  for (const event of events) {
    const { email, event: type, timestamp, sg_message_id } = event

    switch (type) {
      case 'delivered':
        await db.email.update({ where: { messageId: sg_message_id }, data: { status: 'delivered', deliveredAt: new Date(timestamp * 1000) } })
        break
      case 'open':
        await db.email.update({ where: { messageId: sg_message_id }, data: { openCount: { increment: 1 }, firstOpenAt: new Date(timestamp * 1000) } })
        break
      case 'click':
        await db.emailClick.create({ data: { messageId: sg_message_id, url: event.url, clickedAt: new Date(timestamp * 1000) } })
        break
      case 'bounce':
        await markEmailBounced(email, event.reason)
        break
      case 'unsubscribe':
        await unsubscribeEmail(email)
        break
      case 'spamreport':
        await handleSpamReport(email)
        break
    }
  }

  res.status(200).send('OK')
})
```

## Contact Management (Marketing)

```typescript
import client from '@sendgrid/client'
client.setApiKey(process.env.SENDGRID_API_KEY!)

// Add contact to list
async function addContact(email: string, firstName: string, listId: string) {
  await client.request({
    method: 'PUT',
    url: '/v3/marketing/contacts',
    body: {
      list_ids: [listId],
      contacts: [
        {
          email,
          first_name: firstName,
          custom_fields: {
            e1_T: 'custom_value',  // custom field ID + type
          },
        },
      ],
    },
  })
}

// Remove from list / unsubscribe
async function unsubscribeContact(email: string) {
  await client.request({
    method: 'POST',
    url: '/v3/asm/suppressions/global',
    body: { recipient_emails: [email] },
  })
}
```

## Environment Variables

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourapp.com
SENDGRID_WELCOME_TEMPLATE_ID=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_ORDER_TEMPLATE_ID=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Dynamic Template Syntax (Handlebars)

```html
<!-- In SendGrid Dynamic Template -->
<p>Hello {{firstName}},</p>

{{#if isPremium}}
  <p>Thanks for being a premium member!</p>
{{/if}}

{{#each items}}
  <li>{{this.name}} - {{this.price}}</li>
{{/each}}

<a href="{{ctaUrl}}">{{ctaText}}</a>

<!-- Unsubscribe link (required for marketing emails) -->
<a href="<%asm_preferences_raw_url%>">Manage Preferences</a>
<a href="<%asm_global_unsubscribe_raw_url%>">Unsubscribe</a>
```

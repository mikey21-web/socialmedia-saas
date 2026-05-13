---
name: evolution-api
description: Build WhatsApp automation with Evolution API (self-hosted, free). Use when sending WhatsApp messages, handling incoming messages/webhooks, building WhatsApp bots, automating customer communication, or integrating WhatsApp with Node.js backends.
---

# Evolution API Expert Guide

## Setup (Self-Hosted)

```bash
# Docker Compose setup (recommended for India)
docker-compose up -d

# Or install locally
npm install @evolution-api/client-sdk
```

```typescript
// lib/evolution.ts
import { Whatsapp } from '@evolution-api/client-sdk'

export const whatsapp = new Whatsapp({
  baseUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
  apiKey: process.env.EVOLUTION_API_KEY!,
})
```

## Send WhatsApp Messages

```typescript
import { whatsapp } from './lib/evolution'

// Send text message
await whatsapp.message.sendText({
  chatId: '917894561230',  // or group ID
  text: 'Hello! Your booking confirmation: Order #12345',
})

// Send with media
await whatsapp.message.sendMedia({
  chatId: '917894561230',
  mediaUrl: 'https://example.com/invoice.pdf',
  caption: 'Your invoice',
  mediaType: 'document',
})

// Send image
await whatsapp.message.sendMedia({
  chatId: '917894561230',
  mediaUrl: 'https://example.com/property.jpg',
  caption: '3BHK Apartment - ₹35,00,000',
  mediaType: 'image',
})

// Send template message (pre-approved templates)
await whatsapp.message.sendTemplate({
  chatId: '917894561230',
  templateName: 'booking_confirmation',
  templateLanguage: 'en',
  templateParams: {
    1: 'Order #12345',
    2: '₹5,00,000',
    3: 'March 20, 2026',
  },
})

// Send button message
await whatsapp.message.sendButtons({
  chatId: '917894561230',
  text: 'Select your preference:',
  buttons: [
    { id: '1', text: 'Schedule Demo' },
    { id: '2', text: 'Get Pricing' },
    { id: '3', text: 'Talk to Agent' },
  ],
})

// Send list message
await whatsapp.message.sendList({
  chatId: '917894561230',
  title: 'Select a project:',
  description: 'Choose from our active projects',
  sections: [
    {
      title: 'Premium',
      rows: [
        { id: '1', title: 'Archer Homes 3D', description: '₹40L - ₹65L' },
        { id: '2', title: 'Diana Apartments', description: '₹30L - ₹55L' },
      ],
    },
    {
      title: 'Affordable',
      rows: [
        { id: '3', title: 'Green Garden', description: '₹20L - ₹35L' },
      ],
    },
  ],
})
```

## Receive Messages & Webhooks

```typescript
// Express webhook handler
import express from 'express'

app.post('/webhooks/whatsapp', express.json(), async (req, res) => {
  const { event, data } = req.body

  if (event === 'messages.upsert') {
    const message = data.messages[0]
    const senderId = message.key.remoteJid
    const text = message.message.conversation || message.message.extendedTextMessage?.text

    console.log(`Message from ${senderId}: ${text}`)

    // Handle incoming message
    if (text?.toLowerCase().includes('demo')) {
      await whatsapp.message.sendText({
        chatId: senderId,
        text: 'Great! I can schedule a demo. What time works for you?',
      })
    }

    if (text?.toLowerCase().includes('price')) {
      await whatsapp.message.sendText({
        chatId: senderId,
        text: 'Our properties range from ₹20L to ₹65L. Send "projects" to see options.',
      })
    }
  }

  if (event === 'buttons.update') {
    const buttonId = data.button.buttonId
    const chatId = data.button.from

    console.log(`User selected button: ${buttonId}`)
    // Handle button selection
  }

  if (event === 'status_update') {
    console.log(`Message status: ${data.status}`)  // sent, delivered, read, failed
  }

  res.json({ success: true })
})
```

## Integration with n8n Automation

```typescript
// Send trigger to n8n workflow
async function triggerWhatsAppWorkflow(phoneNumber: string, event: string, data: any) {
  await fetch(process.env.N8N_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumber,
      event,
      data,
      timestamp: new Date(),
    }),
  })
}

// When message received from unknown number
app.post('/webhooks/whatsapp', async (req, res) => {
  const { data } = req.body
  const phoneNumber = data.messages[0].key.remoteJid
  const text = data.messages[0].message.conversation

  // Trigger n8n workflow for lead capture
  await triggerWhatsAppWorkflow(phoneNumber, 'new_lead', {
    phone: phoneNumber,
    firstMessage: text,
  })
})
```

## Broadcast Messages (To Multiple Users)

```typescript
// Send to multiple contacts
async function broadcastMessage(recipients: string[], message: string) {
  const promises = recipients.map((phoneNumber) =>
    whatsapp.message.sendText({
      chatId: phoneNumber,
      text: message,
    })
  )

  const results = await Promise.allSettled(promises)
  const successful = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  console.log(`Sent to ${successful}, failed: ${failed}`)
}

// Usage
await broadcastMessage(
  ['917894561230', '919876543210', '918765432109'],
  'New property listing! 3BHK at ₹35L. Send "details" for more info.'
)
```

## Group Management

```typescript
// Create group
const group = await whatsapp.group.create({
  subject: 'Archer Homes 3D - Buyers Group',
  participants: ['917894561230', '919876543210'],
})

// Send to group
await whatsapp.message.sendText({
  chatId: group.id,
  text: 'Welcome to Archer Homes! We will share updates here.',
})

// Add member
await whatsapp.group.addParticipants(group.id, ['918765432109'])

// Remove member
await whatsapp.group.removeParticipants(group.id, ['917894561230'])
```

## Webhook Events

```typescript
// All webhook event types
{
  'messages.upsert': 'New incoming message',
  'messages.update': 'Message status changed',
  'buttons.update': 'Button clicked by user',
  'presence.update': 'User online/offline status',
  'status_update': 'Message delivery status (sent/delivered/read/failed)',
  'message_create': 'Message created',
  'group_update': 'Group settings changed',
  'qr.code': 'QR code for scanning',
  'connection.update': 'WhatsApp connection status',
}
```

## Environment Variables

```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your_evolution_api_key
EVOLUTION_INSTANCE_NAME=whatsapp_bot
N8N_WEBHOOK_URL=https://n8n.yourapp.com/webhook/whatsapp-events
```

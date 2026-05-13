---
name: bullmq
description: Manage job queues with BullMQ and Redis. Use when handling background jobs, implementing task scheduling, processing async tasks, managing work queues, or integrating BullMQ with Node.js backends.
---

# BullMQ Expert Guide

## Setup

```bash
npm install bullmq redis
# Optional: dashboard UI
npm install @bull-board/express
```

```typescript
// lib/queue.ts
import { Queue, Worker, QueueScheduler } from 'bullmq'
import Redis from 'redis'

export const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
}

// Define queues
export const emailQueue = new Queue('emails', { connection: redisConnection })
export const reportQueue = new Queue('reports', { connection: redisConnection })
export const webhookQueue = new Queue('webhooks', { connection: redisConnection })
```

## Add Jobs to Queue

```typescript
import { emailQueue, reportQueue } from './lib/queue'

// Send welcome email (async)
async function onUserSignup(user: User) {
  await emailQueue.add(
    'send-welcome',
    {
      userId: user.id,
      email: user.email,
      name: user.name,
    },
    {
      delay: 1000,  // wait 1 second before processing
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    }
  )
}

// Generate monthly report (scheduled)
async function scheduleMonthlyReport() {
  await reportQueue.add(
    'generate-monthly',
    { month: new Date().getMonth() },
    {
      repeat: {
        pattern: '0 0 1 * *',  // cron: 1st of each month at midnight
      },
    }
  )
}

// Send webhook notification (with priority)
async function notifyWebhook(event: any) {
  await webhookQueue.add(
    'send-webhook',
    event,
    {
      priority: 10,  // higher priority = processed first
      attempts: 5,
    }
  )
}
```

## Process Jobs with Workers

```typescript
import { Worker } from 'bullmq'
import { emailQueue, redisConnection } from './lib/queue'

// Email worker
const emailWorker = new Worker(
  'emails',
  async (job) => {
    console.log(`Processing email job ${job.id}`)

    const { email, name } = job.data

    // Send email
    await sendEmail({
      to: email,
      subject: `Welcome, ${name}!`,
      template: 'welcome',
      data: { name },
    })

    // Update progress
    job.progress(50)

    // Log details
    job.log(`Email sent to ${email}`)

    return { success: true, timestamp: new Date() }
  },
  { connection: redisConnection, concurrency: 5 }  // process 5 jobs in parallel
)

// Report worker
const reportWorker = new Worker(
  'reports',
  async (job) => {
    const { month } = job.data

    // Generate report
    const report = await generateMonthlyReport(month)

    // Upload to S3
    const url = await uploadToS3(`reports/monthly-${month}.pdf`, report)

    return { reportUrl: url }
  },
  { connection: redisConnection, concurrency: 1 }  // process 1 at a time
)

// Webhook worker
const webhookWorker = new Worker(
  'webhooks',
  async (job) => {
    const { url, data } = job.data

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) throw new Error(`Webhook failed: ${response.status}`)

    return { status: 'delivered' }
  },
  { connection: redisConnection, concurrency: 10 }
)

// Listen to events
emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`)
})

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job.id} failed: ${err.message}`)
})

emailWorker.on('progress', (job, progress) => {
  console.log(`Email job ${job.id} progress: ${progress}%`)
})
```

## Use Queue Scheduler (for repeated jobs)

```typescript
import { QueueScheduler } from 'bullmq'

// Enable automatic scheduling
const scheduler = new QueueScheduler('emails', { connection: redisConnection })

// Cleanup completed jobs older than 1 hour
emailQueue.clean(3600000, 1000, 'completed')
```

## Real-Time Status Tracking

```typescript
import { emailQueue } from './lib/queue'

// Get job status
async function getJobStatus(jobId: string) {
  const job = await emailQueue.getJob(jobId)
  if (!job) return null

  const state = await job.getState()
  const progress = job.progress()
  const logs = job.logs

  return {
    id: job.id,
    state,  // 'completed', 'failed', 'active', 'delayed', 'waiting'
    progress,
    logs,
    data: job.data,
  }
}

// Get queue stats
async function getQueueStats() {
  const jobCounts = await emailQueue.getJobCounts()
  return {
    waiting: jobCounts.waiting,
    active: jobCounts.active,
    completed: jobCounts.completed,
    failed: jobCounts.failed,
    delayed: jobCounts.delayed,
  }
}
```

## Bull Board (Web Dashboard)

```typescript
import express from 'express'
import { createBullBoard } from '@bull-board/express'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { emailQueue, reportQueue, webhookQueue } from './lib/queue'

const app = express()

const { router, setQueues } = createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(reportQueue),
    new BullMQAdapter(webhookQueue),
  ],
  serverAdapter: new ExpressAdapter(),
})

app.use('/admin/queues', router)

// Access at http://localhost:3000/admin/queues
```

## Patterns: Real Estate Use Cases

```typescript
// Lead notification workflow
export const leadNotificationQueue = new Queue('lead-notifications', { connection: redisConnection })

// 1. New lead arrives → trigger WhatsApp + email + webhook
async function onNewLead(lead: Lead) {
  // Send immediately
  await leadNotificationQueue.add(
    'notify-team',
    { leadId: lead.id, phone: lead.phone },
    { priority: 20 }  // high priority
  )

  // Schedule follow-up reminder in 1 hour
  await leadNotificationQueue.add(
    'followup-reminder',
    { leadId: lead.id },
    { delay: 3600000 }
  )
}

const leadWorker = new Worker(
  'lead-notifications',
  async (job) => {
    if (job.name === 'notify-team') {
      const { leadId, phone } = job.data
      await whatsappQueue.add('send', { to: phone, message: `New lead: ${leadId}` })
      await emailQueue.add('send-welcome', { leadId })
    }
  },
  { connection: redisConnection, concurrency: 10 }
)

// Booking confirmation workflow
export const bookingQueue = new Queue('bookings', { connection: redisConnection })

async function onBookingConfirmed(booking: Booking) {
  // Send confirmation
  await bookingQueue.add('send-confirmation', { bookingId: booking.id })

  // Schedule reminder 1 day before
  const daysUntilBooking = Math.ceil((booking.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const delayMs = (daysUntilBooking - 1) * 24 * 60 * 60 * 1000

  await bookingQueue.add('send-reminder', { bookingId: booking.id }, { delay: delayMs })
}
```

## Environment Variables

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional
```

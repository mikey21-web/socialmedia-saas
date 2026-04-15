/**
 * Lead Nurture Agent
 * Sends personalized follow-up sequences to qualified leads
 */

import type { QualifiedLead } from './qualifier';

export interface NurtureMessage {
  leadId: string;
  leadName: string;
  messageId: string;
  channel: 'email' | 'linkedin' | 'sms';
  subject?: string;
  body: string;
  sentAt: string;
}

export interface NurtureResult {
  count: number;
  sent: NurtureMessage[];
  avgDeliveryTime: number;
}

const NURTURE_TEMPLATES = {
  email: {
    subject: 'Let\'s connect - {name}',
    body: 'Hi {name},\n\nI noticed your interest in {industry}. We specialize in helping {industry} businesses scale with automation.\n\nWould love to connect and explore opportunities.\n\nBest,\nThe Team',
  },
  linkedin: {
    body: 'Hi {name}, just came across your profile. Impressed by your work at {company}. Let\'s connect!',
  },
  sms: {
    body: 'Hi {name}, your personalized lead nurture campaign is ready. Reply LEARN to get started.',
  },
};

export async function sendNurture(leads: QualifiedLead[]): Promise<NurtureResult> {
  const sent: NurtureMessage[] = [];

  for (const lead of leads) {
    // Send email to high-fit leads
    if (lead.fitLevel === 'high' && lead.email) {
      const emailTemplate = NURTURE_TEMPLATES.email;
      sent.push({
        leadId: lead.id,
        leadName: lead.name,
        messageId: `nurture-email-${lead.id}`,
        channel: 'email',
        subject: emailTemplate.subject.replace('{name}', lead.name),
        body: emailTemplate.body
          .replace('{name}', lead.name)
          .replace('{industry}', lead.industry || 'your sector'),
        sentAt: new Date().toISOString(),
      });
    }

    // Send LinkedIn message to all qualified leads
    const linkedinTemplate = NURTURE_TEMPLATES.linkedin;
    sent.push({
      leadId: lead.id,
      leadName: lead.name,
      messageId: `nurture-linkedin-${lead.id}`,
      channel: 'linkedin',
      body: linkedinTemplate.body
        .replace('{name}', lead.name)
        .replace('{company}', lead.company),
      sentAt: new Date().toISOString(),
    });

    // Send SMS to high-fit leads with phone numbers
    if (lead.fitLevel === 'high' && lead.phone) {
      const smsTemplate = NURTURE_TEMPLATES.sms;
      sent.push({
        leadId: lead.id,
        leadName: lead.name,
        messageId: `nurture-sms-${lead.id}`,
        channel: 'sms',
        body: smsTemplate.body.replace('{name}', lead.name.split(' ')[0]),
        sentAt: new Date().toISOString(),
      });
    }
  }

  // Calculate average delivery time (simulated)
  const avgDeliveryTime = sent.length > 0 ? Math.random() * 5000 + 1000 : 0;

  return {
    count: sent.length,
    sent,
    avgDeliveryTime,
  };
}

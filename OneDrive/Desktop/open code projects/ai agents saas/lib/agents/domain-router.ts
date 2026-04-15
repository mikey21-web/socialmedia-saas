import { BusinessContext, BusinessTypeOption } from './executor-types';

export interface DomainTemplate {
  domain: string;
  agentWeights: Record<string, number>;
}

// Domain templates for each business type
const DOMAIN_TEMPLATES: Record<BusinessTypeOption, DomainTemplate> = {
  real_estate: {
    domain: 'real_estate',
    agentWeights: {
      'lead_finder': 0.3,
      'contact_enrichment': 0.2,
      'outreach_automator': 0.3,
      'follow_up_manager': 0.2,
    }
  },
  ecommerce: {
    domain: 'ecommerce',
    agentWeights: {
      'product_lister': 0.3,
      'customer_support': 0.2,
      'marketing_automation': 0.3,
      'order_manager': 0.2,
    }
  },
  coaching: {
    domain: 'coaching',
    agentWeights: {
      'student_onboarding': 0.3,
      'content_delivery': 0.2,
      'engagement': 0.3,
      'feedback_collector': 0.2,
    }
  },
  manufacturing: {
    domain: 'manufacturing',
    agentWeights: {
      'production_scheduler': 0.3,
      'inventory_tracker': 0.3,
      'supplier_manager': 0.2,
      'quality_auditor': 0.2,
    }
  },
  healthcare: {
    domain: 'healthcare',
    agentWeights: {
      'appointment_scheduler': 0.3,
      'patient_intake': 0.2,
      'billing_agent': 0.3,
      'follow_up_care': 0.2,
    }
  },
  saas: {
    domain: 'saas',
    agentWeights: {
      'user_onboarding': 0.3,
      'support_agent': 0.2,
      'upsell_agent': 0.3,
      'retention_agent': 0.2,
    }
  },
  services: {
    domain: 'services',
    agentWeights: {
      'quote_generator': 0.3,
      'client_manager': 0.2,
      'invoice_generator': 0.3,
      'feedback_collector': 0.2,
    }
  },
  unknown: {
    domain: 'discovery',
    agentWeights: {
      'discovery_agent': 1.0,
    }
  }
};

const SYSTEM_PROMPTS: Record<BusinessTypeOption, string> = {
  real_estate: 'You are an AI assistant specialized in real estate operations. Help with lead management, property matching, and client communication.',
  ecommerce: 'You are an AI assistant specialized in ecommerce operations. Help with product management, customer support, and sales optimization.',
  coaching: 'You are an AI assistant specialized in online coaching platforms. Help with student engagement, course delivery, and progress tracking.',
  manufacturing: 'You are an AI assistant specialized in manufacturing operations. Help with production scheduling, inventory management, and quality control.',
  healthcare: 'You are an AI assistant specialized in healthcare operations. Help with appointment scheduling, patient intake, and follow-up care.',
  saas: 'You are an AI assistant specialized in SaaS operations. Help with user onboarding, support, and retention.',
  services: 'You are an AI assistant specialized in service-based businesses. Help with quote generation, client management, and invoicing.',
  unknown: 'You are a discovery assistant helping to understand business needs and recommend automation solutions.'
};

/**
 * Get domain template for a business context
 */
export function getDomainTemplate(context: BusinessContext): DomainTemplate {
  return DOMAIN_TEMPLATES[context.businessType] || DOMAIN_TEMPLATES['unknown'];
}

/**
 * Get system prompt for a business context
 */
export function getSystemPrompt(context: BusinessContext): string {
  const basePrompt = SYSTEM_PROMPTS[context.businessType] || SYSTEM_PROMPTS['unknown'];
  if (context.industry && context.industry !== 'unknown') {
    return `${basePrompt} Focus on the ${context.industry} industry.`;
  }
  return basePrompt;
}

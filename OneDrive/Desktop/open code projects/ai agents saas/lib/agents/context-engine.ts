import { BusinessTypeOption } from './executor-types';

export interface ClassificationResult {
  businessType: BusinessTypeOption;
  confidence: number;
}

/**
 * Classifies business type from conversation
 * For testing/demo purposes, uses pattern matching
 */
export async function classifyBusinessType(conversation: string): Promise<ClassificationResult> {
  const lowerConv = conversation.toLowerCase();

  // Pattern-based classification for testing
  const patterns: [BusinessTypeOption, RegExp][] = [
    ['real_estate', /real estate|realtor|broker|property|agent|listing|mls/i],
    ['ecommerce', /ecommerce|e-commerce|online store|shopify|store|sell online|products/i],
    ['coaching', /coaching|coach|course|student|program|learning|mentor/i],
    ['healthcare', /healthcare|hospital|clinic|medical|doctor|patient|health/i],
    ['saas', /saas|software|app|platform|subscription|api/i],
    ['manufacturing', /manufacturing|factory|production|plant|warehouse/i],
    ['services', /services|consulting|agency|freelance|client/i],
  ];

  for (const [type, pattern] of patterns) {
    if (pattern.test(lowerConv)) {
      return {
        businessType: type,
        confidence: 0.85
      };
    }
  }

  return {
    businessType: 'unknown',
    confidence: 0.5
  };
}

export type CarouselVibeChoice = 'last_used' | 'saved_profile' | 'generic_default' | 'new_custom';

export interface CarouselBrief {
  topic: string;
  slideCount: number;
  vibeChoice: CarouselVibeChoice;
  brandVoiceProfileId?: string;
  customBrandDetails?: {
    primaryColor: string;
    fontPreference: string;
    tone: string;
  };
  contentSource?: string;
}

export interface CarouselSlide {
  slideNumber: number;
  role: 'hook' | 'problem' | 'solution' | 'detail' | 'proof' | 'cta';
  headline: string;
  body: string;
  copyText: string;
  designTokens: {
    background: string;
    foreground: string;
    accent: string;
  };
}

export interface CarouselPalette {
  primaryColor: string;
  brandLight: string;
  brandDark: string;
  lightBg: string;
  lightBorder: string;
  darkBg: string;
}

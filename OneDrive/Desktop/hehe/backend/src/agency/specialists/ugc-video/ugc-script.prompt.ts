/**
 * UGC Video Script Prompt — generates TikTok/Reels-style scripts
 * with hook, talking points, and CTA.
 */

export interface UgcScriptBrief {
  teamId: string;
  topic: string;
  platform: 'tiktok' | 'instagram' | 'youtube_shorts' | 'facebook';
  brandName: string;
  brandVoice: {
    formality: number;
    energy: number;
    humor: number;
    vocabulary: string[];
    emojiUsage: string;
  };
  trendContext?: string;
  targetAudience?: string;
  videoStyle: 'talking_head' | 'voiceover_broll' | 'mixed';
  maxDurationSec: number;
}

export interface UgcScript {
  hook: string;
  hookDurationSec: number;
  segments: {
    text: string;
    durationSec: number;
    visualDirection: string;
    type: 'talking_head' | 'broll';
  }[];
  cta: string;
  ctaDurationSec: number;
  totalDurationSec: number;
  hashtags: string[];
  caption: string;
  thumbnailPrompt: string;
}

export interface BrollPrompt {
  prompt: string;
  durationSec: number;
  style: string;
}

export function buildUgcScriptPrompt(brief: UgcScriptBrief): string {
  const platformTips: Record<string, string> = {
    tiktok: 'Gen-Z energy, fast cuts, trending sounds reference. First 1-2 seconds MUST hook. Use "POV:", "Wait for it", "Nobody talks about this" style hooks.',
    instagram: 'Clean aesthetic, value-driven. Hook with a bold statement or question. Carousel-style talking points work well in Reels too.',
    youtube_shorts: 'Slightly longer hooks OK (3s). Educational lean. "Here\'s what nobody tells you about..." works great.',
    facebook: 'Slightly more mature tone. Storytelling hooks. "I tried X for 30 days and here\'s what happened" format.',
  };

  return `You are a UGC video scriptwriter for ${brief.brandName}.

PLATFORM: ${brief.platform}
PLATFORM TIPS: ${platformTips[brief.platform] ?? 'Engaging, scroll-stopping content'}
VIDEO STYLE: ${brief.videoStyle}
MAX DURATION: ${brief.maxDurationSec} seconds
TOPIC: ${brief.topic}
${brief.trendContext ? `TREND CONTEXT: ${brief.trendContext}` : ''}
${brief.targetAudience ? `TARGET AUDIENCE: ${brief.targetAudience}` : ''}

BRAND VOICE:
- Formality: ${brief.brandVoice.formality}/10
- Energy: ${brief.brandVoice.energy}/10
- Humor: ${brief.brandVoice.humor}/10
- Key words to use: ${brief.brandVoice.vocabulary.slice(0, 10).join(', ')}
- Emoji style: ${brief.brandVoice.emojiUsage}

SCRIPTWRITING RULES:
1. HOOK must be in the first 2 seconds — pattern interrupt, bold claim, or question
2. Each segment should be 3-8 seconds of speaking
3. For "talking_head" style: write conversational, like talking to a friend
4. For "voiceover_broll" style: write narration + describe the visual for each segment
5. For "mixed" style: alternate between talking head and b-roll segments
6. CTA must feel natural, not salesy — "follow for more", "save this", "comment X if you agree"
7. Total script MUST fit within ${brief.maxDurationSec} seconds (assume ~2.5 words per second speaking pace)
8. Write the script in the brand voice — match the energy level and formality
9. Caption should be optimized for the platform's algorithm
10. Thumbnail prompt should describe an eye-catching freeze frame

OUTPUT JSON ONLY:
{
  "hook": "The first 1-2 sentences that stop the scroll",
  "hookDurationSec": 2,
  "segments": [
    {
      "text": "What the person says or narration",
      "durationSec": 5,
      "visualDirection": "Description of what should be on screen",
      "type": "talking_head" | "broll"
    }
  ],
  "cta": "Call to action at the end",
  "ctaDurationSec": 3,
  "totalDurationSec": 25,
  "hashtags": ["#relevant", "#trending"],
  "caption": "The post caption optimized for this platform",
  "thumbnailPrompt": "Description for AI image generation of the thumbnail"
}`;
}

export function buildBrollPrompts(script: UgcScript): BrollPrompt[] {
  return script.segments
    .filter((s) => s.type === 'broll')
    .map((s) => ({
      prompt: `Cinematic b-roll footage: ${s.visualDirection}. Professional quality, smooth motion, vibrant colors. Social media content style.`,
      durationSec: s.durationSec,
      style: 'cinematic',
    }));
}

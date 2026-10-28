import { getProfile, getSetting } from './db';
import { PLATFORM_META, PLATFORMS } from './types';
import type { GeneratedPost, Platform, Tone } from './types';

const TONES: Tone[] = ['professional', 'casual', 'funny', 'inspirational', 'bold'];

export interface GenerateInput {
  topic: string;
  platforms: Platform[];
  tone?: Tone;
  count?: number;
  keywords?: string[];
}

export interface GenerateResult {
  posts: GeneratedPost[];
  mode: 'live' | 'mock';
  model: string;
  warning?: string;
}

export function getGroqKey(): string {
  const fromEnv = (process.env.GROQ_API_KEY || '').trim();
  if (fromEnv) return fromEnv;
  return (getSetting('groq_api_key') || '').trim();
}

export function getAiConfig(): { configured: boolean; mode: 'live' | 'mock'; model: string } {
  const configured = Boolean(getGroqKey()) && process.env.GROQ_FORCE_MOCK !== 'true';
  return {
    configured,
    mode: configured ? 'live' : 'mock',
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  };
}

function cleanHashtags(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const raw of values) {
    const tag = raw.replace(/^#+/, '').replace(/[^a-zA-Z0-9_]/g, '');
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(tag);
    if (output.length >= 5) break;
  }
  return output;
}

function hashtagsFor(topic: string, keywords: string[], platform: Platform): string[] {
  const base = keywords.length
    ? keywords
    : topic
        .split(/[^a-zA-Z0-9]+/)
        .filter((word) => word.length > 3)
        .slice(0, 3);
  const platformTag: Record<Platform, string> = {
    linkedin: 'linkedin',
    x: 'buildinpublic',
    instagram: 'contentcreator',
    facebook: 'smallbusiness',
    tiktok: 'learnontiktok',
    youtube: 'youtubeshorts',
  };
  return cleanHashtags([...base, platformTag[platform], 'aiautomation']);
}

function truncateForPlatform(content: string, platform: Platform): string {
  const limit = PLATFORM_META[platform].limit;
  if (content.length <= limit) return content;
  return `${content.slice(0, limit - 3).trimEnd()}...`;
}

const openingByTone: Record<Tone, string[]> = {
  professional: [
    'Here is what most people miss about {topic}:',
    'A quick observation after working on {topic}:',
    'Three things we learned about {topic} this month:',
    'The practical version of {topic} looks like this:',
  ],
  casual: [
    'Honest take on {topic}:',
    'Something we keep coming back to:',
    'Quick thought on {topic} while the coffee is still warm:',
    'No fancy framework here, just this:',
  ],
  funny: [
    'Me, pretending to understand {topic} five minutes before the call:',
    'If {topic} had a loyalty program, we would be platinum members by now.',
    'Nobody warned me that {topic} would turn into a personality trait.',
    'A totally serious update on {topic}, definitely not written at 11pm:',
  ],
  inspirational: [
    'Small progress on {topic} still counts.',
    'The best time to start {topic} was last quarter. The second best time is today.',
    'You do not need permission to take {topic} seriously.',
    'One honest attempt at {topic} beats ten perfect plans.',
  ],
  bold: [
    'Unpopular opinion about {topic}:',
    'Most advice about {topic} is backwards.',
    'Stop optimizing {topic} before you understand it.',
    'Nobody talks about the uncomfortable part of {topic}:',
  ],
};

const bodyByTone: Record<Tone, string[]> = {
  professional: [
    'The teams getting results are not doing more. They are removing the handoffs where context gets lost.\n\nOne clear owner, one weekly review, one decision. That is usually enough to move the number.',
    'We tracked every step from idea to published post for 30 days. The bottleneck was never creativity. It was approval, formatting, and remembering to hit publish.\n\nAutomate those three and output doubles.',
    'A useful test: can a new teammate explain your process in two minutes? If not, the process is still in your head, not in the system.\n\nWrite it down, then automate the repeatable parts.',
    'The highest-leverage change was a 15-minute weekly review. What worked, what flopped, what gets another run.\n\nNo dashboard required. Just a decision and a date.',
  ],
  casual: [
    'We stopped chasing perfect and started shipping one useful thing every day. The weird part? The "boring" posts get the most replies.\n\nConsistency is underrated.',
    'Turns out the hard part is not writing the post. It is deciding what not to post.\n\nFewer ideas, better execution.',
    'We keep a running doc of customer questions. Every real question becomes a post.\n\nZero guessing. The audience literally tells you what they want.',
    'The best content system is the one you will still use on a bad week.\n\nOurs is three bullet points and a 20-minute timer.',
  ],
  funny: [
    'Our content calendar has two modes: "we are so back" and "please do not look at last week."\n\nWe are working on a third mode called consistency.',
    'The algorithm has officially seen more of my drafts than my friends have.\n\nAt this point it should be paying rent.',
    'I made a "quick" automation that now has its own automation. It is automations all the way down.\n\nSend help, or at least a webhook.',
    'Nothing humbles you faster than scheduling a post for the wrong timezone.\n\nAnyway, good morning to everyone except time zones.',
  ],
  inspirational: [
    'You do not need a bigger audience. You need a clearer reason for the one you have to come back.\n\nStart with one useful idea, published on time.',
    'The compounding is invisible for weeks and then suddenly obvious. Keep the cadence.\n\nShow up before the proof arrives.',
    'Someone out there is one practical post away from solving the problem you solved last year. Write it down.\n\nYour experience is the shortcut.',
    'Progress rarely feels like progress while it is happening. It feels like showing up again.\n\nSo show up again.',
  ],
  bold: [
    'Most content advice is designed for people who already have distribution. It ignores the part where you have to earn attention first.\n\nEarn it with specifics, not slogans.',
    'If your strategy cannot survive a busy week, it is not a strategy. It is a mood board.\n\nBuild for the week when nobody has time.',
    'You are not behind. You are just comparing your process to someone else\'s highlight reel.\n\nRun your own cadence.',
    'The uncomfortable truth: the post you are afraid to publish is usually the one your best customer needs to read.\n\nPublish it.',
  ],
};

const closingByTone: Record<Tone, string[]> = {
  professional: ['What would you add?', 'Curious how other teams handle this.', 'Happy to share the checklist if useful.'],
  casual: ['That is the whole update. Back to work.', 'Anyway, that is what is working for us.', 'Curious what you are trying.'],
  funny: ['Anyway, the automation is thriving.', 'I will be here, refreshing analytics.', 'No notes. Only caffeine.'],
  inspirational: ['Keep going.', 'One step today is enough.', 'You are closer than it feels.'],
  bold: ['Argue with me in the comments.', 'Prove me wrong.', 'Try it for two weeks and report back.'],
};

const platformShape: Record<Platform, (paragraphs: string[]) => string> = {
  linkedin: (paragraphs) => paragraphs.join('\n\n'),
  x: (paragraphs) => paragraphs.join(' ').replace(/\s+/g, ' ').slice(0, 250),
  instagram: (paragraphs) => paragraphs.slice(0, 2).join('\n\n'),
  facebook: (paragraphs) => paragraphs.join('\n\n'),
  tiktok: (paragraphs) => paragraphs.slice(0, 2).join(' '),
  youtube: (paragraphs) => paragraphs.join('\n\n'),
};

function mockGenerate(input: GenerateInput): GenerateResult {
  const profile = getProfile();
  const topic = input.topic.trim() || 'building a content system that lasts';
  const tone = input.tone ?? profile.tone ?? 'professional';
  const count = Math.min(Math.max(input.count ?? 3, 1), 10);
  const platforms = input.platforms.length ? input.platforms : (['linkedin'] as Platform[]);
  const keywords = input.keywords ?? [];

  const posts: GeneratedPost[] = [];
  for (let index = 0; index < count; index += 1) {
    const platform = platforms[index % platforms.length];
    const openers = openingByTone[tone];
    const bodies = bodyByTone[tone];
    const closers = closingByTone[tone];
    const opener = openers[index % openers.length].replace('{topic}', topic);
    const body = bodies[(index + 1) % bodies.length];
    const closer = closers[index % closers.length];
    const shaped = platformShape[platform]([opener, body, closer]);
    const content = truncateForPlatform(shaped, platform);
    posts.push({
      platform,
      content,
      hashtags: hashtagsFor(topic, keywords, platform),
      tone,
    });
  }

  return {
    posts,
    mode: 'mock',
    model: 'local-mock-generator',
    warning: 'No GROQ_API_KEY configured, so realistic mock captions were generated instead.',
  };
}

function buildPrompt(input: GenerateInput, profile: ReturnType<typeof getProfile>): string {
  const tone = input.tone ?? profile.tone ?? 'professional';
  const platforms = input.platforms.length ? input.platforms : (['linkedin'] as Platform[]);
  const count = Math.min(Math.max(input.count ?? 3, 1), 10);
  return `You write social media posts for ${profile.name} at ${profile.company}.
Niche: ${profile.niche}
Brand voice: ${profile.brandVoice}
Website: ${profile.website}
Signature: ${profile.signature}

Create exactly ${count} ready-to-publish social media posts about this topic: "${input.topic}"
Tone: ${tone}
Platforms to distribute across: ${platforms.join(', ')}
${input.keywords?.length ? `Keywords to include naturally: ${input.keywords.join(', ')}` : ''}

Rules:
- Write like a specific human operator, not a generic AI assistant.
- No em-dashes, no hashtags inside the caption text, no preamble, no "Here is".
- Use concrete details, numbers, or examples where possible.
- Respect platform limits: X is 280 characters, LinkedIn 3000, Instagram 2200, TikTok 2200, YouTube 5000, Facebook 63206.
- Distribute posts across the requested platforms (one platform per post).
- 3 to 5 hashtags per post, lowercase, no # symbol in the array.
- Avoid corporate filler: leverage, synergy, game-changer, unlock, dive into.
- Each post must stand alone and sound different from the others.

Return strict JSON in this shape:
{"posts":[{"platform":"linkedin","content":"caption text","hashtags":["tag1","tag2"],"tone":"${tone}"}]}`;
}

export async function generatePosts(input: GenerateInput): Promise<GenerateResult> {
  if (!input.topic?.trim()) throw new Error('Topic is required');
  const ai = getAiConfig();
  if (!ai.configured) return mockGenerate(input);

  const profile = getProfile();
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getGroqKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ai.model,
        temperature: 0.85,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a senior social media strategist. You only return valid JSON. You never add commentary outside JSON.',
          },
          { role: 'user', content: buildPrompt(input, profile) },
        ],
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Groq responded with ${response.status}: ${detail.slice(0, 240)}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = payload.choices?.[0]?.message?.content ?? '';
    const parsed = JSON.parse(raw) as { posts?: unknown };
    const items = Array.isArray(parsed.posts) ? parsed.posts : Array.isArray(parsed) ? parsed : [];
    const platformList = input.platforms.length ? input.platforms : (['linkedin'] as Platform[]);

    const posts: GeneratedPost[] = [];
    for (const item of items as Array<Record<string, unknown>>) {
      const platform = String(item.platform ?? '').toLowerCase() as Platform;
      if (!(PLATFORMS as readonly string[]).includes(platform)) continue;
      const content = String(item.content ?? '').trim();
      if (!content) continue;
      const hashtags = Array.isArray(item.hashtags) ? cleanHashtags(item.hashtags.map(String)) : [];
      posts.push({
        platform,
        content: truncateForPlatform(content, platform),
        hashtags: hashtags.length ? hashtags : hashtagsFor(input.topic, input.keywords ?? [], platform),
        tone: (TONES as string[]).includes(String(item.tone)) ? (item.tone as Tone) : input.tone ?? profile.tone,
      });
      if (posts.length >= Math.min(Math.max(input.count ?? 3, 1), 10)) break;
    }

    if (posts.length === 0) throw new Error('Groq returned no usable posts');
    for (let index = posts.length; index < Math.min(Math.max(input.count ?? 3, 1), 10); index += 1) {
      const platform = platformList[index % platformList.length];
      posts.push({
        platform,
        content: `A practical note on ${input.topic}:\n\nThe teams that win are the ones who ship one clear idea at a time and review what worked.\n\nWhat would you add?`,
        hashtags: hashtagsFor(input.topic, input.keywords ?? [], platform),
        tone: input.tone ?? profile.tone,
      });
    }

    return { posts, mode: 'live', model: ai.model };
  } catch (error) {
    const fallback = mockGenerate(input);
    fallback.warning = `Groq call failed (${(error as Error).message}). Mock captions were generated instead so you can keep working.`;
    return fallback;
  }
}


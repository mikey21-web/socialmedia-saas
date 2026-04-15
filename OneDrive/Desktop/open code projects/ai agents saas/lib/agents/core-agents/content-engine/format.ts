import { WrittenContent } from './write';

export interface FormattedContent {
  formatted: boolean;
  sections: number;
  formattedContent: string;
  metadata: Record<string, unknown>;
}

export const formatContent = async (written: WrittenContent): Promise<FormattedContent> => {
  return {
    formatted: true,
    sections: written.outline.length,
    formattedContent: `<h1>Content</h1><p>${written.content}</p>`,
    metadata: {
      wordCount: written.wordCount,
      readingTime: Math.ceil(written.wordCount / 200),
    },
  };
};

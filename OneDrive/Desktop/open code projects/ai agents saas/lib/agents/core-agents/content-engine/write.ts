import { ResearchResult } from './research';

export interface WrittenContent {
  wordCount: number;
  content: string;
  outline: string[];
}

export const writeContent = async (research: ResearchResult): Promise<WrittenContent> => {
  return {
    wordCount: 2000,
    content: `Content about ${research.topics[0]}. ${research.insights.join('. ')}`,
    outline: ['Introduction', 'Main Points', 'Analysis', 'Conclusion'],
  };
};

import { PatternDetector } from '../types';
import { AiVocabularyDetector } from './ai-vocabulary.detector';
import { SignificanceInflationDetector } from './significance-inflation.detector';
import { NotabilityClaimsDetector } from './notability-claims.detector';
import { IngSuperficialityDetector } from './ing-superficiality.detector';
import { PromotionalLanguageDetector } from './promotional-language.detector';
import { VagueAttributionDetector } from './vague-attribution.detector';
import { FormulaicChallengesDetector } from './formulaic-challenges.detector';
import { CopulaAvoidanceDetector } from './copula-avoidance.detector';
import { NegativeParallelismDetector } from './negative-parallelism.detector';
import { RuleOfThreeDetector } from './rule-of-three.detector';
import { SynonymCyclingDetector } from './synonym-cycling.detector';
import { FalseRangesDetector } from './false-ranges.detector';
import { EmDashOveruseDetector } from './em-dash-overuse.detector';
import { ExcessiveBoldDetector } from './excessive-bold.detector';
import { InlineHeaderListsDetector } from './inline-header-lists.detector';
import { TitleCaseHeadingsDetector } from './title-case-headings.detector';
import { MechanicalEmojisDetector } from './mechanical-emojis.detector';
import { CurlyQuotesDetector } from './curly-quotes.detector';
import { ChatbotArtifactsDetector } from './chatbot-artifacts.detector';
import { KnowledgeCutoffDisclaimersDetector } from './knowledge-cutoff-disclaimers.detector';
import { SycophanticToneDetector } from './sycophantic-tone.detector';
import { FillerPhrasesDetector } from './filler-phrases.detector';
import { ExcessiveHedgingDetector } from './excessive-hedging.detector';
import { GenericPositiveConclusionDetector } from './generic-positive-conclusion.detector';

export function getAllDetectors(): PatternDetector[] {
  return [
    new SignificanceInflationDetector(),
    new NotabilityClaimsDetector(),
    new IngSuperficialityDetector(),
    new PromotionalLanguageDetector(),
    new VagueAttributionDetector(),
    new FormulaicChallengesDetector(),
    new FalseRangesDetector(),
    new AiVocabularyDetector(),
    new CopulaAvoidanceDetector(),
    new NegativeParallelismDetector(),
    new SynonymCyclingDetector(),
    new EmDashOveruseDetector(),
    new ExcessiveBoldDetector(),
    new InlineHeaderListsDetector(),
    new TitleCaseHeadingsDetector(),
    new MechanicalEmojisDetector(),
    new CurlyQuotesDetector(),
    new ChatbotArtifactsDetector(),
    new KnowledgeCutoffDisclaimersDetector(),
    new SycophanticToneDetector(),
    new FillerPhrasesDetector(),
    new ExcessiveHedgingDetector(),
    new GenericPositiveConclusionDetector(),
  ];
}

export {
  AiVocabularyDetector,
  SignificanceInflationDetector,
  NotabilityClaimsDetector,
  IngSuperficialityDetector,
  PromotionalLanguageDetector,
  VagueAttributionDetector,
  FormulaicChallengesDetector,
  CopulaAvoidanceDetector,
  NegativeParallelismDetector,
  RuleOfThreeDetector,
  SynonymCyclingDetector,
  FalseRangesDetector,
  EmDashOveruseDetector,
  ExcessiveBoldDetector,
  InlineHeaderListsDetector,
  TitleCaseHeadingsDetector,
  MechanicalEmojisDetector,
  CurlyQuotesDetector,
  ChatbotArtifactsDetector,
  KnowledgeCutoffDisclaimersDetector,
  SycophanticToneDetector,
  FillerPhrasesDetector,
  ExcessiveHedgingDetector,
  GenericPositiveConclusionDetector,
};

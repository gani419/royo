export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type LikelihoodLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PossibleCause {
  component: string;
  likelihood: LikelihoodLevel;
  explanation: string;
}

export interface TroubleshootingStep {
  stepNumber: number;
  instruction: string;
  safetyPrecaution?: string;
  difficulty?: 'EASY' | 'MODERATE' | 'ADVANCED';
  toolsRequired?: string[];
}

export interface AIStructuredResponse {
  responseText: string;
  possibleCauses: PossibleCause[];
  followUpQuestions: string[];
  troubleshootingSteps: TroubleshootingStep[];
  youtubeSearchQueries: string[];
  safetyWarnings: string[];
  professionalHelpRecommended: boolean;
}


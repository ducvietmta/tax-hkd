export type PathId = 'individual' | 'household' | 'platform';

export interface LegalRef {
  label: string;
  docId?: string;
  note?: string;
}

export interface RegDocument {
  id: string;
  label: string;
  description?: string;
  optional?: boolean;
}

export interface RegStep {
  id: string;
  title: string;
  summary: string;
  actions: string[];
  documents?: RegDocument[];
  where?: {
    label: string;
    url: string;
    note?: string;
  };
  fee?: string;
  duration?: string;
  warnings?: string[];
  legalRefs: LegalRef[];
  aiPrompt: string;
  verifiedAt: string;
}

export interface RegPath {
  id: PathId;
  name: string;
  shortName: string;
  tagline: string;
  icon: string;
  stepIds: string[];
  whenToChoose: string[];
  targetAudience: string;
  estimatedTotalTime: string;
  estimatedFee: string;
}

export interface QuizOption {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  badge?: string;
}

export interface QuizQuestion {
  id: string;
  title: string;
  subtitle?: string;
  options: QuizOption[];
}

export interface RegState {
  version: 1;
  pathId: PathId | null;
  quizAnswers: Record<string, string>;
  currentStepId: string | null;
  doneSteps: string[];
  checkedDocs: string[];
  updatedAt: number;
}

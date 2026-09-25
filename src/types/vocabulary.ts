export type GradeLevel = 'elementary' | 'middle';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'very-hard';

export interface VocabularyWord {
  id: string;
  word: string;
  difficulty: Difficulty;
  gradeLevel: GradeLevel;
  meaning: string;
  nounExample?: string;
  verbExample?: string;
  adjectiveExample?: string;
}

export interface UserProgress {
  wordId: string;
  attempts: number;
  correct: number;
  lastPracticed: string;
  startDate: string;
  completionWeeks: number;
  difficult?: boolean;
  reviewDue?: string;
}

export interface DailyProgress {
  date: string;
  wordsCompleted: number;
  wordsCorrect: number;
}

export interface WeeklyProgress {
  weekStart: string;
  daysCompleted: number;
  totalWords: number;
  reward: 'none' | 'silver' | 'gold';
}

export interface UserSettings {
  gradeLevel: GradeLevel;
  difficulty: Difficulty;
  darkMode: boolean;
  autoProgressionEnabled: boolean;
}

export interface ProgressionStats {
  currentAccuracy: number;
  wordsAtCurrentDifficulty: number;
  isReadyForProgression: boolean;
  nextDifficulty: Difficulty | null;
  progressionThreshold: number;
}

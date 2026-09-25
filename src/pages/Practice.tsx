import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { WordCard } from '@/components/WordCard';
import { ProgressionDialog } from '@/components/ProgressionDialog';
import { BreakReminderDialog } from '@/components/BreakReminderDialog';
import { DailyLimitCard } from '@/components/DailyLimitCard';
import { SessionFeedbackDialog } from '@/components/SessionFeedbackDialog';
import { useVocabulary } from '@/hooks/useVocabulary';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import soccerPlayer from '@/assets/soccer-player.png';
import goldTrophy from '@/assets/gold-trophy.png';

const FEEDBACK_SESSIONS = [1, 5]; // Show feedback on 1st and 5th session

function getSessionCount(): number {
  const stored = localStorage.getItem('vocab_session_count');
  return stored ? parseInt(stored, 10) : 0;
}

function incrementSessionCount(): number {
  const newCount = getSessionCount() + 1;
  localStorage.setItem('vocab_session_count', newCount.toString());
  return newCount;
}

export default function Practice() {
  const navigate = useNavigate();
  const { getTodaysWords, updateProgress, checkAndProgressDifficulty, toggleDifficultWord, isWordDifficult, getDueReviewCount, loading, settings } = useVocabulary();
  const { 
    wordsPracticedToday,
    isDailyLimitReached, 
    wordsRemainingToday,
    shouldShowBreakReminder,
    incrementWordsCompleted,
    dismissBreakReminder,
    resetSession,
    limits
  } = useUsageLimits();
  
  // Track all word IDs practiced in this session to exclude them from future rounds
  const [practicedWordIds, setPracticedWordIds] = useState<string[]>([]);
  const [words, setWords] = useState(() => getTodaysWords());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showProgressionDialog, setShowProgressionDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [newDifficulty, setNewDifficulty] = useState<string>('');
  const [completedScore, setCompletedScore] = useState(0);
  const [missedWords, setMissedWords] = useState<string[]>([]);
  
  
  const ATTEMPTS_PER_WORD = 2;
  const totalAttempts = words.length * ATTEMPTS_PER_WORD;

  const handleComplete = async (isCorrect: boolean) => {
    const currentWordId = words[currentIndex].id;
    const isFinalPass = currentAttempt === ATTEMPTS_PER_WORD;
    await updateProgress(currentWordId, isCorrect, isFinalPass);
    if (isCorrect) setScore(prev => prev + 1);
    if (isFinalPass && !isCorrect) {
      setMissedWords(prev => [...new Set([...prev, words[currentIndex].word])]);
    }
    
    // Track word completion for usage limits (only on first attempt)
    if (currentAttempt === 1) {
      incrementWordsCompleted();
    }

    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (currentAttempt < ATTEMPTS_PER_WORD) {
      setCurrentIndex(0);
      setCurrentAttempt(prev => prev + 1);
    } else {
      // Session complete - add current words to practiced list
      setPracticedWordIds(prev => [...prev, ...words.map(w => w.id)]);
      setCompleted(true);
      setCompletedScore(isCorrect ? score + 1 : score);
      const progressedDifficulty = await checkAndProgressDifficulty();
      if (progressedDifficulty) {
        setNewDifficulty(progressedDifficulty);
        setShowProgressionDialog(true);
      }
      // Increment session count and show feedback only on 1st and 5th sessions
      const sessionNum = incrementSessionCount();
      if (FEEDBACK_SESSIONS.includes(sessionNum)) {
        setShowFeedbackDialog(true);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const handlePracticeMore = () => {
    // Check if daily limit reached
    if (isDailyLimitReached) {
      return; // Button will be disabled, but safety check
    }
    
    // Fetch fresh words, excluding all words practiced in this session
    const freshWords = getTodaysWords(practicedWordIds);
    setWords(freshWords);
    setCurrentIndex(0);
    setCurrentAttempt(1);
    setCompleted(false);
    setScore(0);
    setShowProgressionDialog(false);
    setShowFeedbackDialog(false);
    setNewDifficulty('');
    setMissedWords([]);
    resetSession(); // Reset session-based limits (hints)
  };

  // Show daily limit reached screen
  if (isDailyLimitReached) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <DailyLimitCard wordsPracticed={wordsPracticedToday} />
        </main>
      </div>
    );
  }

  if (words.length === 0 || !words[currentIndex]) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <img src={goldTrophy} alt="Gold Trophy" className="w-32 h-32 object-contain" />
              </div>
              <CardTitle className="text-3xl">All Done for Today!</CardTitle>
              <CardDescription className="text-lg mt-2">
                You've practiced all available words at this level.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Come back tomorrow for more practice or try a different difficulty level!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/settings')} size="lg">
                  Change Difficulty
                </Button>
                <Button onClick={() => navigate('/dashboard')} variant="outline">
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navigation />
        <ProgressionDialog 
          isOpen={showProgressionDialog}
          onClose={() => setShowProgressionDialog(false)}
          newDifficulty={newDifficulty}
        />
        <SessionFeedbackDialog
          open={showFeedbackDialog && !showProgressionDialog}
          onClose={() => setShowFeedbackDialog(false)}
          sessionData={{
            score: completedScore,
            totalAttempts,
            words: words.map((w, i) => ({ word: w.word, correct: i < completedScore })),
            difficulty: settings.difficulty,
            gradeLevel: settings.gradeLevel,
          }}
        />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                {score === words.length ? (
                  <img src={goldTrophy} alt="Gold Trophy" className="w-32 h-32 object-contain animate-bounce" />
                ) : (
                  <img src={soccerPlayer} alt="Soccer Player" className="w-32 h-32 object-contain" />
                )}
              </div>
              <CardTitle className="text-3xl">Practice Complete!</CardTitle>
              <CardDescription className="text-lg mt-2">
                You scored {score} out of {totalAttempts}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {score === totalAttempts 
                  ? "Perfect score! You're a vocabulary champion! ⚽" 
                  : "Great effort! Keep practicing to improve your score!"}
              </p>
              {missedWords.length > 0 && (
                <p className="text-sm text-muted-foreground bg-accent/50 rounded-lg px-3 py-2">
                  🎯 {missedWords.length} word{missedWords.length > 1 ? 's' : ''} to review: <strong>{missedWords.join(', ')}</strong> — they'll be back for another try in 3 days!
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handlePracticeMore} size="lg">
                  Practice More Words
                </Button>
                <Button onClick={() => navigate('/review')} variant="outline">
                  Review Words
                </Button>
                <Button onClick={() => navigate('/dashboard')} variant="ghost">
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      
      {/* Break reminder dialog */}
      <BreakReminderDialog
        isOpen={shouldShowBreakReminder}
        onDismiss={dismissBreakReminder}
        wordsPracticed={wordsPracticedToday}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Round {currentAttempt} of {ATTEMPTS_PER_WORD} - Word {currentIndex + 1} of {words.length}
            </span>
            <span className="text-sm font-medium text-primary">
              Score: {score}/{((currentAttempt - 1) * words.length) + currentIndex + 1}
            </span>
          </div>
          
          {/* Usage stats bar */}
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground bg-accent/50 px-3 py-2 rounded-lg">
            <span>Today: {wordsPracticedToday}/{limits.MAX_WORDS_PER_DAY} words</span>
            {dueReviewCount > 0 && (
              <span className="font-medium text-primary">🔄 {dueReviewCount} review word{dueReviewCount > 1 ? 's' : ''} due</span>
            )}
          </div>

          <div className="w-full bg-accent rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((((currentAttempt - 1) * words.length) + currentIndex + 1) / totalAttempts) * 100}%` }}
            />
          </div>

          <WordCard 
            word={words[currentIndex]} 
            onComplete={handleComplete}
            attemptNumber={currentAttempt}
            totalAttempts={ATTEMPTS_PER_WORD}
            onMarkDifficult={toggleDifficultWord}
            isDifficult={isWordDifficult(words[currentIndex].id)}
          />
        </div>
      </main>
    </div>
  );
}

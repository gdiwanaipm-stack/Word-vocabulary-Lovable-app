import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

interface PracticedWord {
  word: string;
  correct: boolean;
}

interface SessionData {
  score: number;
  totalAttempts: number;
  words: PracticedWord[];
  difficulty: string;
  gradeLevel: string;
}

interface SessionFeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  sessionData?: SessionData;
}

export function SessionFeedbackDialog({ open, onClose, sessionData }: SessionFeedbackDialogProps) {
  const [likes, setLikes] = useState("");
  const [improvements, setImprovements] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Fetch AI summary when dialog opens with session data
  useEffect(() => {
    if (!open || !sessionData) return;
    setAiSummary(null);
    setIsLoadingSummary(true);

    supabase.functions
      .invoke("session-summary", { body: sessionData })
      .then(({ data, error }) => {
        if (!error && data?.summary) {
          setAiSummary(data.summary);
        }
      })
      .catch((err) => console.error("Error fetching session summary:", err))
      .finally(() => setIsLoadingSummary(false));
  }, [open, sessionData]);

  const handleSubmit = async () => {
    if (!likes.trim() && !improvements.trim()) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        toast.error("Please sign in to submit feedback");
        setIsSubmitting(false);
        return;
      }
      const { error } = await supabase.from("session_feedback").insert({
        user_id: userId,
        likes: likes.trim() || null,
        improvements: improvements.trim() || null,
      });

      if (error) throw error;


      toast.success("Thanks for your feedback!");
      setLikes("");
      setImprovements("");
      onClose();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setLikes("");
    setImprovements("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleSkip()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How was your practice session?</DialogTitle>
          <DialogDescription>
            Your feedback helps us improve! This is optional.
          </DialogDescription>
        </DialogHeader>

        {/* AI Session Summary */}
        {sessionData && (
          <div className="rounded-lg bg-primary/5 border border-primary/15 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <Sparkles className="w-4 h-4" />
              <span>Your Coach Says</span>
            </div>
            {isLoadingSummary ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Getting your summary...</span>
              </div>
            ) : aiSummary ? (
              <p className="text-sm text-foreground leading-relaxed">{aiSummary}</p>
            ) : null}
          </div>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="likes">What did you like? 😊</Label>
            <Textarea
              id="likes"
              placeholder="I liked..."
              value={likes}
              onChange={(e) => setLikes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="improvements">What could be improved? 💡</Label>
            <Textarea
              id="improvements"
              placeholder="I wish..."
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleSkip} disabled={isSubmitting}>
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

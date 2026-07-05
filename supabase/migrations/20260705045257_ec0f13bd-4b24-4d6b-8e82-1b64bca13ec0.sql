
DELETE FROM public.session_feedback WHERE user_id IS NULL;

DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.session_feedback;

ALTER TABLE public.session_feedback ALTER COLUMN user_id SET NOT NULL;

CREATE POLICY "Authenticated users can insert their own feedback"
ON public.session_feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

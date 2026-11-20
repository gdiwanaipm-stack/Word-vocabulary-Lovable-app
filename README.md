# Word vocabulary app with Lovable
This is a word vocabulary app designed for elementary and middle school kids to help them build proficiency in learning new words and their meaning. It is created in soccer setup to help them meet their "GOAL". The app is designed to encourage learning and motivate them. (My son likes soccer so it was designed to help him improve his vocab)

## Project

**URL**: https://word-champion-kicks.lovable.app/

## Prompt used
Problem Statement - make elementary kids learn new vocab words

Users: Elementary kids with difficulty levels: easy, medium, difficult

Prompt - Build a vocabulary web app for elementary, middle school kids ( drop down selection to pick grade level) to help them learn new English words and track their progress towards their weekly goal 

Define what good looks like? 
Vocabulary understanding is fuzzy, not binary
Students may give partial, contextual, or paraphrased meanings
Progress tracking requires semantic similarity, not exact matches
The LLM should evaluate, not just generate.


- Difficulty level ( Easy, Medium, Hard, Very Hard)
- Generate 2 words per day. Ask the student for the meaning first and then say whether it is right or wrong. Then give them their true meaning along with an example of the usage of the word as a noun, verb, adjective
- Repeat those words every day for 2 weeks
  Give a count of how many vocubulary words they did each week
- Track the progress on weekly basis
- Reward them with a silver cup each week if they do it for 5 out of 7 days in a week and gold cup if they do it all 7 days in a week
- Allow kids to review the words they learned any time

Core Features
- User login and authentication (removed later as shared to lessons learned)
- Clean minimalist design
- Mobile friendly look and a dark mode
- Add soccer theme images with links to show Hyper personalization (since my kid loves soccer) 
- Charts showing progress to Goal
- Feedback uses growth-mindset language, and blank OR "I don't know" answers get a helpful hint instead of generic feedback.Feedback.correction must be gentle; if correct, say what was good and add one small improvement. Be gentle and motivate the kids to learn new vocab words


## Which AI models are used for evaluation?
Options explored were:
google/gemini-2.5-pro - Most powerful, best for complex reasoning

google/gemini-2.5-flash (current) - Balanced speed/quality

google/gemini-2.5-flash-lite - Fastest, cheapest

openai/gpt-5 - Powerful all-rounder

openai/gpt-5-mini - Good balance of cost/performance

openai/gpt-5-nano - Fastest/cheapest OpenAI option


**Lovable AI**, which is pre-configured and requires **no API key setup**. It supports models like Gemini 2.5 Flash (comparable speed/cost to Claude Haiku 4.5) and GPT-5 (comparable reasoning to Claude Opus), with the advantage of zero configuration and built-in rate limit handling.

I used OpenAI/GPT-5-nano and tested the evaluation with the new model and changed it back to **Gemini 2.5 Flash** since the response rate with nano was more than 5 secs with new evaluation criteria. The app uses Google Gemini 2.5 Flash to evaluate student answers. It's configured in the evaluate-answer edge function and accepts synonyms, paraphrases, and example-based meanings - prioritizing understanding over verbatim definitions.

**Model Update**
Since Lovable AI does not support Claude models yet, I switched to **two-phase models** for better accuracy and performance
A) The evaluate-answer function was changed to Openai/GPT-5 for maximum accuracy. GPT 5 is a powerfull all-rounder and accurate for evaluation and motivating the students but a bit slower.
B) Keep hints/summaries on Gemini 2.5 Flash for speed. 
//this 2 phased model approach gave better results and improved feedback from the students

**NOTE:** I could have further chosen specific model based on how many tokens get used for each outcome but Lovable gives monthly credits at project level and does not make that capability for now

## What technologies are used for this project?

This project is built with:
- Vite: for lighter UI MVP for faster development, speed and smaller production bundles
- TypeScript: for error detection and light debbugging
- React: for lighter development workload and reusable components
- shadcn-ui: for lighter UI later and relies on Tailwind CSS
- Tailwind CSS: is AI friendly and allows to build UI directly in the markup

## Observations and Lessons learned

a) Login authentication issues and Supabase issues which is serverless data base. Code is not available on the side to see what was done. Supabase is an external database plug in compared to Replit ** Update Supabase auth has improved with Lovable Cloud in 2 months of building this app.

b) Vocab correctness is difficult even with lower accuracy thresholds since the meanings are subjective. I put in a guardrail of 20% accuracy for elementary kids

c) Each animation made me use tokens which was expensive :) so created a barebones MVP

d) When One prompt fixed something, another thing breaks or changes you need an early engineer to work on it - reasoning needs to get better on why a word was shown as wrong or correct

e) Break the prompt up into smaller chunks or components for them to work well together instead of a huge prompt

f) Selector tool helps you select different elements on the page and adjust the UI components seamlessly unlike Bolt, Replit

g) Added content safety: inappropriate student content is flagged with neutral redirect, no personal data or profanity in outputs, all feedback stays school-appropriate

h) Repository of new words (attachment that were categorized as easy, medium, hard and very hard) was added to **golden set for evals**

i) Ask the Lovable what AI model is best suited here for the fuzzy logic of vocab. Two-phased models give better accuracy. TRADEOFF: SPEED Vs. ACCURACY

## Guardrails that I included

1) Daily word limit — Max 20 words/day, tracked in localStorage and reset daily. When reached, practice is blocked with a friendly message.

2) Break reminders — A dialog pops up every 10 words suggesting the student take a break, with a dismiss option.

3) AI content safety filters — Edge functions flag profanity, violence, hate speech, and prompt injection attempts. Unsafe inputs return a neutral refocusing response instead of evaluation.

4) Input validation — Server-side length limits on all AI inputs (word: 100 chars, meaning: 500, answer: 500) to prevent abuse.

5) Graceful AI failures — If the AI gateway errors out, fallback responses ensure the student never sees a crash (defaults to encouraging feedback).

6) Rate limit handling — 429/402 responses from the AI gateway are caught and surfaced as friendly messages.

All of this lives in src/hooks/useUsageLimits.ts (client-side limits) and the three edge functions (server-side safety).

```
**How is lovable using context windows for this vocabulary app that has been created?**
1. Edge Function Calls (Your App's AI) Each time a student submits an answer, the evaluate-answer function sends a single-turn request to GPT-5 with:

A system prompt (~400 tokens) containing the scoring rubric
A user message with the word, meaning, and student answer (~50-100 tokens)
Similarly, generate-hint and session-summary each make one-shot calls to Gemini 2.5 Flash. These are stateless — no conversation history is carried between calls, so context window usage is minimal (~500-1000 tokens per request).

2. Lovable Editor (Building Your App) When I help you build and modify this app, I work within a context window that includes:

Your current codebase (file contents, project structure)
Our conversation history (recent messages)
Tool outputs (console logs, file reads, etc.)
This is why I sometimes need to re-read files if they've changed, and why breaking requests into smaller steps works better — it keeps the relevant context focused.

Key difference: Your app's AI uses tiny, focused context windows per request (efficient and cheap). The Lovable editor uses a much larger context window to reason about your entire codebase.
```

## User Feedback received
(I have been storing the feedback in a local database to review the feedback and asking my AI model to improve based on the feedback)

A) One kid loved it. He actually sat 20 mins doing it even though I have kept the practiece to 2 new words everyday. He keptpressing "Practice more words". Winner approach for parents

B) Another kid says it is too strict in judging his answer when it is in the ball park and meaning are subject to interpretations

C) One Parent - likes it, gamification, does not like the subjectivity and accuracy

D) One more kid wants higher difficulty level words




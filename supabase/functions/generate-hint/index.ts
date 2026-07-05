import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_WORD_LENGTH = 100;
const MAX_MEANING_LENGTH = 500;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const token = authHeader.replace("Bearer ", "");
  const authClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data: authData, error: authError } = await authClient.auth.getClaims(token);
  if (authError || !authData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }


  try {
    const body = await req.json();
    const { word, meaning } = body;

    if (!word || typeof word !== "string") {
      return new Response(
        JSON.stringify({ error: "Word is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!meaning || typeof meaning !== "string") {
      return new Response(
        JSON.stringify({ error: "Meaning is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedWord = word.trim();
    const trimmedMeaning = meaning.trim();

    if (!trimmedWord || trimmedWord.length > MAX_WORD_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Word must be between 1 and ${MAX_WORD_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!trimmedMeaning || trimmedMeaning.length > MAX_MEANING_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Meaning must be between 1 and ${MAX_MEANING_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a friendly vocabulary tutor for 2nd-5th graders. Generate a single short hint (1 sentence only) that nudges students toward the word's meaning without revealing it directly.

Rules:
- ONE sentence only, no more
- Kid-friendly language (ages 7-11)
- Use: a related situation, a synonym clue, or contrast with an opposite
- Do NOT state the definition verbatim
- Do NOT use the word itself in the hint
- Make it feel like a fun clue, not a lecture`,
          },
          {
            role: "user",
            content: `Word: "${trimmedWord}"\nMeaning: "${trimmedMeaning}"\n\nGive a one-sentence hint.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const hint = data.choices?.[0]?.message?.content?.trim();

    if (!hint) {
      throw new Error("No hint generated");
    }

    return new Response(
      JSON.stringify({ hint }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating hint:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate hint" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

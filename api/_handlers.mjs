// Web-Fetch–style handlers shared by Vercel functions (production)
// and the Vite dev middleware (npm run dev). Each takes a `Request`
// and returns a streaming `Response`.

import Anthropic from "@anthropic-ai/sdk";

const ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech";

// Yuna persona — frozen so prompt caching can read across turns.
const YUNA_SYSTEM_PROMPT = `You are Yuna, a warm, present AI wellness companion. You are not a therapist or doctor. You are a thoughtful companion holding space for someone who showed up to talk.

Your job is to greet the person, follow what they bring, and let the conversation unfold naturally. Do not run a checklist. Do not announce an agenda. The user should feel met, not surveyed. Reflect what they said back in your own words, briefly, then ask one open follow-up that goes a layer deeper on the same thread. Keep the conversation open and follow them.

VOICE AND TONE
- Warm, plain language. Talk like a thoughtful friend texting back. Never clinical, never therapist-jargon, never coach-speak.
- Brief. Usually one to three short sentences per turn. Two is the sweet spot.
- Reflect before you ask. The reflection is what makes them feel heard.
- Ask one question at a time. Never stack two questions in one reply.
- Validate before reframing. Do not rush to fix, advise, or interpret.
- Speak in the first person.

THINGS NEVER TO DO
- Never use em dashes in your replies. If you want a pause, use a period, a comma, or a new sentence. This is a hard rule.
- Never claim to read, sense, or know the user's inner state. Do not write "I can tell you're feeling," "I sense that," "I want to make sure I'm reading you right," or anything that positions you as divining what they did not say. Reflect what they actually said. Ask about the rest.
- No bullet lists, headings, markdown formatting, or emoji. Write conversational prose.
- No "I'm sorry to hear that" boilerplate. Be specific to what they brought.
- No promises about outcomes. You are a companion, not a fix.
- Do not pretend to be human. If asked, you are an AI companion named Yuna.

FORMAT
Plain text only. Conversational. No formatting characters.`;

export async function handleChat(request) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing ANTHROPIC_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const messages = Array.isArray(body?.messages) ? body.messages : null;
  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = new Anthropic({ apiKey });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event, data) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        const messageStream = client.messages.stream({
          model: "claude-opus-4-7",
          max_tokens: 400,
          thinking: { type: "disabled" },
          system: [
            {
              type: "text",
              text: YUNA_SYSTEM_PROMPT,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages,
        });

        for await (const event of messageStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            send("delta", { text: event.delta.text });
          }
        }
        const final = await messageStream.finalMessage();
        const fullText = final.content
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("");
        send("done", { text: fullText });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        send("error", { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// Distill the conversation into a single keepsake sentence + a small set of
// themes. Returns one-shot JSON, not a stream — the wrap-up screen waits for
// the whole thing before swapping in the keepsake card.
const WRAP_UP_SYSTEM_PROMPT = `You are Yuna, distilling a conversation you just had with the user into a small keepsake they can carry forward.

You will return ONLY a JSON object, no prose around it, no markdown fences, in this exact shape:
{ "keepsake": string, "themes": string[] }

The keepsake:
- One sentence, under 18 words. Speak TO the user, not about them.
- Present tense, forward-leaning. Never "today you struggled with..." or "you came here feeling..."
- Sounds like something Yuna might've actually said in the conversation — not a summary, label, or report.
- Concrete to what came up. Avoid clichés ("trust the process", "be kind to yourself", "you've got this").
- Don't quote the user's words verbatim — paraphrase what they brought.
- No reference to "our chat", "today's session", or the conversation itself as an object.
- Plain text, no quotes around it.

Themes:
- 0–3 short labels, lowercase, max two words each.
- Concrete things that surfaced ("rest", "mom", "boundaries", "self-trust", "work stress").
- Never fabricate. If nothing concrete came up, return [].

If the conversation has almost no substance (e.g. a single greeting), return a gentle generic keepsake about showing up, and themes: [].`;

export async function handleWrapUp(request) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing ANTHROPIC_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const transcript = Array.isArray(body?.transcript) ? body.transcript : null;
  if (!transcript || transcript.length === 0) {
    return new Response(JSON.stringify({ error: "transcript required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Render the conversation as a labelled block so Claude's working set
  // contains the full exchange, then ask for the JSON in one user turn.
  const rendered = transcript
    .map((m) => {
      const who = m.role === "user" ? "User" : "Yuna";
      return `${who}: ${typeof m.content === "string" ? m.content.trim() : ""}`;
    })
    .filter((line) => line.length > 6)
    .join("\n");

  const client = new Anthropic({ apiKey });

  try {
    const result = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 250,
      thinking: { type: "disabled" },
      system: [
        {
          type: "text",
          text: WRAP_UP_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Here is the conversation:\n\n${rendered}\n\nReturn the JSON now.`,
        },
      ],
    });

    const raw = result.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    // Be forgiving: strip ```json fences if Claude added them despite instructions.
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return new Response(
        JSON.stringify({ error: "Could not parse keepsake", raw }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const keepsake =
      typeof parsed?.keepsake === "string" ? parsed.keepsake.trim() : "";
    const themes = Array.isArray(parsed?.themes)
      ? parsed.themes
          .filter((t) => typeof t === "string")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 3)
      : [];

    if (!keepsake) {
      return new Response(
        JSON.stringify({ error: "Empty keepsake from model" }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ keepsake, themes }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handleTts(request) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing ELEVENLABS_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const voiceId = typeof body?.voiceId === "string" ? body.voiceId : "";
  if (!text || !voiceId) {
    return new Response(JSON.stringify({ error: "text and voiceId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // eleven_turbo_v2_5 is fast + low-latency, well-suited for short prototype
  // playback. Swap to eleven_multilingual_v2 if you need richer prosody.
  const upstream = await fetch(`${ELEVENLABS_TTS_URL}/${voiceId}/stream`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_turbo_v2_5",
      voice_settings: { stability: 0.55, similarity_boost: 0.85 },
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const errorText = await upstream.text().catch(() => "");
    return new Response(
      JSON.stringify({ error: "TTS upstream error", detail: errorText }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

interface Env {
  GEMINI_API_KEY: string;
}

interface RequestBody {
  imageBase64?: string;
  mimeType?: string;
  prompt?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("👋 Gemini Worker is running.", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // ---------------------------
    // 1) Parse JSON safely
    // ---------------------------
    let body: RequestBody;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { imageBase64, mimeType, prompt } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = env.GEMINI_API_KEY;

    // ---------------------------
    // 2) Model selection
    // ---------------------------
    const model = imageBase64 ? "gemini-2.5-pro" : "gemini-2.5-flash";

    // ---------------------------
    // 3) Build payload (trimmed)
    // ---------------------------
    const payload: any = {
      contents: [
        {
          role: "system",
          parts: [
            {
              text: `You are a multilingual textile and laundry expert.`
            }
          ]
        },
        {
          role: "user",
          parts: []
        }
      ]
    };

    if (imageBase64) {
      payload.contents[1].parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || "image/jpeg",
        },
      });
    }

    payload.contents[1].parts.push({ text: prompt.trim() });

    // ---------------------------
    // 4) Call Gemini with streaming
    // ---------------------------
    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Connection": "keep-alive",
          },
          body: JSON.stringify(payload),
          cf: {
            cacheEverything: false,
            cacheTtl: 0,
          },
        }
      );

      if (!geminiResponse.ok) {
        const errText = await geminiResponse.text();
        return new Response(JSON.stringify({ error: errText }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // STREAMING → build JSON progressively
      const reader = geminiResponse.body!.getReader();
      let fullText = "";
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      return new Response(fullText, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "Connection": "keep-alive",
        },
      });

    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
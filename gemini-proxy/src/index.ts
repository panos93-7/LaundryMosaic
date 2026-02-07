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
      return new Response(
        "👋 Gemini Worker is running. Send a POST request with JSON body.",
        {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        }
      );
    }

    let body: RequestBody;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid or missing JSON body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { imageBase64, mimeType, prompt } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = env.GEMINI_API_KEY;

    // MODEL SELECTION
    const model = imageBase64
      ? "gemini-2.5-pro"
      : "gemini-2.5-flash";

    // SYSTEM + USER PAYLOAD
    const payload: any = {
      contents: [
        {
          role: "system",
          parts: [
            {
              text: `
You are a multilingual textile and laundry expert.
You ALWAYS answer in the language specified inside the user prompt.
You NEVER switch languages unless explicitly instructed.
You NEVER default to English unless the user language is English.
`
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

    payload.contents[1].parts.push({ text: prompt });

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        return new Response(JSON.stringify({ error: errText }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
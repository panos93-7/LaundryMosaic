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
    // Handle GET requests (browser test)
    if (request.method !== "POST") {
      return new Response(
        "👋 Gemini Worker is running. Send a POST request with JSON body.",
        {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        }
      );
    }

    // Parse JSON safely
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

    // Prompt is required
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = env.GEMINI_API_KEY;

    // Build Gemini payload safely
    const payload: any = {
      contents: [
        {
          role: "user",
          parts: [],
        },
      ],
    };

    // Add image only if provided
    if (imageBase64) {
      payload.contents[0].parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || "image/jpeg",
        },
      });
    }

    // Add prompt
    payload.contents[0].parts.push({ text: prompt });

try {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=" +
      apiKey,
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

  console.log("GEMINI RAW RESPONSE:", data);

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
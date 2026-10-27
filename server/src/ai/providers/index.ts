import { AIProvider, StreamEvent } from "./base";
import { GroqProvider } from "./groq";
import { MockProvider } from "./mock";

export * from "./base";
export * from "./groq";
export * from "./mock";

class UnavailableProvider implements AIProvider {
  name = "Cloud AI unavailable";
  isMock = false;

  async *generate(): AsyncGenerator<StreamEvent, void, unknown> {
    yield {
      type: "error",
      error: "Cloud AI is not configured. Add a valid GROQ_API_KEY to the server environment, or explicitly switch to offline mode.",
    };
  }
}

export function getAIProvider(forceMock = false): AIProvider {
  const apiKey = process.env.GROQ_API_KEY;
  const baseURL = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
  const configuredModel = process.env.DEFAULT_MODEL?.trim();
  const model = configuredModel || "llama-3.3-70b-versatile";

  if (forceMock) {
    return new MockProvider();
  }

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_groq_api_key_here") {
    return new UnavailableProvider();
  }

  try {
    return new GroqProvider(apiKey, baseURL, model);
  } catch (err) {
    console.error("Failed to initialize GroqProvider:", err);
    return new UnavailableProvider();
  }
}

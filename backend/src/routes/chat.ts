import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const chatRouter = new Hono();

const chatRequestSchema = z.object({
  message: z.string().min(1, "Message is required"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional(),
});

const SYSTEM_PROMPT = `You are an OpenClaw AI agent assistant. You help users accomplish tasks and answer questions. Be concise and helpful. When the user asks you to DO something actionable (like 'research X', 'write a document', 'schedule meetings', 'handle my inbox', 'create X', 'analyze X', 'find X', 'build X'), respond with a task execution block in this exact format:

\`\`\`task
{"title": "Brief task title", "steps": ["Step 1 description", "Step 2 description", "Step 3 description"], "estimatedTime": "2 min"}
\`\`\`

Then after the task block, include a brief explanation of what you'll do.

For simple questions, greetings, or information requests, just respond normally without a task block.`;

/**
 * Parse the AI response to detect if it contains a task block.
 * Checks for the standard ```task``` fenced block format, and also
 * detects raw JSON containing task-like structure (title + steps + estimatedTime)
 * in case the model omits the backtick fencing.
 */
function parseResponse(reply: string): { reply: string; isTask: boolean } {
  // Check for fenced ```task``` block
  const fencedTaskRegex = /```task\s*\n[\s\S]*?\n```/;
  if (fencedTaskRegex.test(reply)) {
    return { reply, isTask: true };
  }

  // Fallback: check for raw JSON with task structure (title + steps + estimatedTime)
  try {
    const jsonMatch = reply.match(/\{[\s\S]*"title"[\s\S]*"steps"[\s\S]*"estimatedTime"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.title && Array.isArray(parsed.steps) && parsed.estimatedTime) {
        return { reply, isTask: true };
      }
    }
  } catch {
    // JSON parse failed, not a task block
  }

  return { reply, isTask: false };
}

chatRouter.post(
  "/",
  zValidator("json", chatRequestSchema),
  async (c) => {
    const { message, history } = c.req.valid("json");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return c.json(
        { error: { message: "OpenAI API key is not configured", code: "MISSING_API_KEY" } },
        500
      );
    }

    // Build the input array for the Responses API
    const input: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

    // Add system prompt
    input.push({ role: "system", content: SYSTEM_PROMPT });

    // Add conversation history if provided
    if (history && history.length > 0) {
      for (const msg of history) {
        input.push({ role: msg.role, content: msg.content });
      }
    }

    // Add the current user message
    input.push({ role: "user", content: message });

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-nano",
          input,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("OpenAI API error:", response.status, errorBody);
        return c.json(
          {
            error: {
              message: "Failed to get response from AI",
              code: "OPENAI_API_ERROR",
            },
          },
          502
        );
      }

      const result = (await response.json()) as {
        output: Array<{
          type: string;
          content?: Array<{ type: string; text?: string }>;
        }>;
      };

      // Extract the text from the response output
      let replyText = "";
      for (const item of result.output) {
        if (item.type === "message" && item.content) {
          for (const contentPart of item.content) {
            if (contentPart.type === "output_text" && contentPart.text) {
              replyText += contentPart.text;
            }
          }
        }
      }

      if (!replyText) {
        return c.json(
          {
            error: {
              message: "No text in AI response",
              code: "EMPTY_RESPONSE",
            },
          },
          502
        );
      }

      const parsed = parseResponse(replyText);

      return c.json({
        data: {
          reply: parsed.reply,
          isTask: parsed.isTask,
        },
      });
    } catch (err) {
      console.error("Chat endpoint error:", err);
      return c.json(
        {
          error: {
            message: "Internal server error while processing chat request",
            code: "INTERNAL_ERROR",
          },
        },
        500
      );
    }
  }
);

export { chatRouter };

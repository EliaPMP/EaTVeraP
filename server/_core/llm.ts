import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MAX_TOKENS = 8192;

const assertApiKey = () => {
  if (!ENV.anthropicApiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Set it in your environment (see .env.example) to enable AI analysis."
    );
  }
};

// Anthropic tool names must match ^[a-zA-Z0-9_-]{1,64}$.
const sanitizeToolName = (name: string): string => {
  const cleaned = name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
  return cleaned.length > 0 ? cleaned : "structured_output";
};

const extractText = (content: MessageContent | MessageContent[]): string =>
  ensureArray(content)
    .map(part => (typeof part === "string" ? part : part.type === "text" ? part.text : ""))
    .filter(Boolean)
    .join("\n");

type AnthropicBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source:
        | { type: "base64"; media_type: string; data: string }
        | { type: "url"; url: string };
    };

// Map our internal image/text parts to Anthropic content blocks.
// Handles both data URLs (data:image/jpeg;base64,...) and remote https URLs.
const toAnthropicBlock = (
  part: TextContent | ImageContent | FileContent
): AnthropicBlock | null => {
  if (part.type === "text") {
    return { type: "text", text: part.text };
  }
  if (part.type === "image_url") {
    const url = part.image_url.url;
    const dataUrlMatch = url.match(/^data:(image\/[\w.+-]+);base64,([\s\S]*)$/);
    if (dataUrlMatch) {
      return {
        type: "image",
        source: { type: "base64", media_type: dataUrlMatch[1], data: dataUrlMatch[2] },
      };
    }
    return { type: "image", source: { type: "url", url } };
  }
  // file_url (audio/pdf) is unused by the app's routers; drop it gracefully.
  return null;
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

/**
 * Calls the Anthropic Messages API and returns a result in the OpenAI-style
 * shape the app's routers already consume (`choices[0].message.content`).
 *
 * When a JSON schema is requested (via `responseFormat`/`outputSchema`), the
 * schema is exposed to the model as a single forced tool so the response is
 * guaranteed to be valid JSON matching the schema; the tool input is returned
 * serialized as the message content string. Plain requests return text.
 */
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const {
    messages,
    maxTokens,
    max_tokens,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  // Anthropic takes system prompts as a top-level field, not a message role.
  const systemParts: string[] = [];
  const anthropicMessages: Array<{
    role: "user" | "assistant";
    content: AnthropicBlock[];
  }> = [];

  for (const message of messages) {
    if (message.role === "system") {
      systemParts.push(extractText(message.content));
      continue;
    }
    if (message.role === "tool" || message.role === "function") {
      // The app never sends tool/function turns; represent as plain user text.
      anthropicMessages.push({
        role: "user",
        content: [{ type: "text", text: extractText(message.content) }],
      });
      continue;
    }
    const blocks = ensureArray(message.content)
      .map(normalizeContentPart)
      .map(toAnthropicBlock)
      .filter((b): b is AnthropicBlock => b !== null);
    anthropicMessages.push({
      role: message.role === "assistant" ? "assistant" : "user",
      content: blocks.length > 0 ? blocks : [{ type: "text", text: "" }],
    });
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  const payload: Record<string, unknown> = {
    model: ENV.anthropicModel,
    max_tokens: maxTokens ?? max_tokens ?? DEFAULT_MAX_TOKENS,
    messages: anthropicMessages,
  };

  let forcedToolName: string | null = null;
  if (normalizedResponseFormat?.type === "json_schema") {
    forcedToolName = sanitizeToolName(normalizedResponseFormat.json_schema.name);
    payload.tools = [
      {
        name: forcedToolName,
        description: "Return the result using this structured schema.",
        input_schema: normalizedResponseFormat.json_schema.schema,
      },
    ];
    payload.tool_choice = { type: "tool", name: forcedToolName };
  } else if (normalizedResponseFormat?.type === "json_object") {
    systemParts.push(
      "Respond with a single valid JSON object and nothing else — no prose, no markdown fences."
    );
  }

  if (systemParts.length > 0) {
    payload.system = systemParts.join("\n\n");
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ENV.anthropicApiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  const data = (await response.json()) as {
    id?: string;
    model?: string;
    stop_reason?: string | null;
    content?: Array<
      | { type: "text"; text: string }
      | { type: "tool_use"; name: string; input: unknown }
      | { type: string; [k: string]: unknown }
    >;
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  const blocks = data.content ?? [];
  let contentString = "";
  if (forcedToolName) {
    const toolUse = blocks.find(
      (b): b is { type: "tool_use"; name: string; input: unknown } =>
        b.type === "tool_use"
    );
    contentString = toolUse ? JSON.stringify(toolUse.input) : "";
  } else {
    contentString = blocks
      .filter((b): b is { type: "text"; text: string } => b.type === "text")
      .map(b => b.text)
      .join("");
  }

  const inputTokens = data.usage?.input_tokens ?? 0;
  const outputTokens = data.usage?.output_tokens ?? 0;

  return {
    id: data.id ?? "",
    created: Math.floor(Date.now() / 1000),
    model: data.model ?? ENV.anthropicModel,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: contentString },
        finish_reason: data.stop_reason ?? null,
      },
    ],
    usage: {
      prompt_tokens: inputTokens,
      completion_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
    },
  };
}

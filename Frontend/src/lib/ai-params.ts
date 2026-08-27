/**
 * Utility to sanitize OpenAI chat completion parameters based on the model being used.
 * OpenAI Reasoning models (o1, o1-mini, o1-preview, and custom aliases like gpt-5)
 * have specific constraints:
 * 1. They do NOT support 'max_tokens'. Use 'max_completion_tokens' instead.
 * 2. They often do NOT support 'temperature' (must be 1.0 or omitted).
 * 3. They support 'reasoning_effort' (low, medium, high) to balance speed and depth.
 */
export function getChatParams(model: string, params: {
    max_tokens?: number;
    temperature?: number;
    response_format?: any;
    messages: any[];
    reasoning_effort?: "low" | "medium" | "high";
}) {
    // Model identification (OpenAI Reasoning models)
    const isReasoningModel =
        model.startsWith('o1-') ||
        model === 'o1' ||
        model.startsWith('o3-') ||
        model.includes('gpt-5') || // Project-specific alias for reasoning model
        model.includes('gpt-4.1'); // New reasoning model alias requested

    // Base object - EXACT MODEL NAME UNTOUCHED
    const output: any = {
        model,
        messages: params.messages,
    };

    if (isReasoningModel) {
        // Reasoning models use max_completion_tokens (required instead of max_tokens)
        // INCREASED to 16,384 as 2,048 was too small (reasoning consumes many tokens)
        if (params.max_tokens) {
            output.max_completion_tokens = Math.max(params.max_tokens, 16384);
        } else {
            output.max_completion_tokens = 16384;
        }

        // Support reasoning_effort for newer models (o1, o3-mini)
        if (params.reasoning_effort) {
            output.reasoning_effort = params.reasoning_effort;
        }

        // Reasoning models typically don't support temperature/top_p yet (must be 1).
        // It's safest to omit it so the model uses its own logic.
    } else {
        // Standard models
        if (params.max_tokens) {
            output.max_tokens = params.max_tokens;
        }
        if (params.temperature !== undefined) {
            output.temperature = params.temperature;
        }
    }

    // Common properties (if provided)
    if (params.response_format) {
        output.response_format = params.response_format;
    }

    return output;
}

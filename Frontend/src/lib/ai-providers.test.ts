import { describe, expect, it } from "vitest";
import { resolveApiKey, resolveModel, resolveProvider } from "./ai-providers";

describe("AI settings resolution", () => {
    it("defaults unknown provider to openai", () => {
        expect(resolveProvider("")).toBe("openai");
        expect(resolveProvider("gemini")).toBe("gemini");
    });

    it("keeps models that belong to the provider and otherwise uses the default", () => {
        expect(resolveModel("openai", "gpt-4o-mini")).toBe("gpt-4o-mini");
        expect(resolveModel("openai", "gemini-2.0-flash")).toBe("gpt-4o");
        expect(resolveModel("gemini", "gemini-2.0-flash")).toBe("gemini-2.0-flash");
        expect(resolveModel("gemini", "gpt-4o")).toBe("gemini-2.0-flash");
    });

    it("reads the DB key first and only then ENV", () => {
        expect(resolveApiKey("openai", { openai: "db-oa", gemini: "db-g" }, { openai: "env-oa", gemini: "env-g" })).toBe("db-oa");
        expect(resolveApiKey("gemini", { openai: "db-oa", gemini: "" }, { openai: "env-oa", gemini: "env-g" })).toBe("env-g");
        expect(resolveApiKey("openai", { openai: "", gemini: "db-g" }, { openai: "env-oa" })).toBe("env-oa");
        expect(resolveApiKey("gemini", { openai: "db-oa", gemini: "db-g" }, { gemini: "env-g" })).toBe("db-g");
    });
});

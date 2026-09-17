import { afterEach, describe, expect, it } from "vitest";
import { isFaceLoginHostAllowed, isLocalDevHost, resolveRequestHostname } from "./dev-auth";

const ORIGINAL_ENV = {
    FACE_LOGIN_ENABLED: process.env.FACE_LOGIN_ENABLED,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    TRAEFIK_HOST: process.env.TRAEFIK_HOST,
};

function setEnv(env: Record<string, string | undefined>) {
    for (const [key, value] of Object.entries(env)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    }
}

afterEach(() => {
    setEnv(ORIGINAL_ENV);
});

describe("isLocalDevHost", () => {
    it("accepts loopback hosts with optional ports", () => {
        expect(isLocalDevHost("localhost:3000")).toBe(true);
        expect(isLocalDevHost("127.0.0.1")).toBe(true);
        expect(isLocalDevHost("[::1]")).toBe(true);
        expect(isLocalDevHost("[::1]:3000")).toBe(true);
        expect(isLocalDevHost("::1")).toBe(true);
        expect(isLocalDevHost("staging.wpcteam.shop")).toBe(false);
    });
});

describe("isFaceLoginHostAllowed", () => {
    it("allows localhost, staging, and production public hosts", () => {
        setEnv({ FACE_LOGIN_ENABLED: undefined, NEXT_PUBLIC_APP_URL: undefined, TRAEFIK_HOST: undefined });
        expect(isFaceLoginHostAllowed("localhost:3000")).toBe(true);
        expect(isFaceLoginHostAllowed("staging.wpcteam.shop")).toBe(true);
        expect(isFaceLoginHostAllowed("production.wpcteam.shop")).toBe(true);
        expect(isFaceLoginHostAllowed("production.wpcteam.shop:443")).toBe(true);
    });

    it("allows the configured app URL and Traefik host", () => {
        setEnv({
            FACE_LOGIN_ENABLED: undefined,
            NEXT_PUBLIC_APP_URL: "https://custom.example.com",
            TRAEFIK_HOST: "edge.example.com",
        });
        expect(isFaceLoginHostAllowed("custom.example.com")).toBe(true);
        expect(isFaceLoginHostAllowed("edge.example.com")).toBe(true);
        expect(isFaceLoginHostAllowed("other.example.com")).toBe(false);
    });

    it("allows any host when FACE_LOGIN_ENABLED is true", () => {
        setEnv({
            FACE_LOGIN_ENABLED: "true",
            NEXT_PUBLIC_APP_URL: undefined,
            TRAEFIK_HOST: undefined,
        });
        expect(isFaceLoginHostAllowed("other.example.com")).toBe(true);
    });

    it("rejects unknown hosts when Face ID is not enabled", () => {
        setEnv({
            FACE_LOGIN_ENABLED: "false",
            NEXT_PUBLIC_APP_URL: "https://staging.wpcteam.shop",
            TRAEFIK_HOST: undefined,
        });
        expect(isFaceLoginHostAllowed("evil.example.com")).toBe(false);
        expect(isFaceLoginHostAllowed("")).toBe(false);
        expect(isFaceLoginHostAllowed(undefined)).toBe(false);
    });
});

describe("resolveRequestHostname", () => {
    it("uses the public Host header when it is already a known app host", () => {
        const headers = new Map([
            ["x-forwarded-host", "evil.example.com"],
            ["host", "production.wpcteam.shop"],
        ]);
        expect(
            resolveRequestHostname({
                headers: { get: (name) => headers.get(name) ?? null },
                nextUrl: { hostname: "0.0.0.0" },
            }),
        ).toBe("production.wpcteam.shop");
    });

    it("uses the forwarded host only behind the Compose service hostname", () => {
        const headers = new Map([
            ["x-forwarded-host", "production.wpcteam.shop"],
            ["host", "web:3000"],
        ]);
        expect(
            resolveRequestHostname({
                headers: { get: (name) => headers.get(name) ?? null },
                nextUrl: { hostname: "web" },
            }),
        ).toBe("production.wpcteam.shop");
    });

    it("ignores a spoofed forwarded host on an unknown public Host", () => {
        const headers = new Map([
            ["x-forwarded-host", "production.wpcteam.shop"],
            ["host", "evil.example.com"],
        ]);
        expect(
            resolveRequestHostname({
                headers: { get: (name) => headers.get(name) ?? null },
                nextUrl: { hostname: "evil.example.com" },
            }),
        ).toBe("evil.example.com");
    });
});

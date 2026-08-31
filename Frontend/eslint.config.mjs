import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    rules: {
      // Downgrade noisy rules to warnings — keep codebase compilable without blocking builds
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "prefer-const": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      // Keep hooks violations as errors — these are real bugs
      "react-hooks/rules-of-hooks": "error",
    },
  },
];

export default eslintConfig;

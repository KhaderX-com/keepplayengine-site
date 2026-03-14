import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Disable overly strict ARIA validation that doesn't recognize dynamic boolean-to-string conversion
      "jsx-a11y/aria-props": "off",
      // Allow inline styles for dynamic colors from database
      "react/forbid-component-props": "off",
      "react/forbid-dom-props": "off",
    },
  },
  // Phase 6: Restrict supabaseAdmin imports to approved files only
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: [
      "src/lib/dal.ts",
      "src/lib/auth.ts",
      "src/lib/webauthn.ts",
      "src/lib/notifications.ts",
      "src/lib/supabase.ts",
    ],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{
          name: "@/lib/supabase",
          importNames: ["supabaseAdmin"],
          message: "supabaseAdmin is restricted to approved files (dal.ts, auth.ts, webauthn.ts, notifications.ts). Use getUserClient() or DAL methods instead.",
        }],
      }],
    },
  },
]);

export default eslintConfig;

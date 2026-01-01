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
]);

export default eslintConfig;

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsdoc from "eslint-plugin-jsdoc";

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
    files: ["**/*.{ts,tsx}"],
    ignores: ["*.config.*"],
    ...jsdoc.configs["flat/recommended-typescript"],
    rules: {
      ...jsdoc.configs["flat/recommended-typescript"].rules,
      "jsdoc/require-jsdoc": [
        "error",
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
          },
          checkGetters: false,
          checkSetters: false,
          publicOnly: true,
        },
      ],
      "jsdoc/require-description": "warn",
      "jsdoc/require-param-description": "error",
      "jsdoc/require-returns-description": "error",
    },
  },
]);

export default eslintConfig;

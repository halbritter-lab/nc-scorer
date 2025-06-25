// eslint.config.js
import globals from "globals";
import pluginJs from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  // Global ignores
  {
    ignores: ["dist/", "**/node_modules/", ".husky/", "docs/"],
  },

  // Base ESLint Recommended Rules applied globally initially
  pluginJs.configs.recommended,

  // Custom settings for JS/Vue/Scripts/Root files
  {
     files: ["src/**/*.js", "src/**/*.vue", "scripts/**/*.js", "*.js"], // Apply broadly first
     languageOptions: {
       ecmaVersion: "latest",
       sourceType: "module",
       // Combine globals correctly
       globals: {
          ...globals.browser,
          ...globals.node,     // Include node for scripts/config files if needed
          ...globals.es2022,  // Or your preferred ES version
       },
     },
     // rules: { /* JS specific rule overrides */ }
  },

  // Vue Specific Configurations
  // This spread applies Vue's recommended rules object(s)
  ...pluginVue.configs["flat/essential"],

  // This object applies Vue specific parser settings and rule overrides
  {
     files: ["src/**/*.vue"], // Target Vue files again
     languageOptions: {
        parser: vueParser, // MUST use vue-eslint-parser for .vue files
        parserOptions: {
           ecmaVersion: "latest",
           sourceType: "module",
        },
        // Globals are likely inherited, but can be specified if needed
        // globals: { ... }
     },
     plugins: {
        vue: pluginVue // Ensure plugin is associated
     },
     rules: {
       // Your Vue rule overrides
       "vue/multi-word-component-names": "off",
     }
  },

  // Prettier Config (Disables conflicting rules) - Final Object
  eslintConfigPrettier,
];
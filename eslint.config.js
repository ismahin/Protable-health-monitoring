const { defineConfig } = require("eslint/config");
const expo = require("eslint-config-expo/flat");
module.exports = defineConfig([
  expo,
  {
    ignores: [
      "dist/**",
      "artifacts/**",
      "src/map/leafletBundle.ts",
      "node_modules/**",
    ],
  },
]);

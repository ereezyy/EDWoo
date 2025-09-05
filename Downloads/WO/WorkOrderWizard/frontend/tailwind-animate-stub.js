/**
 * Fallback stub for tailwindcss-animate
 *
 * This file serves as a fallback when the actual tailwindcss-animate package
 * cannot be loaded. It provides a minimal implementation that won't break
 * the build process.
 */

function stubPlugin() {
  return {
    handler: function() {
      // This empty handler prevents build failures
      return {};
    }
  };
}

// Mock the plugin structure expected by Tailwind
stubPlugin.handler = function() {
  return {};
};

// Export in various formats to support different import types
module.exports = stubPlugin;
module.exports.default = stubPlugin;

// If used as ESM in Next.js
if (typeof exports.default === "function") {
  exports.default.handler = stubPlugin.handler;
}

/** @type {import('next').NextConfig} */
const path = require('path');
const fs = require('fs');

// Detect if tailwindcss-animate is available
const hasTailwindAnimate = (() => {
  try {
    require.resolve('tailwindcss-animate');
    return true;
  } catch (e) {
    return false;
  }
})();

console.log(`tailwindcss-animate available: ${hasTailwindAnimate}`);

// Alternative paths to check for the module
const possibleModulePaths = [
  path.resolve('./node_modules/tailwindcss-animate'),
  path.resolve('../node_modules/tailwindcss-animate')
];

// Log the existence of each possible path
possibleModulePaths.forEach(modulePath => {
  console.log(`Checking ${modulePath}: ${fs.existsSync(modulePath) ? 'exists' : 'not found'}`);
});

const nextConfig = {
  // appDir is now stable in Next.js 14, no need for experimental flag
  poweredByHeader: false, // Remove X-Powered-By header for security

  // Use standard Next.js deployment
  trailingSlash: false,

  // Optimize for Vercel deployment
  // This ensures that all dependencies are properly installed
  // during the build process
  onDemandEntries: {
    // Keep pages in memory for longer during development
    maxInactiveAge: 25 * 1000,
    // Number of pages to keep in memory
    pagesBufferLength: 2,
  },

  // Add module resolution settings for monorepo structure
  experimental: {
    // Enable the SWC compiler for faster builds
    swcMinify: true,
    // Allows imports from monorepo packages without transpiling
    externalDir: true,
  },

  // Handle module resolution issues during build
  webpack: (config, { isServer, dev }) => {
    // Log webpack config for debugging
    console.log(`Building for ${isServer ? 'server' : 'client'}, mode: ${dev ? 'development' : 'production'}`);

    // Enhanced infrastructure logging
    config.infrastructureLogging = {
      level: 'error',
      debug: /unable to resolve module|can't resolve/i,
    };

    // Add additional resolve modules to help find dependencies
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve('./node_modules'),
      path.resolve('../node_modules'), // Look in workspace root node_modules
    ];

    // Improved alias resolution for problematic packages
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Create an explicit alias for tailwindcss-animate
      'tailwindcss-animate': hasTailwindAnimate
        ? require.resolve('tailwindcss-animate')
        : path.resolve(__dirname, './node_modules/tailwindcss-animate'),
    };

    // Enhanced fallbacks for potentially problematic dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      // Add other common Node.js modules that might cause issues in the browser
      os: false,
      crypto: false,
      stream: false,
      // Handle tailwindcss-animate not being found
      'tailwindcss-animate': hasTailwindAnimate ? false : path.resolve(__dirname, './tailwind-animate-stub.js'),
    };

    // Exclude socket.io-client from server-side bundling
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('socket.io-client');
    }

    // Force specific modules to be resolved from the project's node_modules
    config.resolve.exportsFields = ['exports', 'browser', 'module', 'main'];
    config.resolve.preferRelative = true;

    // Add a plugin to warn about missing modules
    config.plugins.push({
      apply(compiler) {
        compiler.hooks.done.tap('CheckMissingModules', stats => {
          if (stats.hasErrors()) {
            const errors = stats.compilation.errors.map(error => error.message);
            const tailwindAnimateErrors = errors.filter(
              error => error.includes('tailwindcss-animate')
            );
            if (tailwindAnimateErrors.length > 0) {
              console.warn('❗ tailwindcss-animate resolution errors detected:');
              tailwindAnimateErrors.forEach(error => console.warn(error));
            }
          }
        });
      }
    });

    return config;
  },
};

// Create a stub for tailwindcss-animate if it doesn't exist
if (!hasTailwindAnimate) {
  const stubPath = path.resolve(__dirname, './tailwind-animate-stub.js');
  if (!fs.existsSync(stubPath)) {
    fs.writeFileSync(
      stubPath,
      'module.exports = function() { return {}; };',
      'utf8'
    );
    console.log('Created tailwindcss-animate stub at', stubPath);
  }
}

module.exports = nextConfig;


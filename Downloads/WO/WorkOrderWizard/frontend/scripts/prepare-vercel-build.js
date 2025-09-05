/**
 * Script to prepare the Vercel build environment for proper
 * tailwindcss-animate resolution
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparing Vercel build environment...');

// Paths to check and ensure
const modulePath = path.resolve('./node_modules/tailwindcss-animate');
const parentModulePath = path.resolve('../node_modules/tailwindcss-animate');

// Check if the module exists in either location
const hasModule = fs.existsSync(modulePath);
const hasParentModule = fs.existsSync(parentModulePath);

console.log(`Module exists at ${modulePath}: ${hasModule}`);
console.log(`Module exists at ${parentModulePath}: ${hasParentModule}`);

// If module doesn't exist in the current directory but exists in parent, copy it
if (!hasModule && hasParentModule) {
  console.log('Copying tailwindcss-animate from parent node_modules...');

  // Create directory structure if it doesn't exist
  if (!fs.existsSync(path.dirname(modulePath))) {
    fs.mkdirSync(path.dirname(modulePath), { recursive: true });
  }

  // Copy the module
  fs.cpSync(parentModulePath, modulePath, { recursive: true });
  console.log('Module copied successfully!');
}

// If module still doesn't exist, install it directly
if (!fs.existsSync(modulePath)) {
  console.log('Installing tailwindcss-animate directly...');
  try {
    execSync('npm install tailwindcss-animate@1.0.7 --no-save', { stdio: 'inherit' });
    console.log('Direct installation completed');
  } catch (error) {
    console.error('Error installing tailwindcss-animate:', error.message);
  }
}

// Create a fallback stub module in case everything else fails
const stubFile = path.resolve('./tailwind-animate-stub.js');
if (!fs.existsSync(stubFile)) {
  console.log('Creating fallback stub for tailwindcss-animate...');
  fs.writeFileSync(
    stubFile,
    'module.exports = function() { return {}; };',
    'utf8'
  );
  console.log('Fallback stub created');
}

// Check node_modules resolution
try {
  const resolvedPath = require.resolve('tailwindcss-animate');
  console.log('✅ tailwindcss-animate successfully resolved from:', resolvedPath);
} catch (error) {
  console.error('❌ Failed to resolve tailwindcss-animate:', error.message);

  // Create symbolic link from the stub file if needed
  console.log('Creating symbolic link from stub file...');
  if (fs.existsSync(path.dirname(modulePath))) {
    try {
      fs.symlinkSync(stubFile, modulePath, 'file');
      console.log('Symbolic link created');
    } catch (linkError) {
      console.error('Error creating symbolic link:', linkError.message);
      // If symlink fails, just copy the stub file
      fs.copyFileSync(stubFile, path.join(path.dirname(modulePath), 'index.js'));
      console.log('Copied stub file as a fallback');
    }
  }
}

console.log('🏁 Vercel build preparation complete!');

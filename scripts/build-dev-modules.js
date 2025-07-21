#!/usr/bin/env node

/**
 * Build Development Modules Script
 * 
 * This script creates JavaScript bundles for modules that can be loaded
 * via file:// protocol, solving CORS issues during development.
 * 
 * Usage: node scripts/build-dev-modules.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const MODULES_DIR = path.join(__dirname, '..', 'modules');
const MODULES_TO_BUILD = ['pricing']; // Add more modules as needed

// Helper function to escape backticks in HTML
function escapeTemplate(str) {
    return str.replace(/`/g, '\\`').replace(/\${/g, '\\${');
}

// Build a single module
function buildModule(moduleName) {
    console.log(`Building module: ${moduleName}`);
    
    const moduleDir = path.join(MODULES_DIR, moduleName);
    const htmlPath = path.join(moduleDir, `${moduleName}.html`);
    const bundlePath = path.join(moduleDir, `${moduleName}-bundle.js`);
    
    // Check if HTML file exists
    if (!fs.existsSync(htmlPath)) {
        console.error(`  ❌ HTML file not found: ${htmlPath}`);
        return false;
    }
    
    try {
        // Read HTML content
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        // Create bundle content
        const bundleContent = `// Auto-generated bundle for ${moduleName} module
// This file is for development mode only (file:// protocol)
// Generated on: ${new Date().toISOString()}

(function() {
    // Ensure ModuleContent exists
    window.ModuleContent = window.ModuleContent || {};
    
    // Embed the ${moduleName} module HTML content
    window.ModuleContent.${moduleName} = {
        html: \`${escapeTemplate(htmlContent)}\`
    };
    
    console.log('${moduleName} module bundle loaded');
})();`;
        
        // Write bundle file
        fs.writeFileSync(bundlePath, bundleContent);
        console.log(`  ✅ Bundle created: ${bundlePath}`);
        
        return true;
    } catch (error) {
        console.error(`  ❌ Error building module ${moduleName}:`, error.message);
        return false;
    }
}

// Main function
function main() {
    console.log('Building development module bundles...\n');
    
    let successCount = 0;
    let failCount = 0;
    
    // Build each module
    MODULES_TO_BUILD.forEach(moduleName => {
        if (buildModule(moduleName)) {
            successCount++;
        } else {
            failCount++;
        }
    });
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`Build complete: ${successCount} succeeded, ${failCount} failed`);
    
    if (failCount > 0) {
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { buildModule };
// Example configuration for ts-find-unused
// Optimized for Next.js projects
// v2.0+ uses new parameter names for better clarity

module.exports = {
    // Output format: "txt", "markdown", or "json"
    output: "markdown",

    // Optional: Write output to file instead of stdout
    destination: "./unused.md",

    // Log level: "none", "info", or "verbose"
    logLevel: "none",

    // Debug mode: logs configuration before running
    debug: true,

    // Project path (relative to config file)
    projectPath: "./",

    // Check for unused enum members (can be slow on large projects)
    checkEnumMembers: false,

    // Exit with error code 1 if unused code is found (useful for CI/CD)
    // failOnFound: false,

    // EXCLUDE FILES (v2.0+: renamed from "ignorePatterns")
    // These use simple string matching (.includes()) - not glob patterns!
    // Files matching these patterns will NOT be scanned for unused code
    excludeFiles: [
        "/src/pages/",        // Next.js pages (used by framework)
        "/pages/",            // Next.js pages at root
        ".stories.",          // Storybook story files
        "/__tests__/",        // Test directories
        ".test.",             // Test files
        ".spec.",             // Spec files
        "/node_modules/",     // Dependencies
        "/dist/",             // Build output
        "/build/",            // Build output
        "/.next/",            // Next.js build cache
    ],

    // IGNORE USAGES IN (v2.0+: renamed from "referenceIgnorePatterns")
    // These use simple string matching (.includes())
    // If a symbol is ONLY used in files matching these patterns, it won't be marked as unused
    ignoreUsagesIn: [
        "/src/pages/",        // Imports used only in Next.js pages
        "/pages/",            // Imports used only in Next.js pages
        "__tests__",          // Imports used only in tests
        ".next/",             // Next.js generated files
        "node_modules/",      // Third-party code
    ],

    // IGNORE USAGES IN REGEX (v2.0+: renamed from "referenceIgnoreRegex")
    // These are regex patterns matched against the FULL file path
    // If a symbol is ONLY used in files matching these patterns, it won't be marked as unused
    ignoreUsagesInRegex: [
        "\\.stories\\.(tsx?|jsx?)$",     // Storybook: .stories.ts, .stories.tsx, .stories.js, .stories.jsx
        "/__tests__/.*\\.(tsx?|jsx?)$",  // Test files in __tests__ directories
        "/index\\.(tsx?|jsx?)$",         // Index files (often just re-exports)
        "\\.test\\.(tsx?|jsx?)$",        // Jest test files: .test.ts, .test.tsx
        "\\.spec\\.(tsx?|jsx?)$",        // Spec files: .spec.ts, .spec.tsx
        "/_app\\.(tsx?|jsx?)$",          // Next.js _app file
        "/_document\\.(tsx?|jsx?)$",     // Next.js _document file
        "/_error\\.(tsx?|jsx?)$",        // Next.js _error file
        "/api/.*\\.(tsx?|jsx?)$",        // Next.js API routes
    ],
};

// USAGE EXAMPLES:

// 1. Run with this config file:
//    npx ts-find-unused --config ./config.example.js

// 2. Override config options via CLI:
//    npx ts-find-unused --config ./config.example.js --output json

// 3. Use default config file name (.ts-find-unused.config.js):
//    Copy this file to .ts-find-unused.config.js and run:
//    npx ts-find-unused

// TIPS FOR NEXT.JS PROJECTS:

// - Add `/src/pages/` and `/pages/` to both ignorePatterns and referenceIgnorePatterns
//   because Next.js uses file-based routing (pages are "used" by the framework)

// - Add story files to ignorePatterns if you use Storybook, since stories
//   import components just for documentation

// - Add test directories and files to both ignorePatterns and referenceIgnorePatterns
//   to avoid marking test utilities and test-only imports as unused

// - Consider adding `/src/components/ui/` or similar directories to referenceIgnorePatterns
//   if they contain reusable components that might not be used yet

// - Use checkEnumMembers: false for large projects to improve performance

// - Use failOnFound: true in CI/CD pipelines to prevent unused code from being merged

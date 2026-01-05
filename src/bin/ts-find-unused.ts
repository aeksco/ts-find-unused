#!/usr/bin/env node

// Check node version before requiring/doing anything else
// The user may be on a very old node version
// import minimist from "minimist";
import { Command } from "commander";
import { resolve } from "path";
import { existsSync } from "fs";
import chalk from "chalk";
import { runCommand } from "../commands/run";
import { LogLevels, LogLevel } from "../types";
const packageJson = require("../../package.json");

/**
 * Parse configuration from config file and command line options
 */
function parseConfig(opts: {
  output?: "markdown" | "txt" | "json";
  destination?: string;
  debug?: boolean;
  projectPath?: string;
  tsconfigPath?: string;
  logLevel?: LogLevel;
  config?: string;
  // New parameter names (v2.0+)
  excludeFiles?: string;
  ignoreUsagesIn?: string;
  ignoreUsagesInRegex?: string;
  // Old parameter names (deprecated)
  ignorePatterns?: string;
  referenceIgnorePatterns?: string;
  referenceIgnoreRegex?: string;
  failOnFound?: boolean;
  checkEnumMembers?: boolean;
}) {
  // Set default values
  let {
    output = "txt",
    logLevel = LogLevels.none,
    destination = undefined,
    debug = false,
    projectPath = ".",
    tsconfigPath = "./tsconfig.json",
    config = "./.ts-find-unused.config.js",
    ignorePatterns = "",
    referenceIgnorePatterns = "",
    referenceIgnoreRegex = "",
    failOnFound = false,
    checkEnumMembers = true,
  } = opts;

  // Defines the path to the config file
  const configPath = resolve(process.cwd(), config);

  // Store config values for deprecation checking
  let configValues: any = null;

  // Check if config file exists
  if (existsSync(configPath)) {
    // Attempt to load .ts-find-unused.config.js
    try {
      // Load the config via configPath
      configValues = require(configPath);

      // Log "loaded config" message
      if (logLevel !== LogLevels.none) {
        console.log(`Loaded config from ${config}`);
      }

      // Overwrite defaults from configValues
      output = configValues.output || output;
      logLevel = configValues.logLevel || logLevel;
      destination = configValues.destination || destination;
      debug = configValues.debug || debug;
      projectPath = configValues.projectPath || projectPath;
      tsconfigPath = configValues.tsconfigPath || tsconfigPath;
      failOnFound = configValues.failOnFound || failOnFound;
      checkEnumMembers = configValues.checkEnumMembers !== undefined ? configValues.checkEnumMembers : checkEnumMembers;

      // Parse excludeFiles (new) or ignorePatterns (old, deprecated)
      const excludeFilesConfig = configValues.excludeFiles || configValues.ignorePatterns;
      if (Array.isArray(excludeFilesConfig)) {
        ignorePatterns = excludeFilesConfig.join(",");
      } else if (excludeFilesConfig) {
        ignorePatterns = excludeFilesConfig;
      }

      // Parse ignoreUsagesIn (new) or referenceIgnorePatterns (old, deprecated)
      const ignoreUsagesInConfig = configValues.ignoreUsagesIn || configValues.referenceIgnorePatterns;
      if (Array.isArray(ignoreUsagesInConfig)) {
        referenceIgnorePatterns = ignoreUsagesInConfig.join(",");
      } else if (ignoreUsagesInConfig) {
        referenceIgnorePatterns = ignoreUsagesInConfig;
      }

      // Parse ignoreUsagesInRegex (new) or referenceIgnoreRegex (old, deprecated)
      const ignoreUsagesInRegexConfig = configValues.ignoreUsagesInRegex || configValues.referenceIgnoreRegex;
      if (Array.isArray(ignoreUsagesInRegexConfig)) {
        referenceIgnoreRegex = ignoreUsagesInRegexConfig.join(",");
      } else if (ignoreUsagesInRegexConfig) {
        referenceIgnoreRegex = ignoreUsagesInRegexConfig;
      }
    } catch (e) {
      // Log config-not-found message
      if (logLevel !== LogLevels.none) {
        console.log("Config could not be loaded!");
      }
    }
  }

  // Override with command line arguments if provided (new names take precedence over old)
  ignorePatterns = opts.excludeFiles || opts.ignorePatterns || ignorePatterns;
  referenceIgnorePatterns = opts.ignoreUsagesIn || opts.referenceIgnorePatterns || referenceIgnorePatterns;
  referenceIgnoreRegex = opts.ignoreUsagesInRegex || opts.referenceIgnoreRegex || referenceIgnoreRegex;

  // Split ignorePatterns text into array + remove empty strings
  const ignorePatternsArray: string[] = ignorePatterns
    .split(",")
    .filter((i) => i !== "");

  // Split referenceIgnorePatterns text into array + remove empty strings
  const referenceIgnorePatternsArray: string[] = referenceIgnorePatterns
    .split(",")
    .filter((i) => i !== "");

  // Split referenceIgnoreRegex text into array + remove empty strings
  const referenceIgnoreRegexArray: string[] = referenceIgnoreRegex
    .split(",")
    .filter((i) => i !== "");

  // Check for deprecated parameter usage and warn users
  const deprecatedOptions = [];

  if (opts.ignorePatterns || (config && configValues && configValues.ignorePatterns)) {
    deprecatedOptions.push('ignorePatterns → excludeFiles');
  }
  if (opts.referenceIgnorePatterns || (config && configValues && configValues.referenceIgnorePatterns)) {
    deprecatedOptions.push('referenceIgnorePatterns → ignoreUsagesIn');
  }
  if (opts.referenceIgnoreRegex || (config && configValues && configValues.referenceIgnoreRegex)) {
    deprecatedOptions.push('referenceIgnoreRegex → ignoreUsagesInRegex');
  }

  if (deprecatedOptions.length > 0 && logLevel !== LogLevels.none) {
    console.warn('\n⚠️  Deprecated configuration options detected:');
    deprecatedOptions.forEach(msg => {
      console.warn(`   - ${msg}`);
    });
    console.warn('   Please update your configuration to use the new parameter names.');
    console.warn('   See: https://github.com/aeksco/ts-find-unused#configuration\n');
  }

  return {
    output,
    logLevel,
    destination,
    debug,
    projectPath,
    tsconfigPath,
    ignorePatterns: ignorePatternsArray,
    referenceIgnorePatterns: referenceIgnorePatternsArray,
    referenceIgnoreRegex: referenceIgnoreRegexArray,
    failOnFound,
    checkEnumMembers
  };
}

// // // //
// Setup CLI with Commander
const program = new Command();

// Logo from: https://patorjk.com/software/taag/#p=display&v=0&f=Basic&t=ts-find-unused
// FEATURE - add credit to README.md
const logoText = `
d888888b .d8888.        d88888b d888888b d8b   db d8888b.        db    db d8b   db db    db .d8888. d88888b d8888b.
'~~88~~' 88'  YP        88'       '88'   888o  88 88  '8D        88    88 888o  88 88    88 88'  YP 88'     88  '8D
   88    '8bo.          88ooo      88    88V8o 88 88   88        88    88 88V8o 88 88    88 '8bo.   88ooooo 88   88
   88      'Y8b.        88~~~      88    88 V8o88 88   88        88    88 88 V8o88 88    88   'Y8b. 88~~~~~ 88   88
   88    db   8D        88        .88.   88  V888 88  .8D        88b  d88 88  V888 88b  d88 db   8D 88.     88  .8D
   YP    '8888Y'        YP      Y888888P VP   V8P Y8888D'        ~Y8888P' VP   V8P ~Y8888P' '8888Y' Y88888P Y8888D'
`;
program.addHelpText("before", `\n${chalk.cyan(logoText)}\n`);

// // // //

// Setup `plugin-run` command
program
  .version(String(packageJson.version))
  .option(
    "-p, --project-path <projectPath>",
    "Path to the project directory (default: current directory)"
  )
  .option(
    "-t, --tsconfig-path <tsconfigPath>",
    "Path to the tsconfig.json file (default: ./tsconfig.json)"
  )
  .option(
    "-e, --exclude-files <excludeFiles>",
    "Files to exclude from scanning (these files won't be checked for unused code)"
  )
  .option(
    "-u, --ignore-usages-in <ignoreUsagesIn>",
    "Ignore usages found in these files (code only used here will be marked as unused)"
  )
  .option(
    "-ur, --ignore-usages-in-regex <ignoreUsagesInRegex>",
    "Ignore usages in files matching regex patterns"
  )
  .option(
    "-i, --ignore-patterns <ignorePatterns>",
    "[DEPRECATED: use --exclude-files] Skip scanning files that match patterns"
  )
  .option(
    "-ri, --reference-ignore-patterns <referenceIgnorePatterns>",
    "[DEPRECATED: use --ignore-usages-in] Ignore references in files matching patterns"
  )
  .option(
    "-rir, --reference-ignore-regex <referenceIgnoreRegex>",
    "[DEPRECATED: use --ignore-usages-in-regex] Ignore references matching regex"
  )
  .option(
    "-o, --output <o>",
    "Output - choose output format txt|markdown|json (default: txt)"
  )
  .option(
    "-d --destination <destination>",
    "Destination - optional filepath to write the output instead of logging to stdout"
  )
  .option(
    "-l --logLevel <logLevel>",
    "Log Level - choose level of program logs none|info|verbose (default: none)"
  )
  .option(
    "-c --config <path>",
    "Config - optional filepath to a .ts-find-unused.js configuration file (default: .ts-find-unused.config.js)"
  )
  .option("--debug", "Debug - debug CLI options")
  .option(
    "--fail-on-found",
    "Exit with error code 1 if unused code is found (useful for CI/CD pipelines)"
  )
  .option(
    "--check-enum-members",
    "Check for unused enum members (default: true)"
  )
  .option(
    "--no-check-enum-members",
    "Skip checking for unused enum members"
  )
  .description("Run the ts-find-unused program")
  .action(
    (opts: {
      output?: "markdown" | "txt" | "json";
      destination?: string;
      debug?: boolean;
      projectPath?: string;
      tsconfigPath?: string;
      logLevel?: LogLevel;
      config?: string;
      // New parameter names (v2.0+)
      excludeFiles?: string;
      ignoreUsagesIn?: string;
      ignoreUsagesInRegex?: string;
      // Old parameter names (deprecated)
      ignorePatterns?: string;
      referenceIgnorePatterns?: string;
      referenceIgnoreRegex?: string;
      failOnFound?: boolean;
      checkEnumMembers?: boolean;
    }) => {
      // Parse configuration
      const config = parseConfig(opts);

      // Short-circuit execution if "output" option isn't valid
      if (["markdown", "json", "txt"].indexOf(config.output) === -1) {
        console.log(`"${config.output}" is not a valid option for --outputFormat`);
        process.exit(1);
      }

      // Validate regex patterns upfront
      config.referenceIgnoreRegex.forEach((pattern, index) => {
        try {
          new RegExp(pattern);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Invalid regex pattern at index ${index}: "${pattern}"`);
          console.error(`Error: ${message}`);
          process.exit(1);
        }
      });

      // Log out options if debug is "true"
      if (config.debug) {
        console.log("Debug CLI options:");
        console.log(config);
      }

      // Pass parameters to `runCommand` to run the program
      runCommand(config);
    }
  );

// Add help command
program.on("--help", () => {
  console.log(
    `\n\tSupport this project at ${chalk.cyan(
      `https://github.com/aeksco/ts-find-unused`
    )}\n`
  );
});

// Parse arguments into commander program
program.parse();
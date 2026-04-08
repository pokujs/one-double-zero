import type { Profiler } from 'node:inspector';
import type { ReportOptions, ReportType } from 'istanbul-reports';
import type {
  Context,
  ProcessCoverage,
  Reporter,
  SourceMap,
} from 'one-double-zero';
import type { PokuPlugin } from 'poku/plugins';
import type { CoverageOptions, V8CoverageFile } from './types.js';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { mergeProcessCovs } from '@bcoe/v8-coverage';
import { globSync } from 'glob';
import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';
import { createOneDoubleZero, unresolvable } from 'one-double-zero';
import { loadConfig } from './config.js';

export type { CoverageOptions } from './types.js';

const loadProcessCoverage = (tempDir: string): ProcessCoverage => {
  const fileNames = readdirSync(tempDir).map((f) => resolve(tempDir, f));

  let processCoverage: { result: Profiler.ScriptCoverage[] } = { result: [] };
  const sourceMaps = new Map<string, SourceMap>();

  for (const fileName of fileNames) {
    let fileContent: string;

    try {
      fileContent = readFileSync(fileName, 'utf8');
    } catch {
      continue;
    }

    const parsed: V8CoverageFile = JSON.parse(fileContent);

    const currentCoverage = {
      result: parsed.result.filter((s) => s.url.startsWith('file:///')),
    };

    const sourceMapCache = parsed['source-map-cache'] ?? {};

    for (const name in sourceMapCache) {
      const { data, lineLengths } = sourceMapCache[name];

      sourceMaps.set(name, {
        ...(data ?? {
          file: null,
          mappings: '',
          names: [],
          sources: [],
          version: 3 as const,
        }),
        scriptContent: (lineLengths ?? [])
          .map((lineLength) => ''.padEnd(lineLength, '.'))
          .join('\n'),
      });
    }

    processCoverage = mergeProcessCovs([processCoverage, currentCoverage]);
  }

  return {
    scriptCoverages: processCoverage.result.map((s) => ({
      functions: s.functions.map((fn) => ({
        functionName: fn.functionName,
        ranges: fn.ranges.map((r) => ({
          count: r.count,
          endOffset: r.endOffset,
          startOffset: r.startOffset,
        })),
      })),
      url: s.url,
    })),
    sourceMaps,
  };
};

const createReporters = (
  names: ReportType[],
  reporterOptions: Partial<{ [K in ReportType]: Partial<ReportOptions[K]> }>,
  skipFull: boolean
): Reporter[] =>
  names.map((name) => {
    const istanbulReporter = reports.create(name, {
      skipEmpty: false,
      skipFull,
      ...reporterOptions[name],
    });

    return {
      name,
      execute(context: Context) {
        istanbulReporter.execute(
          libReport.createContext({
            coverageMap: context.coverageMap,
            dir: context.outputDirectory,
            watermarks: context.watermarks,
          })
        );
      },
    };
  });

export const coverage = (
  options: CoverageOptions = Object.create(null)
): PokuPlugin => {
  let enabled = false;
  let tempDir: string;
  let originalEnv: string | undefined;
  let cwd: string;

  return {
    name: '@pokujs/one-double-zero',

    setup(context) {
      if (options.requireFlag && !process.argv.includes('--coverage')) return;
      if (context.runtime !== 'node')
        console.warn(
          `[@pokujs/one-double-zero] V8 coverage is only supported on Node.js (current runtime: ${context.runtime}). Coverage data may not be collected.`
        );

      enabled = true;
      cwd = context.cwd;

      const cliConfig = process.argv
        .find((arg) => arg.startsWith('--coverageConfig'))
        ?.split('=')[1];

      const resolvedConfig = cliConfig ?? options.config;
      const fileConfig = loadConfig(context.cwd, resolvedConfig);

      options = { ...fileConfig, ...options };
      originalEnv = process.env.NODE_V8_COVERAGE;

      tempDir = options.coverageDirectory
        ? resolve(context.cwd, options.coverageDirectory)
        : mkdtempSync(join(tmpdir(), 'poku-odz-'));

      if (!options.append) {
        try {
          rmSync(tempDir, { recursive: true, force: true });
        } catch {
          // Best-effort cleanup
        }
      }

      mkdirSync(tempDir, { recursive: true });
      process.env.NODE_V8_COVERAGE = tempDir;
    },

    async teardown() {
      if (!enabled) return;

      if (originalEnv !== undefined) process.env.NODE_V8_COVERAGE = originalEnv;
      else delete process.env.NODE_V8_COVERAGE;

      const processCoverage = loadProcessCoverage(tempDir);

      const sourceFiles = globSync(
        options.sources ?? ['**/*.{js,mjs,jsx,ts,mts,tsx}'],
        {
          cwd,
          ignore: options.excludedSources ?? [],
          absolute: true,
        }
      );

      const readFile = (path: string) => {
        try {
          return readFileSync(path);
        } catch {
          return unresolvable;
        }
      };

      const odz = createOneDoubleZero(console.info, readFile);

      const coverageMap = await odz.getCoverageMap(
        sourceFiles,
        processCoverage,
        options.logLevel,
        options.ignoreUnhitSources
      );

      const reporters = createReporters(
        options.reporters ?? ['text'],
        options.reporterOptions ?? {},
        options.skipFull ?? false
      );
      const reportsDirectory = options.reportsDirectory ?? '.odz_output';

      await odz.report(
        coverageMap,
        reporters,
        reportsDirectory,
        options.watermarks
      );

      if (options.thresholds) {
        const failures = odz.compare(
          coverageMap,
          options.thresholds,
          options.perFile ?? false
        );

        for (const failure of failures) {
          const scope = failure.fileName ? ` (${failure.fileName})` : '';
          console.error(
            `[@pokujs/one-double-zero] ${failure.thresholdType} coverage${scope}: ${failure.actual}% < ${failure.expectation}%`
          );
        }

        if (failures.length > 0) process.exitCode = 1;
      }

      if (!options.coverageDirectory) {
        try {
          rmSync(tempDir, { recursive: true, force: true });
        } catch {
          // Best-effort cleanup
        }
      }
    },
  };
};

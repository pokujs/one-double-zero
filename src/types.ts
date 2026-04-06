import type { Profiler } from 'node:inspector';
import type { ReportOptions, ReportType } from 'istanbul-reports';
import type {
  LogLevel,
  SourceMap,
  Thresholds,
  Watermarks,
} from 'one-double-zero';

export type V8CoverageFile = {
  result: Profiler.ScriptCoverage[];
  'source-map-cache'?: Record<
    string,
    {
      data?: Omit<SourceMap, 'scriptContent'>;
      lineLengths?: number[];
    }
  >;
};

export type CoverageOptions = {
  /** Require `--coverage` CLI flag to activate the plugin. */
  requireFlag?: boolean;
  /** Custom ODZ config file path (JSON/JSONC only), or `false` to skip config loading. */
  config?: string | false;
  /** Glob patterns for source files to include in coverage. */
  sources?: string[];
  /** Glob patterns for source files to exclude from coverage. */
  excludedSources?: string[];
  /** Istanbul reporter names (e.g. `'text'`, `'lcov'`, `'html'`). */
  reporters?: ReportType[];
  /** Per-reporter options. */
  reporterOptions?: Partial<{
    [K in ReportType]: Partial<ReportOptions[K]>;
  }>;
  /** Directory where reports will be written. */
  reportsDirectory?: string;
  /** Directory where V8 coverage data is stored. */
  coverageDirectory?: string;
  /** Watermarks for coverage reporters. */
  watermarks?: Watermarks;
  /** Whether to ignore unhit source files. */
  ignoreUnhitSources?: boolean;
  /** Skip files with 100% coverage in reports. */
  skipFull?: boolean;
  /** Append to existing coverage data instead of replacing. */
  append?: boolean;
  /** Log level for one-double-zero. */
  logLevel?: LogLevel;
  /** Coverage thresholds to enforce. */
  thresholds?: Thresholds;
  /** Whether thresholds should be checked per file. */
  perFile?: boolean;
};

<div align="center">
<img height="180" alt="Poku's Logo" src="https://raw.githubusercontent.com/wellwelwel/poku/main/.github/assets/readme/poku.svg">

# @pokujs/one-double-zero

Enjoying **Poku**? [Give him a star to show your support](https://github.com/wellwelwel/poku) ⭐

</div>

---

📚 [**Documentation**](https://poku.io/docs/documentation/helpers/coverage/one-double-zero)

---

☔️ [**@pokujs/one-double-zero**](https://github.com/pokujs/one-double-zero) is a **Poku** plugin for native **V8** code coverage using [**one-double-zero**](https://gitlab.com/nightlycommit/one-double-zero).

> [!TIP]
>
> **@pokujs/one-double-zero** supports **JSONC**, **TOML**, and **YAML** config files out of the box. You can also use **JS** and **TS** by setting options directly in the plugin.

---

## Quickstart

### Install

```bash
npm i -D @pokujs/one-double-zero
```

### Usage

```js
// poku.config.js
import { coverage } from '@pokujs/one-double-zero';
import { defineConfig } from 'poku';

export default defineConfig({
  plugins: [coverage()],
});
```

Run `poku` and a coverage report will be generated after your test results.

> [!IMPORTANT]
>
> This plugin relies on **Node.js**' built-in `NODE_V8_COVERAGE` environment variable to collect coverage data. **Bun** and **Deno** do not support this mechanism, so coverage data will not be collected when running tests with these runtimes.

---

## Options

The plugin accepts the following options:

```js
coverage({
  // Plugin-specific options
  requireFlag: true, // default: false — require `--coverage` CLI flag to activate
  config: 'odz.config.json', // default: auto-discover

  // All options below match the .odzrc.json schema
  sources: ['**/src/**'], // default: ['**/*.{js,mjs,jsx,ts,mts,tsx}']
  excludedSources: ['**/vendor/**'], // default: []
  reporters: ['text', 'lcov'], // default: ['text']
  reporterOptions: { text: { skipEmpty: true } }, // default: {} — per-reporter options
  reportsDirectory: './coverage-reports', // default: '.odz_output'
  coverageDirectory: '.odz_output/.coverage', // default: temp dir
  watermarks: {
    statements: [80, 100],
    functions: [80, 100],
    branches: [80, 100],
    lines: [80, 100],
  },
  ignoreUnhitSources: false, // default: false
  skipFull: false, // default: false — skip files with 100% coverage in reports
  append: false, // default: false — append to existing coverage data
  logLevel: 'info', // default: 'info' — 'info' or 'debug'
  thresholds: {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80,
  },
  perFile: false, // default: false — check thresholds per file
});
```

---

## Examples

### Console coverage details

```js
coverage({
  reporters: ['text'],
  sources: ['**/src/**'],
});
```

### Generate V8 HTML and LCOV reports

```js
coverage({
  reporters: ['html', 'lcovonly'],
  sources: ['**/src/**'],
});
```

### Multiple reporters

```js
coverage({
  reporters: ['html', 'text', 'lcovonly'],
  sources: ['**/src/**'],
});
```

### Enforce coverage thresholds

```js
coverage({
  reporters: ['text'],
  sources: ['**/src/**'],
  thresholds: {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80,
  },
});
```

### Require `--coverage` flag

By default, coverage runs whenever the plugin is active. Use `requireFlag` to only collect coverage when `--coverage` is passed to the CLI, keeping watch mode, debugging, and filtered runs fast:

```js
coverage({
  reporters: ['text'],
  sources: ['**/src/**'],
  requireFlag: true,
});
```

```bash
# No coverage (plugin is a no-op)
poku test/

# With coverage
poku --coverage test/
```

### Using a config file

Use any supported config format:

```jsonc
// odz.config.jsonc
{
  // Coverage reports
  "reporters": ["text", "html"],
  "sources": ["**/src/**"],
}
```

```toml
# odz.config.toml
reporters = ["text", "html"]
sources = ["**/src/**"]
```

```yaml
# odz.config.yaml
reporters:
  - text
  - html
sources:
  - '**/src/**'
```

```js
// poku.config.js
coverage({
  config: 'odz.config.jsonc', // or false to disable config file discovery
});
```

When no `config` is specified, the plugin automatically searches for `odz.config.json`, `odz.config.jsonc`, `odz.config.toml`, `odz.config.yaml`, and `odz.config.yml` in the working directory.

You can also specify the config path via CLI:

```bash
poku --coverageConfig=odz.config.jsonc test/
```

> [!NOTE]
>
> **Priority order:**
>
> - For config file discovery: `--coverageConfig` (CLI) > `config` (plugin option) > auto-discovery
> - For coverage options: plugin options > config file options

---

## How It Works

- **`setup`** creates a temp directory and sets `NODE_V8_COVERAGE` — every test process spawned by **Poku** automatically writes **V8** coverage data
- **`teardown`** uses [**one-double-zero**](https://gitlab.com/nightlycommit/one-double-zero) to read coverage data from the temp directory, generate reports, then cleans up
- No modification to test commands or runner configuration needed

---

## License

**MIT** © [**wellwelwel**](https://github.com/wellwelwel) and [**contributors**](https://github.com/pokujs/one-double-zero/graphs/contributors).

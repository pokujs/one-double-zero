import type { CoverageOptions } from './types.js';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSONC } from 'jsonc.min';
import { parse as tomlParse } from 'toml.min';
import YAML from 'yaml';

const scriptExtensions = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.mts',
  '.cts',
]);

const isScript = (path: string): boolean =>
  scriptExtensions.has(getExtension(path));

const isToml = (path: string): boolean => getExtension(path) === '.toml';

const isYaml = (path: string): boolean => {
  const ext = getExtension(path);
  return ext === '.yml' || ext === '.yaml';
};

const getExtension = (filePath: string): string => {
  const dotIndex = filePath.lastIndexOf('.');
  if (dotIndex === -1) return '';
  return filePath.slice(dotIndex);
};

const parseConfig = (content: string, filePath: string): CoverageOptions => {
  if (isToml(filePath)) return tomlParse(content) as CoverageOptions;
  if (isYaml(filePath)) return YAML.parse(content) as CoverageOptions;
  return JSONC.parse(content) as CoverageOptions;
};

export const loadConfig = (
  cwd: string,
  customPath?: string | false
): CoverageOptions | undefined => {
  if (customPath === false) return;

  const expectedFiles = customPath
    ? [customPath]
    : [
        'odz.config.json',
        'odz.config.jsonc',
        'odz.config.toml',
        'odz.config.yaml',
        'odz.config.yml',
      ];

  for (const file of expectedFiles) {
    if (isScript(file)) continue;

    const filePath = join(cwd, file);

    if (!existsSync(filePath)) continue;

    try {
      const content = readFileSync(filePath, 'utf8');

      return parseConfig(content, file);
    } catch {}
  }
};

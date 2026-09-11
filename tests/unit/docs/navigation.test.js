import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import docsConfig from '../../../docs/.vitepress/config.js';

const docsRoot = path.resolve(process.cwd(), 'docs');

function collectLinks(value) {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, item]) =>
    key === 'link' && typeof item === 'string' ? [item] : collectLinks(item),
  );
}

function isLocalPage(link) {
  return !/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(link);
}

function pageExists(link, sourceDirectory = docsRoot) {
  const pathname = decodeURIComponent(link.split(/[?#]/)[0]);
  const target = pathname.startsWith('/')
    ? path.join(docsRoot, pathname)
    : path.resolve(sourceDirectory, pathname);
  const stem = target.replace(/\.(?:md|html)$/, '');
  return existsSync(`${stem}.md`) || existsSync(path.join(stem, 'index.md'));
}

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.')) return [];
    const target = path.join(directory, entry.name);
    return entry.isDirectory()
      ? markdownFiles(target)
      : entry.name.endsWith('.md')
        ? [target]
        : [];
  });
}

describe('documentation navigation', () => {
  const configuredLinks = [
    ...new Set(
      collectLinks({
        nav: docsConfig.themeConfig.nav,
        sidebar: docsConfig.themeConfig.sidebar,
      }).filter(isLocalPage),
    ),
  ];

  it.each(configuredLinks)(
    'resolves configured navigation target %s to a Markdown page',
    (link) => {
      expect(pageExists(link), `Missing documentation page for ${link}`).toBe(
        true,
      );
    },
  );

  it('resolves local links and homepage actions to existing documentation pages', () => {
    const missing = [];
    for (const file of markdownFiles(docsRoot)) {
      const content = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
      const links = [
        ...content.matchAll(/(?<!!)\[[^\]]*\]\(([^\s)]+)(?:\s+[^)]*)?\)/g),
        ...content.matchAll(/^\s+link:\s*(\S+)/gm),
      ]
        .map((match) => match[1])
        .filter(isLocalPage);
      for (const link of links) {
        if (!pageExists(link, path.dirname(file))) {
          missing.push(`${path.relative(docsRoot, file)} → ${link}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

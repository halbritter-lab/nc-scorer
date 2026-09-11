import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';
import {
  transformVariantLinkerApi,
  variantLinkerBrowserPlugin,
  variantLinkerBrowserOptimizer,
} from '../../scripts/variant-linker-browser.js';

const require = createRequire(import.meta.url);
const apiFilename = require.resolve('variant-linker/src/apiHelper.js');
const upstream = readFileSync(apiFilename, 'utf8');

function loadApi(code) {
  const requests = [];
  const axiosClient = {
    async get(url) {
      requests.push(url);
      return { status: 200, data: { url } };
    },
    async post(url) {
      requests.push(url);
      return { status: 200, data: { url } };
    },
    isCancel: () => false,
  };
  const context = {
    module: { exports: {} },
    URLSearchParams,
    URL,
    AbortController,
    setTimeout,
    clearTimeout,
    Date,
    Set,
    Map,
    Math,
    JSON,
    require(name) {
      if (name === 'axios')
        return {
          default: axiosClient,
          ...axiosClient,
        };
      if (name === 'debug') return () => () => {};
      if (name === './cache')
        return {
          getCache() {},
          setCache() {},
          getCacheAsync: async () => null,
        };
      if (name === '../config/apiConfig.json')
        return require('variant-linker/config/apiConfig.json');
      if (name === './api/requestContext')
        return require('variant-linker/src/api/requestContext.js');
      if (name === './api/originScheduler')
        return require('variant-linker/src/api/originScheduler.js');
      throw new Error(`Unexpected dependency: ${name}`);
    },
  };
  runInNewContext(code, context);
  return { fetchApi: context.module.exports.fetchApi, requests };
}

describe('variant-linker browser adapter', () => {
  it('routes production-transformed upstream requests and ignores unrelated modules', async () => {
    const plugin = variantLinkerBrowserPlugin();
    expect(
      plugin.transform('unrelated source', '/src/apiHelper.js'),
    ).toBeUndefined();
    const transformed = plugin.transform(upstream, `${apiFilename}?browser`);
    const { fetchApi, requests } = loadApi(transformed.code);
    await fetchApi('/vep/homo_sapiens/id/rs123', {
      __ncEnsemblBaseUrl: '/ensembl_grch37',
      CADD: '1',
    });
    expect(requests).toEqual([
      '/ensembl_grch37/vep/homo_sapiens/id/rs123?CADD=1',
    ]);
  });

  it('keeps concurrent GRCh37 and GRCh38 requests separate and hides routing metadata', async () => {
    const { fetchApi, requests } = loadApi(transformVariantLinkerApi(upstream));
    await Promise.all([
      fetchApi('/variant_recoder/homo_sapiens/rs123', {
        __ncEnsemblBaseUrl: '/ensembl_grch37',
        vcf_string: '1',
      }),
      fetchApi(
        '/vep/homo_sapiens/region',
        {
          __ncEnsemblBaseUrl: '/ensembl',
          CADD: '1',
        },
        false,
        'POST',
        { variants: ['1 100 . A T . . .'] },
      ),
      fetchApi('/vep/homo_sapiens/id/rs123', {
        __ncEnsemblBaseUrl: 'https://grch37.rest.ensembl.org',
      }),
    ]);
    expect(requests).toEqual([
      '/ensembl_grch37/variant_recoder/homo_sapiens/rs123?vcf_string=1',
      '/ensembl/vep/homo_sapiens/region?CADD=1',
      'https://grch37.rest.ensembl.org/vep/homo_sapiens/id/rs123',
    ]);
  });

  it('fails explicitly when a dependency update changes the adapter contract', () => {
    expect(() => transformVariantLinkerApi('upstream changed')).toThrow(
      /variant-linker/,
    );
  });

  it('applies the same assembly routing during development dependency optimization', async () => {
    const result = await build({
      entryPoints: [apiFilename],
      bundle: true,
      write: false,
      format: 'cjs',
      platform: 'browser',
      external: [
        'axios',
        'debug',
        './cache',
        '../config/apiConfig.json',
        './api/requestContext',
        './api/originScheduler',
      ],
      plugins: [variantLinkerBrowserOptimizer()],
    });
    const { fetchApi, requests } = loadApi(result.outputFiles[0].text);
    await fetchApi('/vep/homo_sapiens/id/rs123', {
      __ncEnsemblBaseUrl: '/ensembl_grch37',
      CADD: '1',
    });
    expect(requests).toEqual([
      '/ensembl_grch37/vep/homo_sapiens/id/rs123?CADD=1',
    ]);
  });

  it('guards fs.promises in filesystem helpers to eliminate browser warnings', () => {
    const pedFilename = require.resolve('variant-linker/src/pedReader.js');
    const featureFilename = require.resolve(
      'variant-linker/src/featureParser.js',
    );
    const plugin = variantLinkerBrowserPlugin();

    for (const file of [pedFilename, featureFilename]) {
      const code = readFileSync(file, 'utf8');
      const transformed = plugin.transform(code, file);
      expect(transformed).toBeDefined();
      expect(transformed.code).not.toContain("require('fs').promises;");
      expect(transformed.code).toContain(
        "const fs = typeof window === 'undefined' ? require('fs').promises : null;",
      );
    }
  });
});

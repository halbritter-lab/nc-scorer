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
  const context = {
    module: { exports: {} },
    URLSearchParams,
    require(name) {
      if (name === 'axios')
        return {
          async get(url) {
            requests.push(url);
            return { status: 200, data: { url } };
          },
          async post(url) {
            requests.push(url);
            return { status: 200, data: { url } };
          },
        };
      if (name === 'debug') return () => () => {};
      if (name === './cache') return { getCache() {}, setCache() {} };
      if (name === '../config/apiConfig.json')
        return require('variant-linker/config/apiConfig.json');
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
      external: ['axios', 'debug', './cache', '../config/apiConfig.json'],
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
});

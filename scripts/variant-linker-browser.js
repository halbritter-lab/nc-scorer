import { readFile } from 'node:fs/promises';

const apiHelperPattern = /[\\/]variant-linker[\\/]src[\\/]apiHelper\.js$/;

// variant-linker 3.x exposes options per request, but its HTTP helper otherwise
// chooses one process-wide assembly URL. Keep the browser adaptation here until
// the upstream API supports a request-scoped base URL directly.
export function transformVariantLinkerApi(code) {
  const queryAnchor =
    'const params = new URLSearchParams(queryOptions).toString();';
  const baseAnchor =
    'process.env.ENSEMBL_BASE_URL || apiConfig.ensembl.baseUrl';
  if (!code.includes(queryAnchor) || !code.includes(baseAnchor)) {
    throw new Error(
      'variant-linker HTTP helper changed; review the browser assembly adapter.',
    );
  }
  return code
    .replace(
      queryAnchor,
      [
        'const { __ncEnsemblBaseUrl, ...requestQueryOptions } = queryOptions;',
        'const params = new URLSearchParams(requestQueryOptions).toString();',
      ].join('\n    '),
    )
    .replace(baseAnchor, '__ncEnsemblBaseUrl || apiConfig.ensembl.baseUrl');
}

export function variantLinkerBrowserPlugin() {
  return {
    name: 'variant-linker-browser-assembly',
    enforce: 'pre',
    transform(code, id) {
      if (apiHelperPattern.test(id.split('?')[0])) {
        return { code: transformVariantLinkerApi(code), map: null };
      }
    },
  };
}

// Vite's development dependency optimizer runs before ordinary Vite transforms.
// Apply the same adapter there so development and production use the same URLs.
export function variantLinkerBrowserOptimizer() {
  return {
    name: 'variant-linker-browser-assembly',
    setup(build) {
      build.onLoad({ filter: apiHelperPattern }, async ({ path }) => ({
        contents: transformVariantLinkerApi(await readFile(path, 'utf8')),
        loader: 'js',
      }));
    },
  };
}

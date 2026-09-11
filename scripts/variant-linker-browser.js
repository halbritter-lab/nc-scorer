import { readFile } from 'node:fs/promises';

const apiHelperPattern = /[\\/]variant-linker[\\/]src[\\/]apiHelper\.js$/;
const fsHelperPattern =
  /[\\/]variant-linker[\\/]src[\\/](pedReader|featureParser)\.js$/;

// variant-linker 4.x supports requestOptions.baseUrl and requestOptions.assembly directly.
// The browser adapter ensures that:
// 1. Any legacy __ncEnsemblBaseUrl query option is routed to requestOptions.baseUrl.
// 2. Relative development proxy URLs (e.g. /ensembl or /ensembl_grch37) are resolved
//    safely against window.location.origin (or fallback http://localhost) when constructing new URL.
// 3. When baseUrl is relative, the relative path and search are dispatched to Axios, preserving Vite dev proxy routing.
export function transformVariantLinkerApi(code) {
  const contextAnchor =
    'const context = resolveRequestOptions(requestOptions);';
  const urlAnchor =
    "const url = new URL(`${context.baseUrl.replace(/\\/$/, '')}/${endpointPath.replace(/^\\//, '')}`);";
  const callAnchor =
    "verb === 'POST' ? axios.post(url.href, body, config) : axios.get(url.href, config)";

  if (
    !code.includes(contextAnchor) ||
    !code.includes(urlAnchor) ||
    !code.includes(callAnchor)
  ) {
    throw new Error(
      'variant-linker HTTP helper changed; review the browser assembly adapter.',
    );
  }

  const targetExpr =
    "(context.baseUrl.startsWith('http://') || context.baseUrl.startsWith('https://') ? url.href : `${url.pathname}${url.search}`)";

  return code
    .replace(
      contextAnchor,
      [
        'const effectiveBaseUrl = queryOptions?.__ncEnsemblBaseUrl || requestOptions?.baseUrl;',
        'if (queryOptions?.__ncEnsemblBaseUrl) {',
        '  const { __ncEnsemblBaseUrl, ...cleanedQueryOptions } = queryOptions;',
        '  queryOptions = cleanedQueryOptions;',
        '}',
        'if (effectiveBaseUrl) {',
        '  requestOptions = { ...requestOptions, baseUrl: effectiveBaseUrl };',
        '}',
        'const context = resolveRequestOptions(requestOptions);',
      ].join('\n  '),
    )
    .replace(
      urlAnchor,
      [
        "const baseOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost';",
        "const url = new URL(`${context.baseUrl.replace(/\\/$/, '')}/${endpointPath.replace(/^\\//, '')}`, baseOrigin);",
      ].join('\n    '),
    )
    .replace(
      callAnchor,
      `verb === 'POST' ? axios.post(${targetExpr}, body, config) : axios.get(${targetExpr}, config)`,
    );
}

// Guard eager require('fs').promises in unused Node-only helpers to prevent Vite externalization warnings in browser
export function transformVariantLinkerFs(code) {
  const fsAnchor = "const fs = require('fs').promises;";
  if (!code.includes(fsAnchor)) {
    throw new Error(
      'variant-linker filesystem helper changed; review the browser fs adapter.',
    );
  }
  return code.replace(
    fsAnchor,
    "const fs = typeof window === 'undefined' ? require('fs').promises : null;",
  );
}

export function variantLinkerBrowserPlugin() {
  return {
    name: 'variant-linker-browser-assembly',
    enforce: 'pre',
    transform(code, id) {
      const cleanId = id.split('?')[0];
      if (apiHelperPattern.test(cleanId)) {
        return { code: transformVariantLinkerApi(code), map: null };
      }
      if (fsHelperPattern.test(cleanId)) {
        return { code: transformVariantLinkerFs(code), map: null };
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
      build.onLoad({ filter: fsHelperPattern }, async ({ path }) => ({
        contents: transformVariantLinkerFs(await readFile(path, 'utf8')),
        loader: 'js',
      }));
    },
  };
}

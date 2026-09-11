import path from 'node:path';

// Vite's SPA fallback cannot render Markdown. Route documentation requests to
// VitePress middleware, sharing the existing HTTP server and its lifecycle.
export function docsDevServer() {
  return {
    name: 'nc-scorer-docs-dev-server',
    apply: 'serve',
    configureServer(server) {
      let docsServer;
      let starting;
      server.httpServer?.once('close', () => {
        starting?.then(() => docsServer?.close()).catch(() => {});
      });
      server.middlewares.use(async (req, res, next) => {
        if (!/^\/docs(?:\/|\?|$)/.test(req.url || '')) return next();
        try {
          starting ||= import('vitepress')
            .then(({ createServer }) =>
              createServer(path.join(server.config.root, 'docs'), {
                middlewareMode: true,
                hmr: { server: server.httpServer, path: '/docs/__hmr' },
                watch: {
                  ignored: ['**/.vitepress/dist/**', '**/.vitepress/cache/**'],
                },
              }),
            )
            .then((instance) => {
              docsServer = instance;
            });
          await starting;
          docsServer.middlewares(req, res, next);
        } catch (error) {
          starting = null;
          server.config.logger.error(`Documentation server: ${error.message}`);
          res.statusCode = 500;
          res.end(
            'Documentation could not start. See the development server log.',
          );
        }
      });
    },
  };
}

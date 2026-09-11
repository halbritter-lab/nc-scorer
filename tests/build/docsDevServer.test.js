import { EventEmitter } from 'node:events';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { docsDevServer } from '../../scripts/docs-dev-server.js';

const { createServer } = vi.hoisted(() => ({ createServer: vi.fn() }));
vi.mock('vitepress', () => ({ createServer }));

function mountMiddleware({ httpServer = new EventEmitter() } = {}) {
  let middleware;
  const errors = [];
  const server = {
    config: {
      root: path.resolve('test-project'),
      logger: { error: (message) => errors.push(message) },
    },
    httpServer,
    middlewares: {
      use: (handler) => {
        middleware = handler;
      },
    },
  };
  docsDevServer().configureServer(server);
  return {
    server,
    errors,
    async request(url) {
      let forwarded = false;
      const response = {
        statusCode: 200,
        body: '',
        end(body) {
          this.body = body;
        },
      };
      await middleware({ url }, response, () => {
        forwarded = true;
      });
      return { ...response, forwarded };
    },
  };
}

function docsInstance() {
  const instance = {
    closes: 0,
    middlewares(req, res) {
      res.end(`Documentation: ${req.url}`);
    },
    async close() {
      instance.closes += 1;
    },
  };
  return instance;
}

beforeEach(() => createServer.mockReset());

describe('documentation development middleware', () => {
  it('leaves app and similarly named routes to Vite without starting VitePress', async () => {
    const app = mountMiddleware();
    for (const url of [
      '/',
      '/scoring/1-100-A-G',
      '/docs-other',
      '/documentation',
      undefined,
    ]) {
      expect(await app.request(url)).toMatchObject({
        forwarded: true,
        body: '',
      });
    }
    expect(createServer).not.toHaveBeenCalled();
  });

  it.each([
    '/docs',
    '/docs/',
    '/docs?search=variant',
    '/docs/guide/usage',
    '/docs/@vite/client',
  ])('serves %s through the documentation server', async (url) => {
    createServer.mockResolvedValue(docsInstance());
    const app = mountMiddleware();
    expect(await app.request(url)).toMatchObject({
      forwarded: false,
      body: `Documentation: ${url}`,
    });
    expect(createServer).toHaveBeenCalledWith(
      path.join(app.server.config.root, 'docs'),
      {
        middlewareMode: true,
        hmr: { server: app.server.httpServer, path: '/docs/__hmr' },
        watch: { ignored: ['**/.vitepress/dist/**', '**/.vitepress/cache/**'] },
      },
    );
  });

  it('coalesces overlapping startup requests and reuses the running instance', async () => {
    let finishStartup;
    createServer.mockReturnValue(
      new Promise((resolve) => {
        finishStartup = resolve;
      }),
    );
    const app = mountMiddleware();
    const first = app.request('/docs/');
    const second = app.request('/docs/guide/usage');
    await vi.waitFor(() => expect(createServer).toHaveBeenCalledTimes(1));
    finishStartup(docsInstance());
    expect(await first).toMatchObject({ body: 'Documentation: /docs/' });
    expect(await second).toMatchObject({
      body: 'Documentation: /docs/guide/usage',
    });
    expect(await app.request('/docs/api/')).toMatchObject({
      body: 'Documentation: /docs/api/',
    });
    expect(createServer).toHaveBeenCalledTimes(1);
  });

  it('reports startup failures and permits the next documentation request to retry', async () => {
    createServer
      .mockRejectedValueOnce(new Error('Port unavailable'))
      .mockResolvedValueOnce(docsInstance());
    const app = mountMiddleware();
    expect(await app.request('/docs/')).toMatchObject({
      statusCode: 500,
      forwarded: false,
    });
    expect(app.errors).toEqual(['Documentation server: Port unavailable']);
    expect(await app.request('/docs/')).toMatchObject({
      statusCode: 200,
      body: 'Documentation: /docs/',
    });
    expect(createServer).toHaveBeenCalledTimes(2);
  });

  it('closes the documentation server when the owning HTTP server closes', async () => {
    const docs = docsInstance();
    createServer.mockResolvedValue(docs);
    const app = mountMiddleware();
    await app.request('/docs/');
    app.server.httpServer.emit('close');
    await vi.waitFor(() => expect(docs.closes).toBe(1));
  });

  it('closes an instance that finishes starting after the HTTP server closes', async () => {
    let finishStartup;
    const docs = docsInstance();
    createServer.mockReturnValue(
      new Promise((resolve) => {
        finishStartup = resolve;
      }),
    );
    const app = mountMiddleware();
    const request = app.request('/docs/');
    await vi.waitFor(() => expect(createServer).toHaveBeenCalledTimes(1));
    app.server.httpServer.emit('close');
    finishStartup(docs);
    await request;
    await vi.waitFor(() => expect(docs.closes).toBe(1));
  });

  it('does not start documentation during shutdown if it was never requested', () => {
    const app = mountMiddleware();
    app.server.httpServer.emit('close');
    expect(createServer).not.toHaveBeenCalled();
  });

  it('can be mounted when Vite has no HTTP server', async () => {
    createServer.mockResolvedValue(docsInstance());
    const app = mountMiddleware({ httpServer: null });
    expect(await app.request('/docs/')).toMatchObject({
      body: 'Documentation: /docs/',
    });
  });
});

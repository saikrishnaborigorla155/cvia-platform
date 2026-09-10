import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin, type ViteDevServer } from 'vite'

function cviaApiPlugin(): Plugin {
  const attachMiddleware = (server: ViteDevServer) => {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (!req.url?.startsWith('/api/')) return next();

      // Enhance res with status() and json() for serverless handler compatibility
      res.status = function (statusCode: number) {
        res.statusCode = statusCode;
        return res;
      };
      res.json = function (payload: any) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(payload));
      };

      // Parse request body for POST/PUT requests
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const buffers: any[] = [];
        for await (const chunk of req) {
          buffers.push(chunk);
        }
        const raw = Buffer.concat(buffers).toString('utf-8');
        try {
          req.body = raw ? JSON.parse(raw) : {};
        } catch {
          req.body = raw;
        }
      }

      const urlPath = req.url.split('?')[0];
      try {
        if (urlPath === '/api/auth') {
          const mod = await server.ssrLoadModule('/api/auth.ts');
          return await mod.default(req, res);
        }
        if (urlPath === '/api/verifications') {
          const mod = await server.ssrLoadModule('/api/verifications.ts');
          return await mod.default(req, res);
        }
        if (urlPath === '/api/assets') {
          const mod = await server.ssrLoadModule('/api/assets.ts');
          return await mod.default(req, res);
        }
        if (urlPath === '/api/audit') {
          const mod = await server.ssrLoadModule('/api/audit.ts');
          return await mod.default(req, res);
        }
      } catch (err) {
        console.error('[CVIA Dev API Error]', err);
        return res.status(500).json({ success: false, error: String(err) });
      }

      return next();
    });
  };

  return {
    name: 'cvia-api-dev-server',
    configureServer(server) {
      attachMiddleware(server);
    },
    configurePreviewServer(server) {
      attachMiddleware(server as unknown as ViteDevServer);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cviaApiPlugin()],
})

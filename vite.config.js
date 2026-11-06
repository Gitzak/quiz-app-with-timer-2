import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
function quizApi() {
  const configure = (server) => {
    let runtime;
    server.middlewares.use(async (req, res, next) => {
      if (!/^\/api(?:\/|\?|$)/.test(req.url || '')) return next();
      try {
        runtime ??= import('./server/runtime.js').then(({ createRuntime }) => createRuntime());
        const { app } = await runtime;
        app(req, res);
      } catch {
        runtime = undefined;
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify({ error: 'Connexion Firebase indisponible. Vérifiez la configuration du serveur.' }));
      }
    });
  };
  return { name: 'quiz-api-local', configureServer: configure, configurePreviewServer: configure };
}
export default defineConfig({
  plugins: [react(), quizApi()],
  server: { host: '127.0.0.1' },
  build: { sourcemap: false },
});

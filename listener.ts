import { Application, Endpoint, Handler } from "./app/Application.ts";

const app = new Application();

// Logger
app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.headers.get("X-Response-Time");
  console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});

// Timing
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});

const endpoint = new Endpoint();
// Hello World!
app.registerEndpoint('/api', endpoint)

endpoint.registerMessageHandler(Handler.map(input => input))

await app.listen({ port: 8000 });
import { buildApp } from "./app.js";

async function main(): Promise<void> {
  const app = await buildApp();
  const port = parseInt(app.config.PORT, 10) || 3000;
  const host = app.config.HOST;

  try {
    await app.listen({ port, host });
  } catch (err) {
    app.log.fatal(err);
    process.exit(1);
  }
}

main();

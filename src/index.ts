import app from "./app.js";

const port = parseInt(app.config.PORT, 10) || 3000;
const host = app.config.HOST;

app
  .listen({ port, host })
  .then(() => {
    app.log.info({ port, host }, "Server listening");
  })
  .catch((err: unknown) => {
    app.log.fatal(err);
    process.exit(1);
  });

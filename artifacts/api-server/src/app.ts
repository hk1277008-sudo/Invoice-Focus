import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const defaultCorsOrigins = [
  "https://invoicefocus.com",
  "https://www.invoicefocus.com",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173",
];
const configuredCorsOrigins = process.env.CORS_ORIGINS
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOrigins = new Set(
  configuredCorsOrigins?.length ? configuredCorsOrigins : defaultCorsOrigins,
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      // Non-browser clients and hosting-provider health checks do not send an
      // Origin header and should remain usable.
      if (!origin || corsOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      // Returning false omits CORS headers without turning an otherwise valid
      // request into an application error. Browsers will block the response.
      callback(null, false);
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;

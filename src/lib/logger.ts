/**
 * Application logger module.
 *
 * Provides a pre-configured `loglevel` instance with environment-aware defaults.
 *
 * **Log levels** (from most to least verbose): trace, debug, info, warn, error, silent.
 *
 * **Environment behavior:**
 * - **Server-side:** reads `process.env.LOG_LEVEL`. Falls back to `debug` in development, `info` in production.
 * - **Client-side:** reads `process.env.NEXT_PUBLIC_LOG_LEVEL`. Same fallback logic.
 *
 * Override at runtime by setting the corresponding environment variable to any valid loglevel name.
 */
import log from "loglevel";

const isServer = globalThis.window === undefined;
const isDev = process.env.NODE_ENV !== "production";
const defaultLevel = isDev ? "debug" : "info";

const envLevel = isServer
  ? process.env.LOG_LEVEL
  : process.env.NEXT_PUBLIC_LOG_LEVEL;

log.setLevel((envLevel as log.LogLevelDesc) || defaultLevel);

export default log;

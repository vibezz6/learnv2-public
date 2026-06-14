/** Local dev URLs — keep in sync with vite.config.ts and tradingv1/web/vite.config.ts */
export const LEARN_DEV_HOST = "127.0.0.1";
export const LEARN_DEV_PORT = 8080;
export const LEARN_DEV_ORIGIN = `http://${LEARN_DEV_HOST}:${LEARN_DEV_PORT}`;

export const TRADING_API_PORT = 8000;
export const TRADING_API_ORIGIN = `http://${LEARN_DEV_HOST}:${TRADING_API_PORT}`;

export const TRADING_JOURNAL_PORT = 8081;
export const TRADING_JOURNAL_ORIGIN = `http://${LEARN_DEV_HOST}:${TRADING_JOURNAL_PORT}`;

export const LEARN_TRADING_LAB_PATH = "/lab/trading";
export const LEARN_TRADING_LAB_URL = `${LEARN_DEV_ORIGIN}${LEARN_TRADING_LAB_PATH}`;

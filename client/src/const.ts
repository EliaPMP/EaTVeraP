export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Where to send unauthenticated users. Auth is handled in-app by the
// email/password form on the sign-in page (no external OAuth portal).
export const getLoginUrl = () => "/signin";

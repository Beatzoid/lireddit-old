export const __PROD__ = process.env.NODE_ENV === "production";
export const COOKIE_NAME = "qid";
export const EMAIL_REGEX = new RegExp(
    " [^@ \t\r\n]+@[^@ \t\r\n]+.[^@ \t\r\n]+"
);
export const FORGOT_PASSWORD_PREFIX = "forgot-password:";

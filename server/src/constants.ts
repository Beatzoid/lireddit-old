export const __PROD__ = process.env.NODE_ENV === "production";
export const COOKIE_NAME = "qid";
export const EMAIL_REGEX = new RegExp(
    // eslint-disable-next-line max-len
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
);
export const FORGOT_PASSWORD_PREFIX = "forgot-password:";

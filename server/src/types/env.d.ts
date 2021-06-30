declare namespace NodeJS {
    interface ProcessEnv {
        EMAIL_ADDRESS: string;
        EMAIL_PASSWORD: string;
        COOKIE_SECRET: string;
        DATABASE_URL: string;
        REDIS_URL: string;
        PORT: string;
        CORS_ORIGIN: string;
    }
}

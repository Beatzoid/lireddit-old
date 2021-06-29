import { Request, Response } from "express";
import { SessionData, Session } from "express-session";
import { Redis } from "ioredis";
import { createUpdootLoader } from "./utils/loaders/createUpdootLoader";
import { createUserLoader } from "./utils/loaders/createUserLoader";

export type MyContext = {
    req: Request & {
        session: Session & Partial<SessionData> & { userId?: number };
    };
    res: Response;
    redis: Redis;
    userLoader: ReturnType<typeof createUserLoader>;
    updootLoader: ReturnType<typeof createUpdootLoader>;
};

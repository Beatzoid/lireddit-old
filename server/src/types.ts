import { Request, Response } from "express";
import { Session } from "express-session";
import { Redis } from "ioredis";

export interface MySession extends Session {
    userId: number;
}

export type MyContext = {
    req: Request & { session: MySession };
    redis: Redis;
    res: Response;
};

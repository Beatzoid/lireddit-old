import { EntityManager } from "@mikro-orm/core";
import { Request, Response } from "express";
import { Session } from "express-session";

export interface MySession extends Session {
    userId: number;
}

export type MyContext = {
    em: EntityManager<any> & EntityManager;
    req: Request & { session: MySession };
    res: Response;
};

require("dotenv").config();
import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";

import { COOKIE_NAME, __PROD__ } from "./constants";
import microConfig from "./mikro-orm.config";

// Resolvers
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

const main = async () => {
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up();

    const app = express();

    const RedisStore = connectRedis(session);
    const redis = new Redis();

    app.use(cors({ origin: "http://localhost:3000", credentials: true }));

    app.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({
                client: redis,
                disableTouch: true // Reduces pings to redis
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
                httpOnly: true, // Cannot access cookie in the JS frontend
                sameSite: "lax", // CSRF
                secure: __PROD__ // Cookie only works in https
            },
            saveUninitialized: false,
            secret: process.env.COOKIE_SECRET as string,
            resave: false
        })
    );

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        context: ({ req, res }) => ({ em: orm.em, req, res, redis })
    });

    apolloServer.applyMiddleware({
        app,
        cors: false
    });

    app.listen(4000, () =>
        console.log("Server listening on http://localhost:4000")
    );
};

main().catch((err) => console.error(err));

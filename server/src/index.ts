import "dotenv/config";

import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";
import { createConnection } from "typeorm";
import path from "path";

import { COOKIE_NAME, __PROD__ } from "./constants";

// Resolvers
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

// Entites
import { User } from "./entities/User";
import { Post } from "./entities/Post";
import { Updoot } from "./entities/Updoot";

import { createUserLoader } from "./utils/loaders/createUserLoader";
import { createUpdootLoader } from "./utils/loaders/createUpdootLoader";

const main = async () => {
    const conn = await createConnection({
        type: "postgres",
        database: "lireddit2",
        username: "beatzoid",
        password: "beatzoid",
        logging: !__PROD__,
        synchronize: true,
        migrations: [path.join(__dirname, "./migrations/*")],
        entities: [Post, User, Updoot]
    });
    await conn.runMigrations();

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
        context: ({ req, res }) => ({
            req,
            res,
            redis,
            userLoader: createUserLoader(),
            updootLoader: createUpdootLoader()
        })
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

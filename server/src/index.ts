import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./utils/constants";
import microConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import { MyContext } from "./utils/types";
import cors from "cors";

const main = async () => {
    const orm = await MikroORM.init(microConfig);
    orm.getMigrator().up();

    const RedisStore = connectRedis(session);
    const redisClient = redis.createClient();

    // Express Server
    const app = express();
    app.use(
        cors({
            origin: "http://localhost:3000",
            credentials: true
        })
    );

    app.use(
        session({
            name: "qid",
            store: new RedisStore({
                client: redisClient,
                disableTouch: true
            }),
            saveUninitialized: false,
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 Years
                httpOnly: true,
                sameSite: "lax",
                secure: __prod__ // cookie only works in https
            },
            secret:
                "ReDiSSeCrEt%@$!#@^#$%^*(#&)(*@!^)&(@^^%I@@@@#^&O#)(&#(!#&%^$@*#&!@*(&#@I&ORTGO#U$IULKRGFB(NP$*CLU#KTBF&OIU$CTOG#*F",
            resave: false
        })
    );

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        context: ({ req, res }): MyContext => ({ em: orm.em, req, res })
    });

    apolloServer.applyMiddleware({
        app,
        cors: false
    });

    app.listen(process.env.PORT || 4000, () => {
        console.log(
            `Server started on https://localhost:${process.env.PORT || 4000}`
        );
    });
};

main().catch((err) => console.error(err));

import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";

import { __PROD__ } from "./constants";
import microConfig from "./mikro-orm.config";

// Resolvers
import { HelloResolver } from "./resolvers/Hello";
import { PostResolver } from "./resolvers/Post";

const main = async () => {
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up();

    const app = express();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver],
            validate: false
        }),
        context: () => ({ em: orm.em })
    });

    apolloServer.applyMiddleware({ app });

    app.listen(4000, () =>
        console.log("Server listening on http://localhost:4000")
    );
};

main().catch((err) => console.error(err));

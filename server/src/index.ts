import { MikroORM } from "@mikro-orm/core";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";

import { __PROD__ } from "./constants";
import microConfig from "./mikro-orm.config";

// Resolvers
import { HelloResolver } from "./resolvers/Hello";

const main = async () => {
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up();

    const app = express();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver],
            validate: false
        })
    });

    apolloServer.applyMiddleware({ app });

    app.listen(4000, () =>
        console.log("Server listening on http://localhost:4000")
    );
};

main().catch((err) => console.error(err));

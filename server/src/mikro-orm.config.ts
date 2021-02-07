import { Post } from "./entities/Post";
import { __prod__ } from "./utils/constants";
import { MikroORM } from "@mikro-orm/core";
import path from "path";
import { User } from "./entities/User";

export default {
    migrations: {
        path: path.join(__dirname, "./migrations"),
        pattern: /^[\w-]+\d+\.[tj]s$/
    },
    entities: [Post, User],
    dbName: "lireddit",
    type: "postgresql",
    // You will need to change these details
    // They will not work for you as
    // This database is hosted locally
    user: "beatzoid",
    password: "Beatzoid!@#",
    debug: !__prod__
} as Parameters<typeof MikroORM.init>[0];

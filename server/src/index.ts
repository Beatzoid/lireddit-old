import { MikroORM } from "@mikro-orm/core";
import { __PROD__ } from "./constants";
import microConfig from "./mikro-orm.config";

const main = async () => {
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up();

    // const post = orm.em.create(Post, { title: "My first post" });
    // await orm.em.persistAndFlush(post);
};

main().catch((err) => console.error(err));

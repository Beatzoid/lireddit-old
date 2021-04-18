import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import {
    Arg,
    Ctx,
    Field,
    FieldResolver,
    InputType,
    Int,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    Root,
    UseMiddleware
} from "type-graphql";

import { Post } from "../entities/Post";
import { getConnection } from "typeorm";
import { Updoot } from "../entities/Updoot";

@InputType()
class PostInput {
    @Field()
    title: string;

    @Field()
    text: string;
}

@ObjectType()
class PaginatedPosts {
    @Field(() => [Post])
    posts: Post[];

    @Field()
    hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
    @FieldResolver(() => String)
    textSnippet(@Root() root: Post) {
        if (root.text.length <= 50) return root.text;
        // Slice the text to 50 characters
        root.text = root.text.substring(0, 50);
        // Slice the text at the last occurrence of a space
        // This prevents slicing words in half
        // Then add a "..." at the end
        return root.text.substring(0, root.text.lastIndexOf(" ")) + "...";
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async vote(
        @Arg("postId", () => Int) postId: number,
        @Arg("value", () => Int) value: number,
        @Ctx() { req }: MyContext
    ) {
        const isUpdoot = value !== -1;
        const realValue = isUpdoot ? 1 : -1;
        const { userId } = req.session;

        // await Updoot.insert({
        //     userId,
        //     postId,
        //     value: realValue
        // });
        await getConnection().query(
            `
            start transaction;
            insert into updoot ("userId", "postId", value)
            values (${userId}, ${postId}, ${realValue});
            update post
            set points = points + ${realValue}
            where id = ${postId};
            commit;
        `
        );
        return true;
    }

    @Query(() => PaginatedPosts)
    async posts(
        @Arg("limit", () => Int) limit: number,
        @Arg("cursor", () => String, { nullable: true }) cursor: string | null
    ): Promise<PaginatedPosts> {
        const realLimit = Math.min(50, limit);
        const replacements: any[] = [realLimit + 1];

        if (cursor) {
            replacements.push(new Date(parseInt(cursor)));
        }

        const posts = await getConnection().query(
            ` 
            select p.*,
            json_build_object(
                'id', u.id,
                'username', u.username,
                'email', u.email
                ) creator 
            from post p
            inner join public.user u on u.id = p."creatorId"
            ${cursor ? `where p."createdAt" < $2` : ""}
            order by p."createdAt" DESC
            limit $1
        `,
            replacements
        );

        return {
            posts: posts.slice(0, realLimit),
            hasMore: posts.length === realLimit + 1
        };
    }

    @Query(() => Post, { nullable: true })
    post(@Arg("id") id: number): Promise<Post | undefined> {
        return Post.findOne(id);
    }

    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async createPost(
        @Arg("options") options: PostInput,
        @Ctx() { req }: MyContext
    ): Promise<Post> {
        return Post.create({
            ...options,
            creatorId: req.session.userId
        }).save();
    }

    @Mutation(() => Post, { nullable: true })
    async updatePost(
        @Arg("id") id: number,
        @Arg("title", () => String, { nullable: true }) title: string
    ): Promise<Post | null> {
        const post = await Post.findOne(id);
        if (!post) return null;

        if (typeof title !== "undefined") {
            await Post.update({ id }, { title });
        }

        return post;
    }

    @Mutation(() => Boolean)
    async deletePost(@Arg("id") id: number): Promise<boolean> {
        await Post.delete(id);
        return true;
    }
}

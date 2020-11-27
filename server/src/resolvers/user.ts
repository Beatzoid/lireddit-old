import {
    Arg,
    Ctx,
    Field,
    InputType,
    Mutation,
    ObjectType,
    Query,
    Resolver
} from "type-graphql";
import { MyContext } from "../types";
import { User } from "../entities/User";
import argon2 from "argon2";
import { EntityManager } from "@mikro-orm/postgresql";

@InputType()
class UsernamePasswordInput {
    @Field()
    username: string;

    @Field()
    password: string;
}

@ObjectType()
class FieldError {
    @Field()
    field: string;

    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => User, { nullable: true })
    user?: User;
}

@Resolver()
export class UserResolver {
    @Query(() => User, { nullable: true })
    async me(@Ctx() { req, em }: MyContext) {
        // You're not logged in
        if (!req.session.userId) {
            return null;
        }

        // noinspection UnnecessaryLocalVariableJS
        const user = await em.findOne(User, { id: req.session.userId });
        return user;
    }

    @Mutation(() => UserResponse)
    async register(
        // () => UsernamePasswordInput
        @Arg("options") options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        if (options.username.length <= 2) {
            return {
                errors: [
                    {
                        field: "username",
                        message:
                            "Username length must greater than 2 characters"
                    }
                ]
            };
        }

        if (options.password.length <= 3) {
            return {
                errors: [
                    {
                        field: "password",
                        message:
                            "Password length must greater than 3 characters"
                    }
                ]
            };
        }

        const hashedPassword = await argon2.hash(options.password);
        let user;

        try {
            const result = await (em as EntityManager)
                .createQueryBuilder(User)
                .getKnexQuery()
                .insert({
                    username: options.username.toLowerCase(),
                    password: hashedPassword,
                    created_at: new Date(),
                    updated_at: new Date()
                })
                .returning("*");
            user = result[0];
        } catch (err) {
            // Duplicate username error
            // || err.detail.includes("already exists")
            // The reason I have the err.detail.includes is so that if the error code changes I don't have to change it here
            // It will just work automagically
            if (err.code === "23505") {
                return {
                    errors: [
                        {
                            field: "username",
                            message: "Username already exists"
                        }
                    ]
                };
            }
        }

        // Prevents errors, don't remove
        user = {
            ...user,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        };
        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("options") options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, {
            username: options.username.toLowerCase()
        });

        if (!user) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "The specified username does not exist."
                    }
                ]
            };
        }

        const valid = await argon2.verify(user.password, options.password);

        if (!valid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "The specified password is incorrect"
                    }
                ]
            };
        }

        req.session.userId = user.id;

        return { user };
    }
}

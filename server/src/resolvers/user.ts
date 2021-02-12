import { User } from "../entities/User";
import { MyContext } from "../utils/types";
import {
    Resolver,
    Mutation,
    Arg,
    InputType,
    Field,
    Ctx,
    ObjectType,
    Query
} from "type-graphql";
import argon2 from "argon2";

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
        // Not logged in
        if (!req.session.userId) {
            return null;
        }

        const user = await em.findOne(User, { id: req.session.userId });
        return user;
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg("options") options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        if (options.username.length <= 2) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "Length must be greater than 2 characters"
                    }
                ]
            };
        }

        if (options.password.length <= 4) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "Length must be greater than 4 characters"
                    }
                ]
            };
        }

        const hashedPassword = await argon2.hash(options.password, {
            hashLength: 1000,
            timeCost: 100
        });
        const user = em.create(User, {
            username: options.username,
            password: hashedPassword
        });

        try {
            await em.persistAndFlush(user);
        } catch (err) {
            if (
                err.code === "23505" ||
                err.details.includes("already exists")
            ) {
                // Duplicate Username
                return {
                    errors: [
                        {
                            field: "username",
                            message: "Username already taken"
                        }
                    ]
                };
            }
        }

        // Login user after register
        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("options") options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, { username: options.username });
        if (!user) {
            return {
                errors: [
                    { field: "username", message: "Username doesn't exist" }
                ]
            };
        }

        const valid = await argon2.verify(user.password, options.password);

        if (!valid) {
            return {
                errors: [{ field: "password", message: "Incorrect password" }]
            };
        }

        req.session.userId = user.id;

        return {
            user
        };
    }
}
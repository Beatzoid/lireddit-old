import {
    Arg,
    Ctx,
    Field,
    Mutation,
    ObjectType,
    Query,
    Resolver
} from "type-graphql";
import argon2 from "argon2";
import { v4 } from "uuid";

import { User } from "../entities/User";
import { MyContext } from "../types";
import { EntityManager } from "@mikro-orm/postgresql";
import { COOKIE_NAME, EMAIL_REGEX, FORGOT_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "../utils/UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";

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
    @Mutation(() => UserResponse)
    async changePassword(
        @Arg("token") token: string,
        @Arg("newPassword") newPassword: string,
        @Ctx() { em, redis, req }: MyContext
    ): Promise<UserResponse> {
        if (newPassword.length <= 2) {
            return {
                errors: [
                    {
                        field: "newPassword",
                        message: "Password length must be greater than 2"
                    }
                ]
            };
        }

        const key = FORGOT_PASSWORD_PREFIX + token;

        const userId = await redis.get(key);
        if (!userId) {
            return {
                errors: [
                    {
                        field: "token",
                        message: "Invalid token"
                    }
                ]
            };
        }

        const user = await em.findOne(User, { id: parseInt(userId) });
        if (!user) {
            return {
                errors: [
                    {
                        field: "token",
                        message: "User no longer exists"
                    }
                ]
            };
        }

        user.password = await argon2.hash(newPassword, {
            hashLength: 128
        });
        await em.persistAndFlush(user);

        redis.del(key);

        // Login user after change password
        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("email") email: string,
        @Ctx() { em, redis }: MyContext
    ) {
        const user = await em.findOne(User, { email });
        if (!user) return true;

        const token = v4();

        await redis.set(
            FORGOT_PASSWORD_PREFIX + token,
            user.id,
            "ex",
            1000 * 60 * 60 * 24 * 3 // 3 days
        );

        await sendEmail(
            email,
            "Reset Lireddit Account Password",
            `<a href="http://localhost:3000/change-password/${token}">Reset Password</a>`
        );
        return true;
    }

    @Query(() => User, { nullable: true })
    async me(@Ctx() { req, em }: MyContext) {
        // Not logged in
        if (!req.session.userId) return null;

        const user = await em.findOne(User, { id: req.session.userId });
        return user;
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg("options") options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister(options);
        if (errors) return { errors };

        const hashedPassword = await argon2.hash(options.password, {
            hashLength: 128
        });
        let user;

        try {
            const result = await (em as EntityManager)
                .createQueryBuilder(User)
                .getKnexQuery()
                .insert({
                    username: options.username,
                    password: hashedPassword,
                    email: options.email,
                    created_at: new Date(),
                    updated_at: new Date()
                })
                .returning("*");
            user = result[0];
        } catch (err) {
            if (err.code === "23505") {
                if (err.detail.includes("email")) {
                    return {
                        errors: [
                            {
                                field: "email",
                                message: "Email already in use"
                            }
                        ]
                    };
                }
                return {
                    errors: [
                        { field: "username", message: "Username already taken" }
                    ]
                };
            }
        }

        // Auto login user after registration
        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("usernameOrEmail") usernameOrEmail: string,
        @Arg("password") password: string,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(
            User,
            EMAIL_REGEX.test(usernameOrEmail)
                ? { email: usernameOrEmail }
                : { username: usernameOrEmail }
        );

        if (!user)
            return {
                errors: [
                    {
                        field: "usernameOrEmail",
                        message: "Username or email doesn't exist"
                    }
                ]
            };

        const valid = await argon2.verify(user.password, password);
        if (!valid)
            return {
                errors: [
                    {
                        field: "password",
                        message: "Incorrect password"
                    }
                ]
            };

        req.session.userId = user.id;

        return {
            user
        };
    }

    @Mutation(() => Boolean)
    logout(@Ctx() { req, res }: MyContext) {
        return new Promise((resolve) =>
            req.session.destroy((err) => {
                if (err) {
                    console.log(err);
                    resolve(false);
                    return;
                }

                res.clearCookie(COOKIE_NAME);
                resolve(true);
            })
        );
    }
}

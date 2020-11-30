import {
    Arg,
    Ctx,
    Field,
    FieldResolver,
    Mutation,
    ObjectType,
    Query,
    Resolver,
    Root
} from "type-graphql";
import { MyContext } from "../types";
import { User } from "../entities/User";
import argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";
import { getConnection } from "typeorm";

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

@Resolver(User)
export class UserResolver {
    @FieldResolver(() => String)
    email(@Root() user: User, @Ctx() { req }: MyContext) {
        // The current user wants to see their email
        if (req.session.userId === user.id) {
            return user.email;
        }
        // The current user wants to see someone else's email
        return "";
    }

    @Mutation(() => UserResponse)
    async changePassword(
        @Arg("token") token: string,
        @Arg("newPassword") newPassword: string,
        @Ctx() { redis, req }: MyContext
    ): Promise<UserResponse> {
        if (newPassword.length <= 3) {
            return {
                errors: [
                    {
                        field: "newPassword",
                        message:
                            "Password length must greater than 3 characters"
                    }
                ]
            };
        }

        const key = FORGET_PASSWORD_PREFIX + token;
        const userId = await redis.get(key);

        if (!userId) {
            return {
                errors: [
                    {
                        field: "token",
                        message:
                            "Token expired, click here to request a new one"
                    }
                ]
            };
        }

        const userIdNum = parseInt(userId);
        const user = await User.findOne(userIdNum);

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

        await User.update(
            { id: userIdNum },
            {
                password: await argon2.hash(newPassword)
            }
        );

        await redis.del(key);

        // Login user after they change their password
        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("email") email: string,
        @Ctx() { redis }: MyContext
    ) {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            // The email is not in the db
            return false;
        }

        const token = v4();

        await redis.set(
            FORGET_PASSWORD_PREFIX + token,
            user.id,
            "ex",
            1000 * 60 * 60 * 24 * 3 // 3 Days (If you request a password reset and then don't reset within 3 days, what is wrong with you)
        );

        await sendEmail(
            email,
            `<a href="http://localhost:3000/change-password/${token}">Reset Password</a>`
        );

        return true;
    }

    @Query(() => User, { nullable: true })
    me(@Ctx() { req }: MyContext) {
        // You're not logged in
        if (!req.session.userId) {
            return null;
        }

        return User.findOne(req.session.userId);
    }

    @Mutation(() => UserResponse)
    async register(
        // () => UsernamePasswordInput
        @Arg("options") options: UsernamePasswordInput,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister(options);
        if (errors) {
            return { errors };
        }

        const hashedPassword = await argon2.hash(options.password);
        let user;

        try {
            const result = await getConnection()
                .createQueryBuilder()
                .insert()
                .into(User)
                .values({
                    username: options.username.toLowerCase(),
                    email: options.email,
                    password: hashedPassword
                })
                .returning("*")
                .execute();
            user = result.raw[0];
        } catch (err) {
            // Duplicate username error
            // || err.detail.includes("already exists")
            // The reason I have the err.detail.includes is so that if the error code changes I don't have to change it here
            // It will just work automagically
            if (err.code === "23505") {
                return {
                    errors: [
                        {
                            field: err.detail.includes("email")
                                ? "email"
                                : "username",
                            message: err.detail.includes("email")
                                ? "Email is in use already"
                                : "Username is in use already"
                        }
                    ]
                };
            }
        }

        // Prevents errors, don't remove
        // user = {
        //     ...user,
        //     createdAt: user.created_at,
        //     updatedAt: user.updated_at
        // };
        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("usernameOrEmail") usernameOrEmail: string,
        @Arg("password") password: string,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const user = await User.findOne(
            usernameOrEmail.includes("@")
                ? {
                      where: { email: usernameOrEmail }
                  }
                : // toLowerCase() makes it so things like"Beatzoid" and "beatzoid" login to the same account
                  { where: { username: usernameOrEmail.toLowerCase() } }
        );

        if (!user) {
            return {
                errors: [
                    {
                        field: "usernameOrEmail",
                        message: "The specified username does not exist."
                    }
                ]
            };
        }

        const valid = await argon2.verify(user.password, password);

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

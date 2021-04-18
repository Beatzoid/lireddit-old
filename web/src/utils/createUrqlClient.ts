import { dedupExchange, fetchExchange, gql, stringifyVariables } from "urql";
import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
import { pipe, tap } from "wonka";
import { Exchange } from "urql";
import Router from "next/router";

import {
    LogoutMutation,
    MeQuery,
    MeDocument,
    LoginMutation,
    RegisterMutation,
    VoteMutationVariables
} from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";

const errorExchange: Exchange = ({ forward }) => (ops$) => {
    return pipe(
        forward(ops$),
        tap(({ error }) => {
            if (error) {
                if (error?.message.includes("Not authenticated")) {
                    Router.replace("/login");
                }
            }
        })
    );
};

const cursorPagination = (): Resolver => {
    return (_parent, fieldArgs, cache, info) => {
        const { parentKey: entityKey, fieldName } = info;

        const allFields = cache.inspectFields(entityKey);
        const fieldInfos = allFields.filter(
            (info) => info.fieldName === fieldName
        );

        const size = fieldInfos.length;
        if (size === 0) {
            return undefined;
        }

        const isItInTheCache = cache.resolve(
            cache.resolve(
                entityKey,
                `${fieldName}(${stringifyVariables(fieldArgs)})`
            ) as string,
            "posts"
        );
        info.partial = !isItInTheCache;
        let hasMore = true;

        const results: string[] = [];
        fieldInfos.forEach((fi) => {
            const key = cache.resolve(entityKey, fi.fieldKey) as string;
            const data = cache.resolve(key, "posts") as string[];
            const _hasMore = cache.resolve(key, "hasMore");
            if (!_hasMore) {
                hasMore = _hasMore as boolean;
            }
            results.push(...data);
        });

        return { __typename: "PaginatedPosts", hasMore, posts: results };
    };
};

export const createUrqlClient = (ssrExchange: any) => ({
    url: "http://localhost:4000/graphql",
    fetchOptions: {
        credentials: "include" as const
    },
    exchanges: [
        dedupExchange,
        cacheExchange({
            keys: {
                PaginatedPosts: () => null
            },
            resolvers: {
                Query: {
                    posts: cursorPagination()
                }
            },
            updates: {
                Mutation: {
                    vote: (_result, args, cache, __) => {
                        const { postId, value } = args as VoteMutationVariables;
                        const data = cache.readFragment(
                            gql`
                                fragment _ on Post {
                                    id
                                    points
                                    voteStatus
                                }
                            `,
                            { id: postId }
                        );

                        if (data) {
                            if (data.voteStatus === value) return;
                            const newPoints =
                                data.points +
                                (!data.voteStatus ? 1 : 2) * value;

                            cache.writeFragment(
                                gql`
                                    fragment __ on Post {
                                        points
                                        voteStatus
                                    }
                                `,
                                {
                                    id: postId,
                                    points: newPoints,
                                    voteStatus: value
                                }
                            );
                        }
                    },
                    createPost: (_result, _, cache, __) => {
                        const allFields = cache.inspectFields("Query");
                        const fieldInfos = allFields.filter(
                            (info) => info.fieldName === "posts"
                        );
                        fieldInfos.forEach((fi) => {
                            cache.invalidate(
                                "Query",
                                "posts",
                                fi.arguments || {}
                            );
                        });
                    },
                    logout: (_result, _, cache, __) => {
                        betterUpdateQuery<LogoutMutation, MeQuery>(
                            cache,
                            { query: MeDocument },
                            _result,
                            () => ({ me: null })
                        );
                    },
                    login: (_result, _, cache, __) => {
                        betterUpdateQuery<LoginMutation, MeQuery>(
                            cache,
                            { query: MeDocument },
                            _result,
                            (result, query) => {
                                if (result.login.errors) {
                                    return query;
                                } else {
                                    return {
                                        me: result.login.user
                                    };
                                }
                            }
                        );
                    },
                    register: (_result, _, cache, __) => {
                        betterUpdateQuery<RegisterMutation, MeQuery>(
                            cache,
                            { query: MeDocument },
                            _result,
                            (result, query) => {
                                if (result.register.errors) {
                                    return query;
                                } else {
                                    return {
                                        me: result.register.user
                                    };
                                }
                            }
                        );
                    }
                }
            }
        }),
        errorExchange,
        ssrExchange,
        fetchExchange
    ]
});

import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { usePostsQuery } from "../generated/graphql";
import { Layout } from "../components/Layout";
import { Box, Flex, Heading, Link, Stack, Text } from "@chakra-ui/layout";
import NextLink from "next/link";
import { Button } from "@chakra-ui/button";
import { useState } from "react";

const Index = () => {
    const [variables, setVariables] = useState({
        limit: 10,
        cursor: null as null | string
    });
    const [{ data, fetching }] = usePostsQuery({
        variables
    });

    if (!fetching && !data) {
        return (
            <div>
                Something went wrong while fetching the posts, please try again
                later. If this issue does not go away, file an issue on the
                Github{" "}
                <a href="https://github.com/Beatzoid/lireddit/issues">here</a>
            </div>
        );
    }

    return (
        <Layout>
            <Flex align="center">
                <Heading>LiReddit</Heading>
                <NextLink href="/create-post">
                    <Link ml="auto">Create Post</Link>
                </NextLink>
            </Flex>
            <br />
            {!data && fetching ? (
                <div>Loading...</div>
            ) : (
                <Stack spacing={8}>
                    {data!.posts.posts.map((p) => (
                        <Box key={p.id} p={5} shadow="md" borderWidth="1px">
                            <Heading fontSize="xl">{p.title}</Heading>
                            <Text mt={4}>{p.textSnippet}</Text>
                        </Box>
                    ))}
                </Stack>
            )}
            {data && data.posts.hasMore ? (
                <Flex>
                    <Button
                        onClick={() => {
                            setVariables({
                                limit: variables.limit,
                                cursor:
                                    data.posts.posts[
                                        data.posts.posts.length - 1
                                    ].createdAt
                            });
                        }}
                        isLoading={fetching}
                        m="auto"
                        my={8}
                    >
                        Load more
                    </Button>
                </Flex>
            ) : (
                <Flex>
                    <Button
                        onClick={() => {
                            // Just having fun ;)
                            window.open(
                                "https://www.youtube.com/watch?v=oHg5SJYRHA0",
                                "_blank"
                            );
                        }}
                        m="auto"
                        my={8}
                    >
                        Congratulations, you have read all posts available!
                    </Button>
                </Flex>
            )}
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);

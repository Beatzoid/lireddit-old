import React, { useState } from "react";
import { withUrqlClient } from "next-urql";
import {
    Link,
    Stack,
    Text,
    Heading,
    Box,
    Flex,
    Button
} from "@chakra-ui/react";
import NextLink from "next/link";

import { Layout } from "../components/Layout";
import {
    usePostsQuery
} from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { UpdootSection } from "../components/UpdootSection";
import { EditDeletePostButtons } from "../components/EditDeletePostButtons";

const Index = () => {
    const [variables, setVariables] = useState({
        limit: 15,
        cursor: null as string | null
    });

    const [{ data, fetching }] = usePostsQuery({
        variables
    });

    if (!fetching && !data) {
        return <div>Query failed, please try again later</div>;
    }

    return (
        <Layout>
            {!data && fetching ? (
                <div>Loading...</div>
            ) : (
                <Stack spacing={8}>
                    {data!.posts.posts.map((p) =>
                        !p ? null : (
                            <Flex
                                key={p.id}
                                p={5}
                                shadow="md"
                                borderWidth="1px"
                            >
                                <UpdootSection post={p} />
                                <Box flex={1}>
                                    <NextLink
                                        href="/post/[id]"
                                        as={`/post/${p.id}`}
                                    >
                                        <Link>
                                            <Heading fontSize="xl">
                                                {p.title}
                                            </Heading>
                                        </Link>
                                    </NextLink>
                                    <Text textColor="gray">
                                        Posted by {p.creator.username}
                                    </Text>
                                    <Flex>
                                        <Text flex={1} mt={4}>
                                            {p.textSnippet}
                                        </Text>
                                        <Box ml="auto">
                                            <EditDeletePostButtons
                                                id={p.id}
                                                creatorId={p.creator.id}
                                            />
                                        </Box>
                                    </Flex>
                                </Box>
                            </Flex>
                        )
                    )}
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
                        margin="auto"
                        my={8}
                    >
                        Load More
                    </Button>
                </Flex>
            ) : (
                <Flex>
                    <Text margin="auto" my={8}>
                        Congrats you reached the end of the posts
                    </Text>
                </Flex>
            )}
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);

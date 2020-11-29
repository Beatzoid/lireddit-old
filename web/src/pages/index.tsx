import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { usePostsQuery } from "../generated/graphql";
import { Layout } from "../components/Layout";
import { Box, Flex, Heading, Link, Stack, Text } from "@chakra-ui/layout";
import NextLink from "next/link";
import { Button } from "@chakra-ui/button";

const Index = () => {
    const [{ data, fetching }] = usePostsQuery({
        variables: {
            limit: 10
        }
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
                    {data!.posts.map((p) => (
                        <Box key={p.id} p={5} shadow="md" borderWidth="1px">
                            <Heading fontSize="xl">{p.title}</Heading>
                            <Text mt={4}>{p.textSnippet}</Text>
                        </Box>
                    ))}
                </Stack>
            )}
            {data ? (
                <Flex>
                    <Button isLoading={fetching} m="auto" my={8}>
                        Load more
                    </Button>
                </Flex>
            ) : null}
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);

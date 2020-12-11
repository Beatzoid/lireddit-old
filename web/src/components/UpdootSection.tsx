import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { Flex, IconButton } from "@chakra-ui/react";
import React, { useState } from "react";
import { PostSnippetFragment, useVoteMutation } from "../generated/graphql";

interface UpdootSectionProps {
    post: PostSnippetFragment;
}

export const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
    const [loadingState, setLoadingState] = useState<
        "updoot-loading" | "downdoot-loading" | "not-loading"
    >("not-loading");
    const [, vote] = useVoteMutation();

    return (
        <Flex
            direction="column"
            justifyContent="center"
            alignItems="center"
            mr={4}
        >
            <IconButton
                onClick={async () => {
                    if (post.voteStatus === 1) return;
                    setLoadingState("updoot-loading");
                    await vote({
                        postId: post.id,
                        value: 1
                    });
                    console.log(post.voteStatus);
                    setLoadingState("not-loading");
                }}
                style={
                    post.voteStatus === 1
                        ? { backgroundColor: "#E53E3E" }
                        : undefined
                }
                aria-label="Upvote post"
                isLoading={loadingState === "updoot-loading"}
                icon={<ChevronUpIcon />}
            />
            {post.points}
            <IconButton
                onClick={async () => {
                    if (post.voteStatus === -1) return;
                    setLoadingState("downdoot-loading");
                    await vote({
                        postId: post.id,
                        value: -1
                    });
                    console.log(post.voteStatus);
                    setLoadingState("not-loading");
                }}
                style={
                    post.voteStatus === -1
                        ? { backgroundColor: "#4299E1" }
                        : undefined
                }
                aria-label="Downvote post"
                isLoading={loadingState === "downdoot-loading"}
                icon={<ChevronDownIcon />}
            />
        </Flex>
    );
};

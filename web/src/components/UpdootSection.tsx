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
    >();
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
                    setLoadingState("updoot-loading");
                    await vote({
                        postId: post.id,
                        value: 1
                    });
                    setLoadingState("not-loading");
                }}
                aria-label="Upvote post"
                isLoading={loadingState === "updoot-loading"}
                icon={<ChevronUpIcon />}
            />
            {post.points}
            <IconButton
                onClick={async () => {
                    setLoadingState("downdoot-loading");
                    await vote({
                        postId: post.id,
                        value: -1
                    });
                    setLoadingState("not-loading");
                }}
                aria-label="Downvote post"
                isLoading={loadingState === "downdoot-loading"}
                icon={<ChevronDownIcon />}
            />
        </Flex>
    );
};

import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { IconButton } from "@chakra-ui/react";
import { Box } from "@chakra-ui/react";
import NextLink from "next/link";

import { useDeletePostMutation, useMeQuery } from "../generated/graphql";

interface EditDeletePostButtonsProps {
    id: number;
    creatorId: number;
}

export const EditDeletePostButtons: React.FC<EditDeletePostButtonsProps> = ({
    id,
    creatorId
}) => {
    const [{ data }] = useMeQuery();
    const [{ fetching }, deletePost] = useDeletePostMutation();

    if (data?.me?.id !== creatorId) {
        return null;
    }

    return (
        <Box mt={8}>
            <IconButton
                mr={4}
                icon={<DeleteIcon />}
                cursor="pointer"
                color="red"
                aria-label="Delete Post"
                isLoading={fetching}
                onClick={() => {
                    deletePost({
                        id: id
                    });
                }}
            />
            <NextLink href="/post/edit/[id]" as={`/post/edit/${id}`}>
                <IconButton
                    icon={<EditIcon />}
                    cursor="pointer"
                    aria-label="Edit Post"
                />
            </NextLink>
        </Box>
    );
};

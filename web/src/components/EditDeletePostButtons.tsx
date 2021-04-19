import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
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
    const [, deletePost] = useDeletePostMutation();

    if (data?.me?.id !== creatorId) {
        return null;
    }

    return (
        <Box mt={8}>
            <DeleteIcon
                mr={4}
                cursor="pointer"
                color="red"
                aria-label="Delete Post"
                onClick={() => {
                    deletePost({
                        id: id
                    });
                }}
            />
            <NextLink href="/post/edit/[id]" as={`/post/edit/${id}`}>
                <EditIcon cursor="pointer" aria-label="Edit Post" />
            </NextLink>
        </Box>
    );
};

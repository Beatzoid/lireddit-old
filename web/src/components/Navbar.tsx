import { Box, Flex, Link } from "@chakra-ui/layout";
import React from "react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { Button } from "@chakra-ui/button";
import { isServer } from "../utils/isServer";

interface NavbarProps {}

export const Navbar: React.FC<NavbarProps> = ({}) => {
    const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
    const [{ data, fetching }] = useMeQuery({ pause: isServer() });
    let body = null;

    // Data is loading
    if (fetching) {
        body = null;
        // User isn't logged in
    } else if (!data?.me) {
        body = (
            <>
                <NextLink href="/login">
                    <Link mr={2}>Login</Link>
                </NextLink>
                <NextLink href="/register">
                    <Link>Register</Link>
                </NextLink>
            </>
        );
        // User is logged in
    } else {
        body = (
            <Flex>
                <Box mr={2}>{data.me.username}</Box>
                <Button
                    variant="link"
                    onClick={() => logout()}
                    isLoading={logoutFetching}
                >
                    Logout
                </Button>
            </Flex>
        );
    }

    return (
        <Flex bg="tomato" p={4}>
            <Box ml="auto">{body}</Box>
        </Flex>
    );
};

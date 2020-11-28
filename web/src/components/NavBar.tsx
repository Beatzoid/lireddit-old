import React from "react";
import { Box, Button, Flex, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
    const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
    const [{ data, fetching }] = useMeQuery();
    let body = null;

    if (fetching) {
        // Data is loading
    } else if (!data?.me) {
        // User is not logged in
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
    } else {
        // User is logged in
        body = (
            <Flex>
                <Box mr={2}>{data.me.username}</Box>
                <Button
                    onClick={() => {
                        // noinspection JSIgnoredPromiseFromCall
                        logout();
                    }}
                    isLoading={logoutFetching}
                    variant="link"
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

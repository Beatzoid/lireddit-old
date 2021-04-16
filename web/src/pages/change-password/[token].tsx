import { Box, Button, Flex, Link } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { InputField } from "../../components/InputField";
import { Wrapper } from "../../components/Wrapper";
import { useChangePasswordMutation } from "../../generated/graphql";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { toErrorMap } from "../../utils/toErrorMap";
import NextLink from "next/link";

const ChangePassword: NextPage<{ token: string }> = ({ token }) => {
    const router = useRouter();
    const [, changePassword] = useChangePasswordMutation();
    const [tokenError, setTokenError] = useState("");

    return (
        <Wrapper variant="small">
            <Formik
                initialValues={{ newPassword: "" }}
                onSubmit={async (values, { setErrors }) => {
                    const res = await changePassword({
                        newPassword: values.newPassword,
                        token
                    });
                    if (res.data?.changePassword.errors) {
                        const errorMap = toErrorMap(
                            res.data.changePassword.errors
                        );
                        if ("token" in errorMap) {
                            setTokenError(errorMap.token);
                        }
                        setErrors(errorMap);
                    } else if (res.data?.changePassword.user) {
                        router.push("/");
                    }
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name="newPassword"
                            placeholder="New Password"
                            label="New Password"
                            type="password"
                        />
                        {tokenError && (
                            <Flex>
                                <Box color="red">{tokenError}</Box>
                                <NextLink href="/forgot-password">
                                    <Link color="red">
                                        , click here to request a new token
                                    </Link>
                                </NextLink>
                            </Flex>
                        )}
                        <Button
                            mt={4}
                            colorScheme="teal"
                            isLoading={isSubmitting}
                            type="submit"
                        >
                            Change Password
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
};

ChangePassword.getInitialProps = ({ query }) => {
    return {
        token: query.token as string
    };
};

export default withUrqlClient(createUrqlClient)(ChangePassword as any);

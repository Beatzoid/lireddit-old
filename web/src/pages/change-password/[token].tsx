import React from "react";
import { NextPage } from "next";
import { Form, Formik } from "formik";
import { toErrorMap } from "../../utils/toErrorMap";
import { InputField } from "../../components/InputField";
import { Box } from "@chakra-ui/layout";
import { Button } from "@chakra-ui/react";
import { Wrapper } from "../../components/Wrapper";
import login from "../login";

const ChangePassword: NextPage<{ token: string }> = ({ token }) => {
    return (
        <Wrapper variant={"small"}>
            <Formik
                initialValues={{ newPassword: "" }}
                onSubmit={async (values, { setErrors }) => {
                    // const response = await login(values);
                    // if (response.data?.login.errors) {
                    //     setErrors(toErrorMap(response.data.login.errors));
                    // } else if (response.data?.login.user) {
                    //     // Successfully registered
                    //     await router.push("/");
                    // }
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name="newPassword"
                            placeholder="New password"
                            label="New Password"
                            type="password"
                        />
                        <Button
                            mt={4}
                            type="submit"
                            isLoading={isSubmitting}
                            colorScheme="teal"
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

export default ChangePassword;

import { Box, Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";

import { InputField } from "../components/InputField";
import { Layout } from "../components/Layout";
import { useCreatePostMutation } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { toErrorMap } from "../utils/toErrorMap";
import { useIsAuth } from "../utils/useIsAuth";

const CreatePost: React.FC<{}> = ({}) => {
    const router = useRouter();
    useIsAuth();
    const [, createPost] = useCreatePostMutation();

    return (
        <Layout variant="small">
            <Formik
                initialValues={{ title: "", text: "" }}
                onSubmit={async (values, { setErrors }) => {
                    const res = await createPost({ options: values });
                    if (res.data?.createPost.errors) {
                        const errorMap = toErrorMap(res.data.createPost.errors);
                        setErrors(errorMap);
                    } else if (res.data?.createPost.post) {
                        router.push("/");
                    }
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name="title"
                            placeholder="Title"
                            label="Title"
                        />
                        <Box mt={4}>
                            <InputField
                                textarea
                                name="text"
                                placeholder="Text..."
                                label="Body"
                            />
                        </Box>
                        <Button
                            mt={4}
                            type="submit"
                            isLoading={isSubmitting}
                            colorScheme="teal"
                        >
                            Create post
                        </Button>
                    </Form>
                )}
            </Formik>
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient)(CreatePost);

import { UsernamePasswordInput } from "../resolvers/UsernamePasswordInput";

const EMAIL_REGEX = "[^@ \\t\\r\\n]+@[^@ \\t\\r\\n]+\\.[^@ \\t\\r\\n]+";

export const validateRegister = (options: UsernamePasswordInput) => {
    if (!options.email.match(EMAIL_REGEX)) {
        return [
            {
                field: "email",
                message: "Invalid email"
            }
        ];
    }

    if (options.username.length <= 2) {
        return [
            {
                field: "username",
                message: "Username length must greater than 2 characters"
            }
        ];
    }

    if (options.username.includes("@")) {
        return [
            {
                field: "username",
                message: 'Username cannot include an "@" sign'
            }
        ];
    }

    if (options.password.length <= 3) {
        return [
            {
                field: "password",
                message: "Password length must greater than 3 characters"
            }
        ];
    }

    return null;
};

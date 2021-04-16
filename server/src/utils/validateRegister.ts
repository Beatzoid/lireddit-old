import { EMAIL_REGEX } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";

export const validateRegister = (options: UsernamePasswordInput) => {
    if (EMAIL_REGEX.test(options.email)) {
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
                message: "Length must be greater than 2"
            }
        ];
    }

    if (new RegExp("/[^a-zA-Z0-9]/gm").test(options.username)) {
        return [
            {
                field: "username",
                message: "Cannot include special characters"
            }
        ];
    }

    if (options.password.length <= 2) {
        return [
            {
                field: "password",
                message: "Password length must be greater than 2"
            }
        ];
    }

    return null;
};

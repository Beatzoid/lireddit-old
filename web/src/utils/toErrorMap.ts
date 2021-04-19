import { FieldError, PostFieldError } from "../generated/graphql";

export const toErrorMap = (errors: FieldError[] | PostFieldError[]) => {
    const errorMap: Record<string, string> = {};
    errors.forEach(({ field, message }: any) => {
        errorMap[field] = message;
    });
    return errorMap;
};

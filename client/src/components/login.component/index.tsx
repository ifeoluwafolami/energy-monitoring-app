import { Form } from "../global/Form";

export default function LoginComponent() {
    return (
        <Form
            title="Staff Login."
            description="Sign in to access your energy monitoring dashboard."
            buttonProps={{
                text: "Submit",
                type: "submit",
                variant: "solid",
            }}
            inputs={[
                {
                    label: "Username/Email",
                    type: "text",
                    id: "username_email",
                    required: true,
                    placeholder: "Enter your username or email",
                },
                {
                    label: "Password",
                    type: "password",
                    id: "password",
                    required: true,
                    placeholder: "Enter your password",
                },
            ]}
            links={[
                {
                    pText: "Don't have an account?",
                    pClassName: "!text-[16px] mt-4 mb-1",
                    anchorText: "Register",
                    anchorLink: "/register",
                    anchorClassName: "text-primary-orange underline hover:text-sec-orange"
                },
                {
                    pText: "Forgot your password?",
                    pClassName: "!text-xs mt-0 mb-1",
                    anchorText: "Click Here",
                    anchorLink: "/register",
                    anchorClassName: "underline hover:text-primary-blue/70"
                },
            ]}
        />
    );
}
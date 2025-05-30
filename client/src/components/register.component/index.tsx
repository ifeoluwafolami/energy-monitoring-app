import { Form } from "../global/Form";

export default function RegisterComponent() {
    // Regions based on your backend data
    const regions = [
        { value: "IBADAN", label: "Ibadan" },
        { value: "KWARA", label: "Kwara" },
        { value: "OGUN", label: "Ogun" },
        { value: "OSUN", label: "Osun" },
        { value: "OYO", label: "Oyo" },
    ];

    // Business hubs organized by region
    const businessHubsByRegion = {
        IBADAN: [
            { value: "DUGBE", label: "Dugbe" },
            { value: "MOLETE", label: "Molete" },
            { value: "APATA", label: "Apata" },
        ],
        KWARA: [
            { value: "CHALLENGE", label: "Challenge" },
            { value: "BABOKO", label: "Baboko" },
            { value: "OGBOMOSO", label: "Ogbomoso" },
            { value: "NEW_BUSSA", label: "New Bussa" },
            { value: "JEBBA", label: "Jebba" },
            { value: "OMUARAN", label: "Omuaran" },
            { value: "OFFA", label: "Offa" },
        ],
        OGUN: [
            { value: "OLUMO", label: "Olumo" },
            { value: "SAGAMU", label: "Sagamu" },
            { value: "IJEBU_ODE", label: "Ijebu Ode" },
            { value: "OTA", label: "Ota" },
            { value: "MOWE", label: "Mowe" },
            { value: "IJEUN", label: "Ijeun" },
            { value: "SANGO", label: "Sango" },
        ],
        OSUN: [
            { value: "EDE", label: "Ede" },
            { value: "ILE_IFE", label: "Ile Ife" },
            { value: "ILESA", label: "Ilesa" },
            { value: "OSOGBO", label: "Osogbo" },
            { value: "IKIRUN", label: "Ikirun" },
        ],
        OYO: [
            { value: "OYO", label: "Oyo" },
            { value: "MONATAN", label: "Monatan" },
            { value: "AKANRAN", label: "Akanran" },
            { value: "OJOO", label: "Ojoo" },
        ],
    };

    const getOptionsForField = (fieldId: string, dependentValue?: string) => {
        if (fieldId === "businessHub" && dependentValue) {
            return businessHubsByRegion[dependentValue as keyof typeof businessHubsByRegion] || [];
        }
        return [];
    };

    return (
        <Form
            title="Create an account!"
            description="Please fill out the form below, then reach out to an admin for account approval."
            buttonProps={{
                text: "Submit",
                type: "submit",
                variant: "solid",
            }}
            inputs={[
                {
                    label: "Name",
                    type: "text",
                    id: "name",
                    required: true,
                    placeholder: "e.g. Ifeoluwa Folami",
                },
                {
                    label: "Email",
                    type: "email",
                    id: "email",
                    required: true,
                    placeholder: "e.g. ifeoluwa.fol@gmail.com",
                },
                {
                    label: "Password",
                    type: "password",
                    id: "password",
                    required: true,
                    placeholder: "Enter your password",
                },
                {
                    label: "Confirm Password",
                    type: "password",
                    id: "confirm-password",
                    required: true,
                    placeholder: "Retype your password",
                },
                {
                    label: "Region",
                    type: "select",
                    id: "region",
                    required: true,
                    placeholder: "Select your region",
                    options: regions,
                },
                {
                    label: "Business Hub",
                    type: "select",
                    id: "businessHub",
                    required: true,
                    placeholder: "Select your business hub",
                    dependentOn: "region",
                },
            ]}
            links={[
                {
                    pText: "You have an account?",
                    pClassName: "!text-sm mt-4 mb-1",
                    anchorText: "Login",
                    anchorLink: "/login",
                    anchorClassName: "text-primary-orange underline hover:text-sec-orange"
                },
            ]}
            getOptionsForField={getOptionsForField}
        />
    );
}
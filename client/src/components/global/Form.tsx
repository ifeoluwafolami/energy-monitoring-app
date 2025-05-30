import { Button } from "./Button";
import type { ButtonProps } from "./Button";
import { useState } from "react";

interface SelectOption {
    value: string;
    label: string;
}

interface InputField {
    label: string;
    type: string;
    id?: string;
    required?: boolean;
    placeholder?: string;
    options?: SelectOption[]; // For select dropdowns
    dependentOn?: string; // Field ID this depends on
}

interface LinkItem {
    pText?: string;
    anchorText?: string;
    anchorLink?: string;
    pClassName?: string; // Custom class for the paragraph
    anchorClassName?: string; // Custom class for the anchor
}

export interface FormProps {
    title?: string;
    description?: string;
    buttonProps: ButtonProps;
    inputs: InputField[];
    className?: string;
    anchorText?: string; // Keep for backward compatibility
    anchorLink?: string; // Keep for backward compatibility
    pText?: string; // Keep for backward compatibility
    links?: LinkItem[]; // New prop for multiple links
    onFieldChange?: (fieldId: string, value: string) => void;
    getOptionsForField?: (fieldId: string, dependentValue?: string) => SelectOption[];
}

export const Form: React.FC<FormProps> = ({
    title = "",
    description = "",
    buttonProps,
    inputs = [],
    className = "",
    anchorText = "",
    anchorLink = "",
    pText = "",
    links = [],
    onFieldChange,
    getOptionsForField
}) => {
    const [formData, setFormData] = useState<Record<string, string>>({});

    if (inputs.length === 0) {
        throw new Error("The form must contain at least one input field.");
    } 

    const titleClasses = title ? "text-3xl italic font-bold text-center" : "hidden";
    const descriptionClasses = description ? "text-center mb-1 mt-1 w-[90%] lg:w-[40%]" : "hidden";
    const divClasses = `flex flex-col items-center justify-center py-[2rem] pt-[-0.5rem] text-primary-blue ${className}`;
    const formClasses = "bg-white p-6 mt-2 rounded-2xl shadow-md w-full max-w-sm lg:max-w-md";
    const inputClasses = "border border-light-charcoal rounded-md p-2 w-full mb-4";
    const selectClasses = "border border-light-charcoal rounded-md p-2 w-full mb-4 bg-white";
    const labelClasses = "block mb-2 text-charcoal font-semibold";
    const anchorClasses = "text-charcoal hover:text-light-charcoal underline ml-1";

    const handleFieldChange = (fieldId: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [fieldId]: value
        }));
        
        if (onFieldChange) {
            onFieldChange(fieldId, value);
        }
    };

    const getFieldOptions = (input: InputField): SelectOption[] => {
        if (getOptionsForField && input.dependentOn) {
            const dependentValue = formData[input.dependentOn];
            return getOptionsForField(input.id!, dependentValue);
        }
        return input.options || [];
    };

    const renderField = (input: InputField) => {
        if (input.type === 'select') {
            const options = getFieldOptions(input);
            const isDisabled = input.dependentOn ? !formData[input.dependentOn] : false;
            
            return (
                <select 
                    id={input.id} 
                    className={selectClasses}
                    required={input.required}
                    value={formData[input.id!] || ""}
                    onChange={(e) => handleFieldChange(input.id!, e.target.value)}
                    disabled={isDisabled}
                >
                    <option value="" disabled>
                        {isDisabled 
                            ? `Select ${input.dependentOn} first` 
                            : input.placeholder
                        }
                    </option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            );
        }

        return (
            <input 
                type={input.type} 
                id={input.id} 
                className={inputClasses}
                required={input.required}
                placeholder={input.placeholder}
                value={formData[input.id!] || ""}
                onChange={(e) => handleFieldChange(input.id!, e.target.value)}
            />
        );
    };

    return (
        <div className={divClasses}>
            <h1 className={titleClasses}>{title}</h1>
            <p className={descriptionClasses}>{description}</p>

            <form className={formClasses}>
                {inputs.map((input, index) => (
                    <div className="mb-1" key={index}>
                        <label 
                            htmlFor={input.id} 
                            className={labelClasses}
                        >
                            {input.label}
                        </label>
                        {renderField(input)}
                    </div>
                ))}

                <div className="flex flex-col w-[75%] justify-center items-center mx-auto">
                    <Button {...buttonProps} />
                    
                    {/* Handle multiple links */}
                    {links.length > 0 ? (
                        links.map((link, index) => (
                            (link.pText || link.anchorText) && (
                                <p 
                                    key={index} 
                                    className={link.pClassName || "mt-3 text-center"}
                                >
                                    {link.pText}
                                    {link.anchorText && (
                                        <>
                                            {link.pText && " "}
                                            <a 
                                                href={link.anchorLink} 
                                                className={link.anchorClassName || anchorClasses}
                                            >
                                                {link.anchorText}
                                            </a>
                                        </>
                                    )}
                                </p>
                            )
                        ))
                    ) : (
                        /* Fallback to single link for backward compatibility */
                        (pText || anchorText) && (
                            <p className="mt-3 text-center">
                                {pText}
                                {anchorText && (
                                    <>
                                        {pText && " "}
                                        <a href={anchorLink} className={anchorClasses}>{anchorText}</a>
                                    </>
                                )}
                            </p>
                        )
                    )}
                </div>
            </form>
        </div>
    );
}
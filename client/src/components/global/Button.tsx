import React from "react";

export interface ButtonProps {
    text: string; //text to be displayed inside the button
    onClick?: () => void; //function called when button is clicked
    type?: "button" | "submit" | "reset";
    disabled?: boolean; //if true, button is disabled and cannot be clicked
    className?: string; //additional classes to be added to the button
    variant?: "solid" | "outline" | "none"; //button style variants
    size?: "small" | "medium" | "large" | "xlarge"; //button size variants
    loading?: boolean;
    key?: string;
}

export const Button: React.FC<ButtonProps> = ({
    text,
    onClick,
    type = 'button',
    disabled = false,
    className = "",
    variant = "solid",
    size = "medium",
    loading = false,
    key = ""
}) => {
    const baseClasses = "rounded-md font-audiowide font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-00 ease-in-out";

    const variantClasses = {
        solid: "bg-primary-blue text-white hover:bg-primary-blue/70 focus:ring-primary-orange",
        outline: "border-primary-orange border-1 text-primary-orange hover:bg-sec-orange hover:text-white",
        none: "bg-transparent hover:bg-light-charcoal"
    }
    const sizeClasses = {
        small: "w-24 h-10 text-sm",     
        medium: "w-32 h-12 text-base", 
        large: "w-36 h-14 text-lg", 
        xlarge: "w-40 h-16 text-lg",
    };

    const disabledClasses = "opacity-50 cursor-not-allowed";
    const loadingClasses = "cursor-wait";

    const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? disabledClasses : ""} ${loading ? loadingClasses : ""} ${className}`;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={buttonClasses}
            key={key}
        >
            {loading ? <span className="spinner-border animate-spin w-5 h-5 border-2 border-t-2 border-white rounded-full"></span> : text}
        </button>
    );
}


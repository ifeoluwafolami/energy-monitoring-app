import { Schema, Types, model } from "mongoose";

// Input type for signup form data
export interface SignupRequestForm {
    name: string;
    email: string;
    password: string;
    region: string;
    businessHub: string;
}


export interface ISignupRequest extends Document {
    name: string;
    email: string;
    password: string;
    isAdmin: boolean;
    businessHub: Types.ObjectId;
    region: Types.ObjectId;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const signupRequestSchema = new Schema<ISignupRequest>(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true
        },
        password: {
            type: String,
            required: true
        },
        businessHub: {
            type: Schema.Types.ObjectId,
            ref: 'BusinessHub',
            required: true
        },
        region: {
            type: Schema.Types.ObjectId,
            ref: 'Region',
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'denied'],
            default: 'pending',
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);


export const SignupRequest = model<ISignupRequest>('SignupRequest', signupRequestSchema);
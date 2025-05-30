import {Schema, model, Document, Types} from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    isAdmin: boolean;
    businessHub: Types.ObjectId;
    region: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true
        },

        isAdmin: {
            type: Boolean,
            default: false
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
    }, 
    {
        timestamps: true
    }
);

export const User = model<IUser>('User', userSchema);



import { Document, model, Schema, Types } from "mongoose";

export interface BusinessHubInput {
    name: string;
    region: string;
}

export interface IBusinessHub extends Document {
    name: string;
    region: Types.ObjectId;
}

const BusinessHubSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        region: {
            type: Schema.Types.ObjectId,
            ref: 'Region',
            required: true
        }
    }
);

export const BusinessHub = model<IBusinessHub>('BusinessHub', BusinessHubSchema);
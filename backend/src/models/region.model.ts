import { Document, model, Schema } from "mongoose";

export interface RegionFormInput {
    name: string;
}

export interface IRegion extends Document {
    name: string;
} 

const RegionSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        }
    }
);

export const Region = model<IRegion>('Region', RegionSchema);
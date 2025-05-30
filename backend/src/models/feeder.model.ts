import { Document, model, Schema, Types } from "mongoose";

export interface FeederFormInput {
    name: string;
    businessHub: string;
    region: string;
}


export interface IFeeder extends Document {
    name: string;
    businessHub: Types.ObjectId;
    region: Types.ObjectId;
    band: string;
    dailyEnergyUptake: number;
    monthlyDeliveryPlan: number;
    previousMonthConsumption: number;
}

const feederSchema = new Schema<IFeeder>(
    {
        name: {
            type: String,
            required: true,
            trim: true
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

        band: {
            type: String,
            enum: ['A20H', 'B16H', 'C12H', 'D8H', 'E4H'],
            required: true,
            trim: true
        },

        dailyEnergyUptake: {
            type: Number,
            required: true
        },

        monthlyDeliveryPlan: {
            type: Number,
            required: true
        },

        previousMonthConsumption: {
            type: Number,
            required: true
        },
    }
);

export const Feeder = model<IFeeder>('Feeder', feederSchema);
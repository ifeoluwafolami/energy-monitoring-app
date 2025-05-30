import { Document, model, Schema, Types } from "mongoose";

export interface FeederReadingFormInput {
    date: string;
    feeder: string;
    cumulativeEnergyConsumption: number;
}

interface IFeederReadingHistory {
    date: Date;
    cumulativeEnergyConsumption: number;
    updatedAt: Date;
    updatedBy: Types.ObjectId;
}

export interface IFeederReading extends Document {
    date: Date;
    feeder: Types.ObjectId;
    cumulativeEnergyConsumption: number;
    recordedBy: Types.ObjectId;
    history: IFeederReadingHistory[];
    createdAt: Date;
    updatedAt: Date;
}

const FeederReadingSchema = new Schema<IFeederReading>(
    {
        date: {
            type: Date,
            required: true
        },

        feeder: {
            type: Schema.Types.ObjectId,
            ref: "Feeder",
            required: true
        },

        cumulativeEnergyConsumption: {
            type: Number,
            required: true
        },

        recordedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        history: [
            {
                date: Date,
                cumulativeEnergyConsumption: Number,
                updatedAt: Date,
                updatedBy: {
                    type: Schema.Types.ObjectId,
                    ref: "User"
                }
            }
        ]

    }, {
        timestamps: true
    }
);

export const FeederReading = model<IFeederReading>("FeederReading", FeederReadingSchema);

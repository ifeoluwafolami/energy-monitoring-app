import { Request, Response } from "express";
import { isBlank } from "../utils/isBlank";
import { Feeder } from "../models/feeder.model";
import { Region } from "../models/region.model";
import { BusinessHub } from "../models/businessHub.model";

// Create new feeder
export const createFeeder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, businessHub, region, band, dailyEnergyUptake, monthlyDeliveryPlan, previousMonthConsumption } = req.body;
        
        if (isBlank(name) || isBlank(businessHub) || isBlank(region) || isBlank(band)) {
            res.status(400).json({message: "All fields are required."});
            return;
        }

        const feederExists = await Feeder.findOne({ name: name.trim(), businessHub: businessHub.trim(), region: region.trim() });
        if (feederExists) {
            res.status(400).json({message: "Feeder already exists in this Business Hub."});
            return;
        }

        const feeder = await Feeder.create({
            name,
            businessHub,
            region,
            band,
            dailyEnergyUptake,
            monthlyDeliveryPlan,
            previousMonthConsumption
        });

        res.status(201).json({message: "Feeder created successfully.", feeder});


    } catch (error) {
        console.error("Error creating feeder: ", error);
        res.status(500).json({message: "Failed to create feeder."});
    }
}

// Fetch all Feeders
export const getAllFeeders = async (req: Request, res: Response): Promise<void> => {
    try {
        const feeders = await Feeder.find()
        .populate({
            path: "businessHub",
            select: "name region",
            populate: {
                path: "region",
                select: "name"
            }
        });
        res.status(200).json(feeders);
    } catch (error) {
        console.error("Error fetching feeders: ", error);
        res.status(500).json({message: "Failed to fetch feeders."});
    }
}


// Fetch a Feeder
export const getFeeder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const feeder = await Feeder.findById(id).populate({
            path: "businessHub",
            select: "name region",
            populate: {
                path: "region",
                select: "name"
            }
        });

        if (!feeder) {
            res.status(404).json({message: "Feeder not found."});
            return;
        }

        res.status(200).json(feeder);
    } catch (error) {
        console.error("Error fetching feeder: ", error);
        res.status(500).json({message: "Failed to fetch feeder."});
    }
}


// Update Feeder
export const updateFeeder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, businessHub, region, band, dailyEnergyUptake, monthlyDeliveryPlan, previousMonthConsumption } = req.body;
        const { id } = req.params;

        const feeder = await Feeder.findById(id);

        if (!feeder) {
            res.status(404).json({ message: "Feeder not found." });
            return;
        }

        const trimmedName = name.trim();
        const trimmedBusinessHub = businessHub.trim();
        const trimmedRegion = region.trim();
        const trimmedBand = band.trim();

        if (trimmedName && trimmedBusinessHub && trimmedRegion) {
            const conflict = await Feeder.findOne({ name: trimmedName, businessHub: trimmedBusinessHub, region: trimmedRegion, _id: { $ne: id } });
            if (conflict) {
                res.status(400).json({ message: "Feeder with this name, business hub and region already exists." });
                return;
            }
        }

        if (trimmedName) feeder.name = trimmedName;
        if (trimmedBusinessHub) feeder.businessHub = trimmedBusinessHub;
        if (trimmedRegion) feeder.region = trimmedRegion;
        if (trimmedBand) feeder.band = trimmedBand;
        if (dailyEnergyUptake !== undefined) feeder.dailyEnergyUptake = dailyEnergyUptake;
        if (monthlyDeliveryPlan !== undefined) feeder.monthlyDeliveryPlan = monthlyDeliveryPlan;
        if (previousMonthConsumption !== undefined) feeder.previousMonthConsumption = previousMonthConsumption;

        await feeder.save();

        res.status(200).json({ message: "Feeder updated successfully.", feeder });

    } catch (error) {
        console.error("Error updating feeder: ", error);
        res.status(500).json({ message: "Failed to update feeder." });
    }
};


// Delete feeder
export const deleteFeeder = async(req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const feeder = await Feeder.findById(id);

        if (!feeder) {
            res.status(404).json({message: "Feeder not found."});
            return;
        }

        await Feeder.findByIdAndDelete(id);

        res.status(200).json({message: "Feeder deleted successfully."});

    } catch (error) {
        console.error("Error deleting feeder: ", error);
        res.status(500).json({message: "Failed to delete feeder."});
    }
}

// Filter Feeders By Region
export const filterFeedersByRegion = async (req: Request, res: Response): Promise<void> => {
    const regionName = (req.query.region as string).trim();
    if (!regionName) {
        res.status(400).json({message: "Kindly input a region."});
        return;
    }

    try {
        const region = await Region.findOne({
            name: { $regex: new RegExp(`^${regionName}$`, "i") }
        });

        if (!region) {
            res.status(404).json({message: "Region not found."});
            return;
        }

        const feedersInRegion = await Feeder.find({ region: region._id }).select("-password").populate("region", "name").populate("businessHub", "name");

        if (!feedersInRegion.length) {
            res.status(404).json({message: "No feeders found under that region."});
            return;
        }

        res.status(200).json(feedersInRegion);

    } catch (error) {
        console.error("Error filtering feeders by region: ", error);
        res.status(500).json({message: "Error filtering feeders by region."});
    }
}

// Filter Feeders By BHs
export const filterFeedersByBusinessHub = async (req: Request, res: Response): Promise<void> => {
    const businessHubName = (req.query.businessHub as string).trim();
    if (!businessHubName) {
        res.status(400).json({message: "Kindly input a business hub."});
        return;
    }

    try {
        const businessHub = await BusinessHub.findOne({
            name: { $regex: new RegExp(`^${businessHubName}$`, "i") }
        });

        if (!businessHub) {
            res.status(404).json({message: "Business Hub not found."});
            return;
        }

        const feedersInBusinessHub = await Feeder.find({ businessHub: businessHub._id }).select("-password").populate("businessHub", "name").populate("region", "name");

        if (!feedersInBusinessHub.length) {
            res.status(404).json({message: "No feeders found under that region."});
            return;
        }

        res.status(200).json(feedersInBusinessHub);

    } catch (error) {
        console.error("Error filtering feeders by businessHub: ", error);
        res.status(500).json({message: "Error filtering feeders by businessHub."});
    }
}

// Filter Feeders by Band
export const filterFeedersByBand = async (req: Request, res: Response): Promise<void> => {
    const band = req.query.band as string;
    if (isBlank(band)) {
        res.status(400).json({message: "Kindly input a band."});
        return;
    }

    try {
        const feedersInBand = await Feeder.find({
            band: { $regex: new RegExp(`^${band.trim()}$`, "i") }
        });
        if (!feedersInBand || feedersInBand.length === 0) {
            res.status(404).json({message: "No feeders found under that band."})
            return;
        }

        res.status(200).json(feedersInBand);

    } catch (error) {
        console.error("Error filtering feeders by band: ", error);
        res.status(500).json({message: "Error filtering feeders by band."});
    }
}

export const filterFeedersByBHAndRegion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { region: regionName, businessHub: businessHubName } = req.query;
        const filter: any = {};

        // 🔹 Convert Region name to ObjectId
        if (regionName && typeof regionName === "string") {
            const region = await Region.findOne({
                name: { $regex: new RegExp(`^${regionName.trim()}$`, "i") }
            });
            if (!region) {
                res.status(404).json({ message: "Region not found." });
                return;
            }
            filter.region = region._id;
        }

        // 🔹 Convert Business Hub name to ObjectId
        if (businessHubName && typeof businessHubName === "string") {
            const businessHub = await BusinessHub.findOne({
                name: { $regex: new RegExp(`^${businessHubName.trim()}$`, "i") }
            });
            if (!businessHub) {
                res.status(404).json({ message: "Business Hub not found." });
                return;
            }
            filter.businessHub = businessHub._id;
        }

        // 🔍 Find Feeders using filter
        const feeders = await Feeder.find(filter)
            .populate("region", "name")
            .populate("businessHub", "name");

        if (!feeders.length) {
            res.status(404).json({ message: "No feeders found for those filters." });
            return;
        }

        res.status(200).json(feeders);

    } catch (error) {
        console.error("Error filtering feeders:", error);
        res.status(500).json({ message: "Error filtering feeders." });
    }
};
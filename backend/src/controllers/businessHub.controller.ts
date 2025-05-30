import { Request, Response } from "express";
import { BusinessHub } from "../models/businessHub.model";
import { isBlank } from "../utils/isBlank";
import { Region } from "../models/region.model";

export const createBusinessHub = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, region } = req.body;

        if (isBlank(name) || isBlank(region)) {
            res.status(400).json({message: "Both name and region of business hub are required."});
            return;
        };

        const trimmedName = name?.trim();
        const trimmedRegion = region?.trim();

        const businessHubExists = await BusinessHub.findOne({ name: trimmedName, region: trimmedRegion });
        if (businessHubExists) {
            res.status(400).json({message: "Business Hub already exists in this region."});
            return;
        }

        const businessHub = await BusinessHub.create({
            name: trimmedName,
            region: trimmedRegion,
        });

        res.status(201).json({message: "Business Hub created successfully.", businessHub});

    } catch (error) {
        console.error("Error creating Business Hub: ", error);
        res.status(500).json({message: "Failed to create Business Hub."});
    }
}

// Fetch all BHs
export const getAllBusinessHubs = async (req: Request, res: Response): Promise<void> => {
    try {
        const businessHubs = await BusinessHub.find();
        res.status(200).json(businessHubs);
    } catch (error) {
        console.error("Error fetching Business Hubs: ", error);
        res.status(500).json({message: "Failed to fetch business hubs."});
    }
}


// Fetch one BH
export const getBusinessHub = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const businessHub = await BusinessHub.findById(id);

        if (!businessHub) {
            res.status(404).json({message: "Business Hub not found."});
            return;
        }

        res.status(200).json(businessHub);
    } catch (error) {
        console.error("Error fetching business hub: ", error);
        res.status(500).json({message: "Failed to fetch business hub."});
    }
}


// Update BH
export const updateBusinessHub = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, region } = req.body;
        const { id } = req.params;

        const businessHub = await BusinessHub.findById(id);

        if (!businessHub) {
            res.status(404).json({ message: "Business Hub not found." });
            return;
        }

        if (isBlank(name) && isBlank(region)) {
            res.status(400).json({ message: "Both name and region cannot be empty." });
            return;
        }

        const trimmedName = name ? name.trim() : "";
        const trimmedRegion = region ? region.trim() : "";

        if (trimmedName && trimmedRegion) {
            const conflict = await BusinessHub.findOne({ name: trimmedName, region: trimmedRegion, _id: { $ne: id } });
            if (conflict) {
                res.status(400).json({ message: "Business hub with this name and region already exists." });
                return;
            }
        } else if (trimmedName && !trimmedRegion) {
            const conflict = await BusinessHub.findOne({ name: trimmedName, region: businessHub.region, _id: { $ne: id } });
            if (conflict) {
                res.status(400).json({ message: "Business hub with this name and region already exists." });
                return;
            }
        } else if (!trimmedName && trimmedRegion) {
            const conflict = await BusinessHub.findOne({ name: businessHub.name, region: trimmedRegion, _id: { $ne: id } });
            if (conflict) {
                res.status(400).json({ message: "Business hub with this name and region already exists." });
                return;
            }
        }

        if (trimmedName) businessHub.name = trimmedName;
        if (trimmedRegion) businessHub.region = trimmedRegion;

        await businessHub.save();

        res.status(200).json({ message: "Business Hub updated successfully.", businessHub });

    } catch (error) {
        console.error("Error updating business hub: ", error);
        res.status(500).json({ message: "Failed to update business hub." });
    }
};


// Delete business hub
export const deleteBusinessHub = async(req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const businessHub = await BusinessHub.findById(id);

        if (!businessHub) {
            res.status(404).json({message: "Business hub not found."});
            return;
        }

        await BusinessHub.findByIdAndDelete(id);

        res.status(200).json({message: "Business hub deleted successfully."});

    } catch (error) {
        console.error("Error deleting business hub: ", error);
        res.status(500).json({message: "Failed to delete business hub."});
    }
}

// Filter BHs By Region
export const filterBusinessHubsByRegion = async (req: Request, res: Response): Promise<void> => {
    const region = (req.query.region as string).trim();
    if (!region) {
        res.status(400).json({message: "Kindly input a region."});
        return;
    }

    try {
        // 1. Find regions that match the regionName (case insensitive)
        const matchingRegions = await Region.find({
            name: { $regex: new RegExp(`^${region}$`, "i") }
        });

        if (matchingRegions.length === 0) {
            res.status(404).json({ message: "No region found with that name." });
            return;
        }

        const regionIds = matchingRegions.map(region => region._id);

        // 2. Find BusinessHubs where region is in matching region IDs
        const businessHubsInRegion = await BusinessHub.find({
            region: { $in: regionIds }
        }).populate("region", "name");  // 3. Populate the region details

        if (!businessHubsInRegion.length) {
            res.status(404).json({ message: "No business hubs found under that region." });
            return;
        }

        res.status(200).json(businessHubsInRegion);

    } catch (error) {
        console.error("Error filtering business hubs by region: ", error);
        res.status(500).json({message: "Error filtering business hubs by region."});
    }
}
import { Request, Response } from "express"
import { Region } from "../models/region.model";
import { isBlank } from "../utils/isBlank";

// Create new region
export const createRegion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.body;

        const regionExisting = await Region.findOne({ name: name.trim() });

        if (regionExisting) {
            res.status(400).json({message: "Region already exists."});
            return;
        }

        const region = await Region.create({ name: name.trim() });
        res.status(201).json({message: "Region created successfully.", region});

    } catch (error) {
        console.error("Error creating region: ", error);
        res.status(500).json({message: "Error creating region."});
    }
}

// Fetch all regions
export const getAllRegions = async (req: Request, res: Response): Promise<void> => {
    try {
        const regions = await Region.find();
        res.status(200).json(regions);
    } catch (error) {
        console.error("Error fetching regions: ", error);
        res.status(500).json({message: "Failed to fetch regions."});
    }
}


// Fetch one region
export const getRegion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const region = await Region.findById(id);

        if (!region) {
            res.status(404).json({message: "Region not found."});
            return;
        }

        res.status(200).json(region);
    } catch (error) {
        console.error("Error fetching region: ", error);
        res.status(500).json({message: "Failed to fetch region."});
    }
}


// Update region
export const updateRegion = async(req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.body;
        const { id } = req.params;

        const region = await Region.findById(id);

        if (!region) {
            res.status(404).json({message: "Region not found."});
            return;
        }

        if (isBlank(name)) {
            res.status(400).json({message: "Region name cannot be blank."});
            return;
        }

        region.name = name.trim();
        await region.save();

        res.status(200).json({message: "Region updated successfully.", region});

    } catch (error) {
        console.error("Error updating region: ", error);
        res.status(500).json({message: "Failed to update region."});
    }
}

// Delete region
export const deleteRegion = async(req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const region = await Region.findById(id);

        if (!region) {
            res.status(404).json({message: "Region not found."});
            return;
        }

        await Region.findByIdAndDelete(id);

        res.status(200).json({message: "Region deleted successfully."});

    } catch (error) {
        console.error("Error deleting region: ", error);
        res.status(500).json({message: "Failed to delete region."});
    }
}
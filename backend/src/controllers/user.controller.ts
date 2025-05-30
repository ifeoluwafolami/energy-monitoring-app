import { Request, Response } from "express";
import { User } from "../models/user.model";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken";
import { SignupRequest } from "../models/signupRequest.model";
import { isBlank } from "../utils/isBlank";
import { BusinessHub } from "../models/businessHub.model";
import { Region } from "../models/region.model";
import { Feeder } from "../models/feeder.model";
import { FeederReading } from "../models/feederReading.model";


// Get List of All Users
// Query --- GET /api/users?page=2&limit=5
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    try {
        const users = await User.find().select('-password').skip(skip).limit(limit).lean();

        const total = await User.countDocuments();

        res.status(200).json({
            users,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalUsers: total
        });

    } catch (error) {
        console.error("Error fetching users: ", error);
        res.status(500).json({message: "Error getting users."});
    }
}

// Get Single User
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            res.status(404).json({message: "User not found."});
            return;
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user: ", error);
        res.status(500).json({message: "Error getting user."});
    }
}

// Filter Users by Business Hub 
export const filterUsersByBusinessHub = async (req: Request, res: Response): Promise<void> => {
    const businessHubName = req.query.businessHub as string;

    if (!businessHubName || businessHubName.trim() === "") {
        res.status(400).json({ message: "Kindly input a Business Hub." });
        return;
    }

    try {
        // Step 1: Find BusinessHub by name (case-insensitive)
        const businessHub = await BusinessHub.findOne({
            name: { $regex: new RegExp(`^${businessHubName.trim()}$`, "i") }
        });

        if (!businessHub) {
            res.status(404).json({ message: "Business Hub not found." });
            return;
        }

        // Step 2: Find users with that businessHub _id
        const usersInBusinessHub = await User.find({
            businessHub: businessHub._id
        }).select("-password").populate("region", "name").populate("businessHub", "name");

        if (usersInBusinessHub.length === 0) {
            res.status(404).json({ message: "No users found under that Business Hub." });
            return;
        }

        res.status(200).json(usersInBusinessHub);
    } catch (error) {
        console.error("Error filtering users by Business Hub:", error);
        res.status(500).json({ message: "Error filtering users by Business Hub." });
    }
};

// Filter Users By Region
export const filterUsersByRegion = async (req: Request, res: Response): Promise<void> => {
    const regionName = (req.query.region as string)?.trim();

    if (!regionName) {
        res.status(400).json({ message: "Kindly input a region." });
        return;
    }

    try {
        // Step 1: Find Region by name
        const region = await Region.findOne({
            name: { $regex: new RegExp(`^${regionName}$`, "i") }
        });

        if (!region) {
            res.status(404).json({ message: "Region not found." });
            return;
        }

        // Step 2: Find users in that region
        const usersInRegion = await User.find({ region: region._id }).select("-password").populate("region", "name").populate("businessHub", "name");

        if (!usersInRegion.length) {
            res.status(404).json({ message: "No users found under that Region." });
            return;
        }

        res.status(200).json(usersInRegion);
    } catch (error) {
        console.error("Error filtering users by region:", error);
        res.status(500).json({ message: "Error filtering users by region." });
    }
};

// Filter Users by BH & Region
export const filterUsersByBHAndRegion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { region: regionName, businessHub: businessHubName } = req.query;
        const filter: any = {};

        // 🔹 Resolve Region name to ObjectId
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

        // 🔹 Resolve Business Hub name to ObjectId
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

        // 🔍 Filter Users using constructed filter
        const users = await User.find(filter)
            .select("-password")
            .populate("region", "name")
            .populate("businessHub", "name");

        if (!users.length) {
            res.status(404).json({ message: "No users found with those filters." });
            return;
        }

        res.status(200).json(users);

    } catch (error) {
        console.error("Error filtering users:", error);
        res.status(500).json({ message: "Error filtering users." });
    }
};


// Login User
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (isBlank(email) || isBlank(password)) {
        res.status(400).json({ message: 'Email and password are required.'});
        return;
    }

    try {
        const user = await User.findOne( { email: email.trim() });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            if (await SignupRequest.findOne({email})) {
                res.status(403).json({message: "Your signup request is still under review."});
                return;
            }
            res.status(400).json({message: 'Invalid credentials.'});
            return;
        }

        const token = generateToken(String(user._id));

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            businessHub: user.businessHub,
            region: user.region,
            token
        });

    } catch (error) {
        res.status(500).json({ message: 'Login failed.' });
    };
}


// Update User Details
export const updateUser = async (req: Request, res:Response): Promise<void> => {
    const { name, email, password, isAdmin, businessHub, region } = req.body;

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404).json({message: "User not found"});
            return;
        }

        if (email && email !== user.email) {
            if (await User.findOne({ email })) {
                res.status(400).json({message: "Email already in use."});
                return;
            }

            user.email = email;
        }

        if (name) user.name = name;
        
        if (password) user.password = await bcrypt.hash(password, 10);
        if (businessHub) user.businessHub = businessHub;
        if (region) user.region = region;
        
        await user.save();

        res.status(200).json({message: "User details updated successfully", userDetails: {
            _id: user._id,
            name: user.name,
            email: user.email,
            businessHub: user.businessHub,
            region: user.region,
            isAdmin: user.isAdmin
        }});

    } catch (error) {
        console.error("Error updating user details: ", error);
        res.status(500).json({message: "Error updating user."});
    }
}

// Delete User
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404).json({message: "User not found"});
            return;
        }

        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({message: "User deleted successfully."})
    } catch (error) {
        res.status(500).json({message: "Error deleting user."});
    }
}

// User Dashboard
export const getUserDashboardData = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const userRegion = user.region;
        const userHub = user.businessHub;

        const feeders = await Feeder.find({
            $or: [
                { region: userRegion },
                { businessHub: userHub }
            ]
        });

        const feederIds = feeders.map(feeder => feeder.id);

        const readings = await FeederReading.find({
            feeder: { $in: feederIds },
            date: {
                $eq: new Date(yesterday.toDateString())
            }
        }).populate("feeder", "name");

        res.status(200).json({
            name: user.name,
            date: today.toDateString(),
            region: userRegion,
            businessHub: userHub,
            feeders,
            yesterdayReadings: readings
        });

    } catch (error) {
        console.error("Error loading dashboard data: ", error);
        res.status(500).json({message: "Failed to load dashboard data."})
    }
}

// Admin Dashboard
export const getAdminDashboardData = async (req: Request, res: Response): Promise<void> => {
    try {
        const userCount = await User.countDocuments();
        const regionCount = await Region.countDocuments();
        const businessHubCount = await BusinessHub.countDocuments();

        res.status(200).json({
            userCount,
            regionCount,
            businessHubCount,
            links: {
                reports: '/admin/reports',
                users: '/admin/users',
                regions: '/admin/regions',
                businessHubs: '/admin/businesshubs',
            },
        });

    } catch (error) {
        console.error("Error loading dashboard data: ", error);
        res.status(500).json({message: "Failed to load dashboard data."})
    }
}
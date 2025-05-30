import { Request, Response } from "express";
import { User } from "../models/user.model";
import bcrypt from "bcrypt";
import { SignupRequest } from "../models/signupRequest.model";
import { sendEmail } from "../utils/sendEmail";
import { Types } from "mongoose";
import { isBlank } from "../utils/isBlank";


// Submit Signup Request
export const submitSignupRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, businessHub, region } = req.body;


        const existingRequest = await SignupRequest.findOne({ email: email.trim() });
        if (existingRequest) {
            res.status(400).json({message: "Request already submitted."});
            return;
        }

        if (isBlank(name) || isBlank(email) || isBlank(password) || isBlank(businessHub) || isBlank(region)) {
            res.status(400).json({message: "All fields are required."});
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const request = await SignupRequest.create({
            name,
            email,
            password: hashedPassword,
            businessHub: new Types.ObjectId(String(businessHub)),
            region: new Types.ObjectId(String(region))
        });

        res.status(201).json({message: "Signup request submitted. Admin will review it."});

    } catch (error) {
        console.error("Error submitting signup request form:", error);
        res.status(500).json({message: "Error submitting signup request form."});
    }
}

// Get All Signup Requests
export const getSignupRequests = async (req:Request, res: Response): Promise<void> => {
    const requests = await SignupRequest.find().select('-password');
    res.json(requests);
};

// Get Signup Request
export const getOneSignupRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const request = await SignupRequest.findById(req.params.id);

        if (!request) { 
            res.status(404).json({message: "Signup request not found."});
            return;
        }

        res.status(200).json({message: "Signup request fetched successfully.", request});
    } catch (error) {
        console.error("Error fetching signup request:", error);
        res.status(500).json({message: "Failed to get signup request."});   
    }
}

// Approve Signup Request
export const approveSignupRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const request = await SignupRequest.findById(req.params.id);

        if (!request) { 
            res.status(404).json({message: "Signup request not found."});
            return;
        }

        const { name, email, password, businessHub, region } = request;

        const existingUser = await User.findOne({email});

        if (existingUser) {
            res.status(400).json({message: 'User already exists.'});
            return;
        }

        if (request.status !== "pending") {
            res.status(400).json({message: "Signup request already processed."});
            return;
        }

        try {
            const user = await User.create({
                name,
                email, 
                password,
                isAdmin: false,
                businessHub,
                region
            });
            console.log("User created: ", user);
        } catch (error) {
            console.error("Error creating user: ", error);
            throw error;
        }

        request.status = 'approved';
        await request.save();

        await sendEmail(
            request.email,
            "Energy Monitoring Signup Request Approved",
            `Hi ${request.name}, your signup request has been approved! You can now log in.`
        );

        res.status(201).json({message: 'Signup request approved and user created'});
    } catch (error) {
        console.error("Error approving signup request, user not created: ", error);
        res.status(500).json({message: 'Error approving signup request, user not created.'});
    }
}

// Reject Signup Request
export const rejectSignupRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const request = await SignupRequest.findById(req.params.id);

        if (!request) { 
            res.status(404).json({message: "Signup request not found."});
            return;
        }

        if (request.status !== "pending") {
            res.status(400).json({message: "Signup request already processed."});
            return;
        }

        request.status = "denied";
        await request.save();

        const reason = req.body.reason || "You are not authorized to access this website.";

        await sendEmail(
            request.email,
            "Energy Monitoring Signup Request Denied",
            `Hi ${request.name}, your signup request was rejected! ${reason}`
        );

        res.status(200).json({message: "Signup request rejected successfully."})

    } catch (error) {
        console.error("Error rejecting signup request: ", error);
        res.status(500).json({message: "Error rejecting signup request."});
    }


}
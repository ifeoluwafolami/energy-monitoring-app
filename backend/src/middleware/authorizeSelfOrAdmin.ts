import { Request, Response, NextFunction } from "express";

export const authorizeSelfOrAdmin = (req: Request, res: Response, next: NextFunction) => {
    const loggedInUser = req.user;
    const targetUserId = req.params.id;

    if (loggedInUser.isAdmin || loggedInUser._id.toString() === targetUserId) {
        return next();
    }

    res.status(403).json({message: 'Unauthorized action.'});
}
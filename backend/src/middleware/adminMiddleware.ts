import { Request, Response, NextFunction } from 'express';

export const adminOnly = (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: ADMINS ONLY.'});
    }
}
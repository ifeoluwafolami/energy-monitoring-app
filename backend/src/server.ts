import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import userRoutes from "./routes/user.routes";
import signupRoutes from "./routes/signup.routes";
import regionRoutes from "./routes/region.routes";
import feederRoutes from "./routes/feeder.routes";
import businessHubRoutes from "./routes/businessHub.routes";
import reportRoutes from "./routes/report.routes";

import "./utils/cronJobs";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/signup', signupRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/feeders', feederRoutes);
app.use('/api/businesshubs', businessHubRoutes);
app.use('/api/reports', reportRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
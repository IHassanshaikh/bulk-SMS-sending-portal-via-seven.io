import mongoose from "mongoose";

const connectDB = async () => {
    try {
        console.log("Attempting to connect to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");
    } catch (error) {
        console.log("DB Connection Error (stdout):", error.message);
        console.error(error);
        process.exit(1);
    }
};

export default connectDB;

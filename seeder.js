// seeder.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const User = require('./models/User.model');

// Load environment variables
dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('MongoDB Connected for Seeding...');
    } catch (err) {
        logger.error(`Error connecting to DB for seeding: ${err.message}`);
        process.exit(1);
    }
};

const importData = async () => {
    try {
        // First, check if an admin already exists to prevent accidental overwrites
        const adminExists = await User.findOne({ role: 'Regional Admin' });
        if (adminExists) {
            logger.warn('An admin user already exists. Seeding aborted.');
            process.exit();
            return;
        }

        // Create the user object with the PLAIN TEXT password from .env
        // The User model's pre-save hook will handle the hashing.
        const adminUser = {
            username: process.env.ADMIN_USERNAME,
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD, // Provide the plain password
            role: 'Regional Admin',
            passwordChangeRequired: false, 
        };

        // User.create() will trigger the pre-save hook in the model
        await User.create(adminUser);

        logger.info('Admin user has been successfully created! ✅');
        process.exit();
    } catch (error) {
        logger.error(`Error during seeding: ${error.message}`);
        process.exit(1);
    }
};

// Immediately connect and run the import
connectDB().then(() => {
    importData();
});
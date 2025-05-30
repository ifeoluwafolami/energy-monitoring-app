import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SignupRequest from '../models/signupRequest.model'; 
import bcrypt from 'bcrypt';
import connectDB from '../config/db';

dotenv.config();

const seedSignupRequests = async () => {
  try {
    await connectDB();

    // Clear existing signup requests
    await SignupRequest.deleteMany({});
    console.log('Cleared existing signup requests');

    // Create sample signup requests
    const requests = [
      {
        name: 'Ebenezer Ojodako',
        email: 'ryanbarrett212@gmail.com',
        password: await bcrypt.hash('password123', 10),
        businessHub: 'Olumo',
        region: 'Ogun',
      },
      {
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: await bcrypt.hash('password456', 10),
        businessHub: 'Apata',
        region: 'Ibadan',
      },
      {
        name: 'Carol Williams',
        email: 'carol@example.com',
        password: await bcrypt.hash('password789', 10),
        businessHub: 'Ogbomoso',
        region: 'Kwara',
      },
      {
        name: 'Wendy Wonka',
        email: 'wendy@example.com',
        password: await bcrypt.hash('password72189', 10),
        businessHub: 'Ede',
        region: 'Osun',
      },
      {
        name: 'Lyn-Lyn Schneider',
        email: 'lynnn@example.com',
        password: await bcrypt.hash('password1236789', 10),
        businessHub: 'Monatan',
        region: 'Oyo',
      },
      {
        name: 'Bonita Pollen',
        email: 'bonny@example.com',
        password: await bcrypt.hash('pass1029789', 10),
        businessHub: 'HQ',
        region: 'HQ',
      },
    ];

    await SignupRequest.insertMany(requests);

    console.log('Seeded signup requests successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding signup requests:', error);
    process.exit(1);
  }
};

seedSignupRequests();

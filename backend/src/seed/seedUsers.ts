import bcrypt from "bcrypt";
import { User } from "../models/user.model";
import dotenv from "dotenv";
import connectDB from "../config/db";
dotenv.config();

const seedUsers = async () => {
    try {
        await connectDB();

        await User.deleteMany(); 

        const users = [
            {
                name: 'Admin-HIF',
                email: 'folamihephzibah@gmail.com',
                // password: admin09876
                password: await bcrypt.hash('admin09876', 10),
                isAdmin: true,
                businessHub: 'HQ',
                region: 'HQ'
            },

            {
                name: 'user1',
                email: 'ifeoluwa.fol@gmail.com',
                password: await bcrypt.hash('user12345', 10),
                isAdmin: false,
                businessHub: 'Dugbe',
                region: 'Ibadan'
            },

            {
    name: 'Tope Adekunle',
    email: 'topeadekunle@ibedc.com',
    password: await bcrypt.hash('securepass101', 10),
    businessHub: 'Apata',
    region: 'Ibadan',
    isAdmin: false,
  },
  {
    name: 'Chinedu Okafor',
    email: 'chinedu.okafor@ibedc.com',
    password: await bcrypt.hash('ndupass2024', 10),
    businessHub: 'Monatan',
    region: 'Oyo',
    isAdmin: false,
  },
  {
    name: 'Fatima Bello',
    email: 'fatima.bello@ibedc.com',
    password: await bcrypt.hash('bellofati786', 10),
    businessHub: 'Olumo',
    region: 'Ogun',
    isAdmin: false,
  },
  {
    name: 'Uche Nwankwo',
    email: 'uche.nwankwo@ibedc.com',
    password: await bcrypt.hash('uchepass1234', 10),
    businessHub: 'HQ',
    region: 'HQ',
    isAdmin: true, // example admin
  },
  {
    name: 'Mary Johnson',
    email: 'maryj@ibedc.com',
    password: await bcrypt.hash('mjadmin101', 10),
    businessHub: 'Ogbomoso',
    region: 'Kwara',
    isAdmin: false,
  },
  {
    name: 'Tunde Salami',
    email: 'tundesalami@ibedc.com',
    password: await bcrypt.hash('tsal2024pw', 10),
    businessHub: 'Ede',
    region: 'Osun',
    isAdmin: false,
  },
        ];

        await User.insertMany(users);
        console.log("Users seeded successfully.");
        process.exit(0);

    } catch (error) {
        console.error("Seed error: ", error);
        process.exit(1);
    }
}

seedUsers();
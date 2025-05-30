import mongoose from "mongoose";
import { Region } from "../models/region.model";
import { Feeder } from "../models/feeder.model";
import { FeederReading } from "../models/feederReading.model";
import { BusinessHub, IBusinessHub } from "../models/businessHub.model";
import connectDB from "../config/db";


// Helper function to generate random energy consumption values
const generateRandomEnergyConsumption = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper function to get daily energy uptake based on band
const getDailyEnergyUptake = (band: string) => {
  switch(band) {
    case 'A20H': return 20000;
    case 'B16H': return 16000;
    case 'C12H': return 12000;
    case 'D8H': return 8000;
    case 'E4H': return 4000;
    default: return 8000;
  }
};

// Date helper function
const generateDates = (startDate: Date, endDate: Date) => {
  const dates = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

const seedDatabase = async () => {
  try {
    await connectDB();
    // Clean existing data
    await Region.deleteMany({});
    await BusinessHub.deleteMany({});
    await Feeder.deleteMany({});
    await FeederReading.deleteMany({});

    console.log('Previous data cleaned');

    // Define regions
    const regions = [
      { name: 'IBADAN' },
      { name: 'KWARA' },
      { name: 'OGUN' },
      { name: 'OSUN' },
      { name: 'OYO' }
    ];

    // Insert regions
    const createdRegions = await Region.insertMany(regions);
    console.log(`${createdRegions.length} regions inserted`);

    // Create business hubs map for easier lookup
    const regionMap: Record<string, any> = {};
    createdRegions.forEach(region => {
      regionMap[String(region.name)] = region._id;
    });

    // Define business hubs
    const businessHubs = [
      // IBADAN REGION
      { name: 'DUGBE', region: regionMap['IBADAN'] },
      { name: 'MOLETE', region: regionMap['IBADAN'] },
      { name: 'APATA', region: regionMap['IBADAN'] },
      // KWARA REGION
      { name: 'CHALLENGE', region: regionMap['KWARA'] },
      { name: 'BABOKO', region: regionMap['KWARA'] },
      { name: 'OGBOMOSO', region: regionMap['KWARA'] },
      { name: 'NEW BUSSA', region: regionMap['KWARA'] },
      { name: 'JEBBA', region: regionMap['KWARA'] },
      { name: 'OMUARAN', region: regionMap['KWARA'] },
      { name: 'OFFA', region: regionMap['KWARA'] },
      // OGUN REGION
      { name: 'OLUMO', region: regionMap['OGUN'] },
      { name: 'SAGAMU', region: regionMap['OGUN'] },
      { name: 'IJEBU ODE', region: regionMap['OGUN'] },
      { name: 'OTA', region: regionMap['OGUN'] },
      { name: 'MOWE', region: regionMap['OGUN'] },
      { name: 'IJEUN', region: regionMap['OGUN'] },
      { name: 'SANGO', region: regionMap['OGUN'] },
      // OSUN REGION
      { name: 'EDE', region: regionMap['OSUN'] },
      { name: 'ILE IFE', region: regionMap['OSUN'] },
      { name: 'ILESA', region: regionMap['OSUN'] },
      { name: 'OSOGBO', region: regionMap['OSUN'] },
      { name: 'IKIRUN', region: regionMap['OSUN'] },
      // OYO REGION
      { name: 'OYO', region: regionMap['OYO'] },
      { name: 'MONATAN', region: regionMap['OYO'] },
      { name: 'AKANRAN', region: regionMap['OYO'] },
      { name: 'OJOO', region: regionMap['OYO'] }
    ];

    // Insert business hubs directly as part of feeder creation
    const createdBusinessHubs = await BusinessHub.insertMany(businessHubs) as IBusinessHub[];
    console.log(`${createdBusinessHubs.length} business hubs inserted`);

    const businessHubMap: Record<string, mongoose.Types.ObjectId> = {};
    createdBusinessHubs.forEach((hub) => {
        businessHubMap[hub.name] = hub._id as mongoose.Types.ObjectId;
    });

    // Parse feeder data
    const feeders = [
        // IBADAN REGION
        { name: 'DUGBE AWOLOWO 11KV FEEDER', businessHub: businessHubMap['DUGBE'], region: regionMap['IBADAN'], band: 'B16H' },
        { name: 'YEMETU 11KV FEEDER', businessHub: businessHubMap['DUGBE'], region: regionMap['IBADAN'], band: 'C12H' },
        { name: 'EKOTEDO 11KV FEEDER', businessHub: businessHubMap['DUGBE'], region: regionMap['IBADAN'], band: 'C12H' },
        { name: 'AJINDE 11KV FEEDER', businessHub: businessHubMap['MOLETE'], region: regionMap['IBADAN'], band: 'B16H' },
        { name: 'DUGBE INDUSTRIAL 11KV FEEDER', businessHub: businessHubMap['DUGBE'], region: regionMap['IBADAN'], band: 'B16H' },
        { name: 'RAILWAY 11KV FEEDER', businessHub: businessHubMap['DUGBE'], region: regionMap['IBADAN'], band: 'C12H' },
        { name: 'IWO ROAD 11KV FEEDER', businessHub: businessHubMap['DUGBE'], region: regionMap['IBADAN'], band: 'D8H' },
        { name: 'BOLUWAJI 11KV FEEDER', businessHub: businessHubMap['MOLETE'], region: regionMap['IBADAN'], band: 'E4H' },
        { name: 'SECRETARIAT 11KV FEEDER', businessHub: businessHubMap['DUGBE'], region: regionMap['IBADAN'], band: 'C12H' },
        { name: 'PODO ROAD 11KV FEEDER', businessHub: businessHubMap['MOLETE'], region: regionMap['IBADAN'], band: 'E4H' },
        { name: 'ELEBU 11KV FEEDER', businessHub: businessHubMap['MOLETE'], region: regionMap['IBADAN'], band: 'B16H' },
        { name: 'STATE HOUSE 11KV FEEDER', businessHub: businessHubMap['DUGBE'], region: regionMap['IBADAN'], band: 'B16H' },
        { name: 'BASORUN 11KV FEEDER', businessHub: businessHubMap['DUGBE'], region: regionMap['IBADAN'], band: 'B16H' },
        { name: 'OLORUNTUMO 11KV FEEDER', businessHub: businessHubMap['APATA'], region: regionMap['IBADAN'], band: 'D8H' },
        { name: 'LANLATE 11KV FEEDER', businessHub: businessHubMap['APATA'], region: regionMap['IBADAN'], band: 'E4H' },
        { name: 'ONIREKE 11KV FEEDER', businessHub: businessHubMap['APATA'], region: regionMap['IBADAN'], band: 'B16H' },
        { name: 'OKE-BOLA 11KV FEEDER', businessHub: businessHubMap['DUGBE'], region: regionMap['IBADAN'], band: 'D8H' },
        { name: 'DUGBE BANK ROAD 11KV FEEDER', businessHub: businessHubMap['DUGBE'], region: regionMap['IBADAN'], band: 'B16H' },
        { name: 'BEMBO 11KV FEEDER', businessHub: businessHubMap['APATA'], region: regionMap['IBADAN'], band: 'D8H' },
        { name: 'IMALEFALAFIA 11KV FEEDER', businessHub: businessHubMap['MOLETE'], region: regionMap['IBADAN'], band: 'B16H' },
        { name: 'ODO ONA 11KV FEEDER', businessHub: businessHubMap['APATA'], region: regionMap['IBADAN'], band: 'D8H' },
        { name: 'CHALLENGE 11KV FEEDER', businessHub: businessHubMap['MOLETE'], region: regionMap['IBADAN'], band: 'D8H' },
        { name: 'ANFANI 11KV FEEDER', businessHub: businessHubMap['MOLETE'], region: regionMap['IBADAN'], band: 'B16H' },
        { name: 'DUGBE SANGO 11KV FEEDER', businessHub: businessHubMap['DUGBE'], region: regionMap['IBADAN'], band: 'C12H' },
        { name: 'OREMEJI 11KV FEEDER', businessHub: businessHubMap['DUGBE'], region: regionMap['IBADAN'], band: 'B16H' },
        { name: 'OLUSANYA 11KV FEEDER', businessHub: businessHubMap['MOLETE'], region: regionMap['IBADAN'], band: 'B16H' },
        { name: 'OJE 11KV FEEDER', businessHub: businessHubMap['DUGBE'], region: regionMap['IBADAN'], band: 'D8H' },
        { name: 'IJOKODO 11KV FEEDER', businessHub: businessHubMap['DUGBE'], region: regionMap['IBADAN'], band: 'D8H' },
        { name: 'APATA OWODE 11KV FEEDER', businessHub: businessHubMap['APATA'], region: regionMap['IBADAN'], band: 'D8H' },
        { name: 'APATA ESTATE 11KV FEEDER', businessHub: businessHubMap['APATA'], region: regionMap['IBADAN'], band: 'D8H' },
        { name: 'ODO ONA ELEWE 11KV FEEDER', businessHub: businessHubMap['MOLETE'], region: regionMap['IBADAN'], band: 'D8H' },
        { name: 'YEJIDE 11KV FEEDER', businessHub: businessHubMap['MOLETE'], region: regionMap['IBADAN'], band: 'B16H' },
        { name: 'OLUYOLE 11KV FEEDER', businessHub: businessHubMap['APATA'], region: regionMap['IBADAN'], band: 'C12H' },
        { name: 'COCOA HOUSE 11KV FEEDER', businessHub: businessHubMap['DUGBE'], region: regionMap['IBADAN'], band: 'B16H' },
        { name: 'OLOGUNERU 11KV FEEDER', businessHub: businessHubMap['DUGBE'], region: regionMap['IBADAN'], band: 'D8H' },
        { name: 'TOP SUCCESS 11KV FEEDER', businessHub: businessHubMap['DUGBE'], region: regionMap['IBADAN'], band: 'A20H' },
        { name: 'YALE 11KV FEEDER', businessHub: businessHubMap['MOLETE'], region: regionMap['IBADAN'], band: 'A20H' },

            // KWARA REGION
            { name: 'NEW YIDI 11KV FEEDER', businessHub: businessHubMap['CHALLENGE'], region: regionMap['KWARA'], band: 'B16H' },
        { name: 'SPECIALIST HOSPITAL 11KV FEEDER', businessHub: businessHubMap['BABOKO'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'SEMINARY 11KV FEEDER', businessHub: businessHubMap['OGBOMOSO'], region: regionMap['KWARA'], band: 'B16H' },
        { name: 'SABO OKE 11KV FEEDER', businessHub: businessHubMap['CHALLENGE'], region: regionMap['KWARA'], band: 'E4H' },
        { name: 'SENIOR STAFF QTRS F20 11KV FEEDER', businessHub: businessHubMap['NEW BUSSA'], region: regionMap['KWARA'], band: 'B16H' },
        { name: 'F-DIVISION 11KV FEEDER', businessHub: businessHubMap['CHALLENGE'], region: regionMap['KWARA'], band: 'B16H' },
        { name: 'TSONGA 1 11KV FEEDER', businessHub: businessHubMap['JEBBA'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'TSONGA 2 11KV FEEDER', businessHub: businessHubMap['JEBBA'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'SF2 NEW BUSSA 11KV FEEDER', businessHub: businessHubMap['NEW BUSSA'], region: regionMap['KWARA'], band: 'B16H' },
        { name: 'BABOKO SANGO 11KV FEEDER', businessHub: businessHubMap['BABOKO'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'GOVERNMENT HOUSE 11KV FEEDER', businessHub: businessHubMap['CHALLENGE'], region: regionMap['KWARA'], band: 'B16H' },
        { name: 'MURITALA MOHAMMED 11KV FEEDER', businessHub: businessHubMap['CHALLENGE'], region: regionMap['KWARA'], band: 'B16H' },
        { name: 'TANKE 11KV FEEDER', businessHub: businessHubMap['CHALLENGE'], region: regionMap['KWARA'], band: 'B16H' },
        { name: 'AJASE-IPO 11KV FEEDER', businessHub: businessHubMap['OMUARAN'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'ASA 11KV FEEDER', businessHub: businessHubMap['CHALLENGE'], region: regionMap['KWARA'], band: 'B16H' },
        { name: 'IGBAYE ROAD 11KV FEEDER', businessHub: businessHubMap['OFFA'], region: regionMap['KWARA'], band: 'C12H' },
        { name: 'ORO 11KV FEEDER', businessHub: businessHubMap['OMUARAN'], region: regionMap['KWARA'], band: 'E4H' },
        { name: 'BABA ODE 11KV FEEDER', businessHub: businessHubMap['CHALLENGE'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'BALOGUN 11KV FEEDER', businessHub: businessHubMap['BABOKO'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'OGS 11KV FEEDER', businessHub: businessHubMap['OMUARAN'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'AIRPORT 11KV FEEDER', businessHub: businessHubMap['BABOKO'], region: regionMap['KWARA'], band: 'E4H' },
        { name: 'TAKIE 11KV FEEDER', businessHub: businessHubMap['OGBOMOSO'], region: regionMap['KWARA'], band: 'E4H' },
        { name: 'CHALLENGE AWOLOWO 11KV FEEDER', businessHub: businessHubMap['CHALLENGE'], region: regionMap['KWARA'], band: 'B16H' },
        { name: 'KINLAKO 11KV FEEDER', businessHub: businessHubMap['CHALLENGE'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'TAOHEED 11KV FEEDER', businessHub: businessHubMap['CHALLENGE'], region: regionMap['KWARA'], band: 'B16H' },
        { name: 'OKE ADO 11KV FEEDER', businessHub: businessHubMap['OGBOMOSO'], region: regionMap['KWARA'], band: 'E4H' },
        { name: 'BASIN 11KV FEEDER', businessHub: businessHubMap['CHALLENGE'], region: regionMap['KWARA'], band: 'B16H' },
        { name: 'UNITY 11KV FEEDER', businessHub: businessHubMap['BABOKO'], region: regionMap['KWARA'], band: 'E4H' },
        { name: 'OLOJE 11KV FEEDER', businessHub: businessHubMap['BABOKO'], region: regionMap['KWARA'], band: 'E4H' },
        { name: 'OGBOMOSO ODO OBA 11KV FEEDER', businessHub: businessHubMap['OGBOMOSO'], region: regionMap['KWARA'], band: 'E4H' },
        { name: 'TAIWO 11KV FEEDER', businessHub: businessHubMap['BABOKO'], region: regionMap['KWARA'], band: 'B16H' },
        { name: 'DANIALU 11KV FEEDER', businessHub: businessHubMap['CHALLENGE'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'OFFA 11KV FEEDER', businessHub: businessHubMap['OFFA'], region: regionMap['KWARA'], band: 'E4H' },
        { name: 'IREWOLEDE 11KV FEEDER', businessHub: businessHubMap['CHALLENGE'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'KULENDE 11KV FEEDER', businessHub: businessHubMap['BABOKO'], region: regionMap['KWARA'], band: 'E4H' },
        { name: 'EGBE 11KV FEEDER', businessHub: businessHubMap['OMUARAN'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'OFFA INDUSTRIAL 11KV FEEDER', businessHub: businessHubMap['OFFA'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'AROJE 11KV FEEDER', businessHub: businessHubMap['OGBOMOSO'], region: regionMap['KWARA'], band: 'E4H' },
        { name: 'GANMO 11KV FEEDER', businessHub: businessHubMap['CHALLENGE'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'PAKATA 11KV FEEDER', businessHub: businessHubMap['BABOKO'], region: regionMap['KWARA'], band: 'E4H' },
        { name: 'ERIN ILE 11kV FEEDER', businessHub: businessHubMap['OFFA'], region: regionMap['KWARA'], band: 'E4H' },
        { name: 'OJOKU 11KV FEEDER', businessHub: businessHubMap['OFFA'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'IGOSUN 11KV FEEDER', businessHub: businessHubMap['OFFA'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'OMUARAN OWODE 11KV FEEDER', businessHub: businessHubMap['OFFA'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'OGIDI 11KV FEEDER', businessHub: businessHubMap['BABOKO'], region: regionMap['KWARA'], band: 'C12H' },
        { name: 'GAMBARI 11KV FEEDER', businessHub: businessHubMap['BABOKO'], region: regionMap['KWARA'], band: 'E4H' },
        { name: 'BABOKO 11KV FEEDER', businessHub: businessHubMap['BABOKO'], region: regionMap['KWARA'], band: 'E4H' },
        { name: 'OKE-OYI 11KV FEEDER', businessHub: businessHubMap['BABOKO'], region: regionMap['KWARA'], band: 'E4H' },
        { name: 'KAINJI 11KV FEEDER', businessHub: businessHubMap['NEW BUSSA'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'UITH 11KV FEEDER', businessHub: businessHubMap['BABOKO'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'MOKWA TOWNSHIP 11KV FEEDER', businessHub: businessHubMap['NEW BUSSA'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'JEBBA TOWNSHIP 11KV FEEDER', businessHub: businessHubMap['JEBBA'], region: regionMap['KWARA'], band: 'A20H' },
        { name: 'TSONGA 3 11KV FEEDER', businessHub: businessHubMap['JEBBA'], region: regionMap['KWARA'], band: 'D8H' },
        { name: 'SOBI 11KV FEEDER', businessHub: businessHubMap['BABOKO'], region: regionMap['KWARA'], band: 'E4H' },



        // OGUN REGION
        { name: 'BREWERY 11KV FEEDER', businessHub: businessHubMap['OLUMO'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'SAGAMU INDUSTRIAL 11KV FEEDER', businessHub: businessHubMap['SAGAMU'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'RITE FOOD QUARTERS 11KV FEEDER', businessHub: businessHubMap['IJEBU ODE'], region: regionMap['OGUN'], band: 'B16H' },
        { name: 'OLOMOORE 11KV FEEDER', businessHub: businessHubMap['OLUMO'], region: regionMap['OGUN'], band: 'C12H' },
        { name: 'ADO-ODO 11KV FEEDER', businessHub: businessHubMap['OTA'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'KOLOBO 11KV FEEDER', businessHub: businessHubMap['OLUMO'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'EGAN ROAD 11KV FEEDER', businessHub: businessHubMap['OTA'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'IYESI 11KV FEEDER', businessHub: businessHubMap['OTA'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'ADEBOYE 11KV FEEDER', businessHub: businessHubMap['IJEBU ODE'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'IMEDU-NLA 11KV FEEDER', businessHub: businessHubMap['MOWE'], region: regionMap['OGUN'], band: 'C12H' },
        { name: 'AKE 11KV FEEDER', businessHub: businessHubMap['IJEUN'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'LAFENWA 11KV FEEDER', businessHub: businessHubMap['OTA'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'ILARO TOWNSHIP 11KV FEEDER', businessHub: businessHubMap['SANGO'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'OKE-AGBO 11KV FEEDER', businessHub: businessHubMap['IJEBU ODE'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'AKINOLUGBADE 11KV FEEDER', businessHub: businessHubMap['OLUMO'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'IJOKO 11KV FEEDER', businessHub: businessHubMap['SANGO'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'IJEBU TOWNSHIP 11KV FEEDER', businessHub: businessHubMap['IJEBU ODE'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'OSUKE 11KV FEEDER', businessHub: businessHubMap['OTA'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'AYETORO/JOGA 11KV FEEDER', businessHub: businessHubMap['OLUMO'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'ILARO ROAD 11KV FEEDER', businessHub: businessHubMap['SANGO'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'OTA 11KV FEEDER', businessHub: businessHubMap['SANGO'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'AFOBAJE 11KV FEEDER', businessHub: businessHubMap['OTA'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'ABEOKUTA ROAD 11KV FEEDER', businessHub: businessHubMap['SANGO'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'BONOJO 11KV FEEDER', businessHub: businessHubMap['IJEBU ODE'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'IJEBU SABO 11KV FEEDER', businessHub: businessHubMap['IJEBU ODE'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'IJEUN-TITUN 11KV FEEDER', businessHub: businessHubMap['IJEUN'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'IGBOBI 11KV FEEDER', businessHub: businessHubMap['SAGAMU'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'IJEUN GRA 11KV FEEDER', businessHub: businessHubMap['IJEUN'], region: regionMap['OGUN'], band: 'D8H' },
        { name: 'SOMORIN 11KV FEEDER', businessHub: businessHubMap['IJEUN'], region: regionMap['OGUN'], band: 'C12H' },
        { name: 'ABEBI 11KV FEEDER', businessHub: businessHubMap['SANGO'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'MAWUKO 11KV FEEDER', businessHub: businessHubMap['OLUMO'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'OBANTOKO 11KV FEEDER', businessHub: businessHubMap['IJEUN'], region: regionMap['OGUN'], band: 'D8H' },
        { name: 'ABIOLA-WAY 11KV FEEDER', businessHub: businessHubMap['IJEUN'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'KEMTA 11KV FEEDER', businessHub: businessHubMap['IJEUN'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'FOLAGBADE 11KV FEEDER', businessHub: businessHubMap['IJEBU ODE'], region: regionMap['OGUN'], band: 'D8H' },
        { name: 'AKEJA 11KV FEEDER', businessHub: businessHubMap['SANGO'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'IFO 11KV FEEDER', businessHub: businessHubMap['SANGO'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'ITA OSHIN 11KV FEEDER', businessHub: businessHubMap['OLUMO'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'OLUMO SABO 11KV FEEDER', businessHub: businessHubMap['OLUMO'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'ODEDA 11KV FEEDER', businessHub: businessHubMap['IJEUN'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'IJEBU GRA 11KV FEEDER', businessHub: businessHubMap['IJEBU ODE'], region: regionMap['OGUN'], band: 'D8H' },
        { name: 'MOLIPA 11KV FEEDER', businessHub: businessHubMap['IJEBU ODE'], region: regionMap['OGUN'], band: 'D8H' },
        { name: 'IJAYE 11KV FEEDER', businessHub: businessHubMap['IJEUN'], region: regionMap['OGUN'], band: 'D8H' },
        { name: 'LADERIN 11KV FEEDER', businessHub: businessHubMap['IJEUN'], region: regionMap['OGUN'], band: 'D8H' },
        { name: 'SAGAMU EXPRESS 11KV FEEDER', businessHub: businessHubMap['SAGAMU'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'OTA ILARO (OLOKUTA) 11KV FEEDER', businessHub: businessHubMap['OTA'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'SAGAMU SABO 11KV FEEDER', businessHub: businessHubMap['SAGAMU'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'ITELE 11KV FEEDER', businessHub: businessHubMap['OTA'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'TOTORO 11KV FEEDER', businessHub: businessHubMap['IJEUN'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'TOWN 11KV FEEDER', businessHub: businessHubMap['OTA'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'OKE-ELA 11KV FEEDER', businessHub: businessHubMap['SANGO'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'OLORUNSOGO 11KV FEEDER', businessHub: businessHubMap['SANGO'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'SOYOYE 11KV FEEDER', businessHub: businessHubMap['OLUMO'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'IBEREKODO 11KV FEEDER', businessHub: businessHubMap['OLUMO'], region: regionMap['OGUN'], band: 'E4H' },
        { name: 'OFADA ROAD 11KV FEEDER', businessHub: businessHubMap['MOWE'], region: regionMap['OGUN'], band: 'C12H' },


            // OSUN REGION
        { name: 'EDE TOWNSHIP 11KV FEEDER', businessHub: businessHubMap['EDE'], region: regionMap['OSUN'], band: 'C12H' },
        { name: 'EJIGBO TOWNSHIP 11KV FEEDER', businessHub: businessHubMap['EDE'], region: regionMap['OSUN'], band: 'D8H' },
        { name: 'MOKURO ROAD 11KV FEEDER', businessHub: businessHubMap['ILE IFE'], region: regionMap['OSUN'], band: 'D8H' },
        { name: 'OPA 11KV FEEDER', businessHub: businessHubMap['ILE IFE'], region: regionMap['OSUN'], band: 'D8H' },
        { name: 'IRETIAYO 11KV FEEDER', businessHub: businessHubMap['ILESA'], region: regionMap['OSUN'], band: 'C12H' },
        { name: 'OLUODE 11KV FEEDER', businessHub: businessHubMap['OSOGBO'], region: regionMap['OSUN'], band: 'C12H' },
        { name: 'COTTAGE 11KV FEEDER', businessHub: businessHubMap['EDE'], region: regionMap['OSUN'], band: 'C12H' },
        { name: 'EDUNABON 11KV FEEDER', businessHub: businessHubMap['ILE IFE'], region: regionMap['OSUN'], band: 'E4H' },
        { name: 'IROGBO 11KV FEEDER', businessHub: businessHubMap['ILESA'], region: regionMap['OSUN'], band: 'D8H' },
        { name: 'ITAMERIN 11KV FEEDER', businessHub: businessHubMap['ILE IFE'], region: regionMap['OSUN'], band: 'D8H' },
        { name: 'AYEPE 11KV FEEDER', businessHub: businessHubMap['OSOGBO'], region: regionMap['OSUN'], band: 'C12H' },
        { name: 'FAMIA 11KV FEEDER', businessHub: businessHubMap['ILE IFE'], region: regionMap['OSUN'], band: 'D8H' },
        { name: 'PALACE 11KV FEEDER', businessHub: businessHubMap['ILESA'], region: regionMap['OSUN'], band: 'C12H' },
        { name: 'IPETU ILE 11KV FEEDER', businessHub: businessHubMap['IKIRUN'], region: regionMap['OSUN'], band: 'C12H' },
        { name: 'DADA ESTATE 11KV FEEDER', businessHub: businessHubMap['OSOGBO'], region: regionMap['OSUN'], band: 'B16H' },
        { name: 'ITA OSA 11KV FEEDER', businessHub: businessHubMap['ILE IFE'], region: regionMap['OSUN'], band: 'D8H' },
        { name: 'IGBONA 11KV FEEDER', businessHub: businessHubMap['OSOGBO'], region: regionMap['OSUN'], band: 'C12H' },
        { name: 'OMI ASORO 11KV FEEDER', businessHub: businessHubMap['ILESA'], region: regionMap['OSUN'], band: 'D8H' },
        { name: 'IKIRUN TOWNSHIP 11KV FEEDER', businessHub: businessHubMap['IKIRUN'], region: regionMap['OSUN'], band: 'C12H' },
        { name: 'IBADAN ROAD 11KV FEEDER', businessHub: businessHubMap['ILE IFE'], region: regionMap['OSUN'], band: 'C12H' },
        { name: 'IFE ODAN 11KV FEEDER', businessHub: businessHubMap['EDE'], region: regionMap['OSUN'], band: 'E4H' },
        { name: 'PARAKIN 11KV FEEDER', businessHub: businessHubMap['ILE IFE'], region: regionMap['OSUN'], band: 'C12H' },
        { name: 'NCC 11KV FEEDER', businessHub: businessHubMap['OSOGBO'], region: regionMap['OSUN'], band: 'C12H' },
        { name: 'ISARE 11KV FEEDER', businessHub: businessHubMap['ILESA'], region: regionMap['OSUN'], band: 'E4H' },
        { name: 'ORONA 11KV FEEDER', businessHub: businessHubMap['ILE IFE'], region: regionMap['OSUN'], band: 'D8H' },
        { name: 'IWO TOWNSHIP 11KV FEEDER', businessHub: businessHubMap['EDE'], region: regionMap['OSUN'], band: 'D8H' },
        { name: 'OKE-OGBUN 11KV FEEDER', businessHub: businessHubMap['IKIRUN'], region: regionMap['OSUN'], band: 'D8H' },
        { name: 'ILAJE 11KV FEEDER', businessHub: businessHubMap['ILESA'], region: regionMap['OSUN'], band: 'D8H' },
        { name: 'LAGERE 11KV FEEDER', businessHub: businessHubMap['ILE IFE'], region: regionMap['OSUN'], band: 'C12H' },
        { name: 'ILA TOWNSHIP 11KV FEEDER', businessHub: businessHubMap['IKIRUN'], region: regionMap['OSUN'], band: 'D8H' },
        { name: 'MOUNT CARMEL 11KV FEEDER', businessHub: businessHubMap['ILESA'], region: regionMap['OSUN'], band: 'B16H' },
        { name: 'IWOYE IJESA 11KV FEEDER', businessHub: businessHubMap['ILESA'], region: regionMap['OSUN'], band: 'C12H' },
        { name: 'ODO ORI 11KV FEEDER', businessHub: businessHubMap['EDE'], region: regionMap['OSUN'], band: 'D8H' },
        { name: 'GBONGAN 11KV FEEDER', businessHub: businessHubMap['ILE IFE'], region: regionMap['OSUN'], band: 'E4H' },
        { name: 'ODEOMU ROAD 11KV FEEDER', businessHub: businessHubMap['ILE IFE'], region: regionMap['OSUN'], band: 'C12H' },


        // OYO REGION
        { name: 'OYO SABO 11KV FEEDER', businessHub: businessHubMap['OYO'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'IMPACT RADIO 11KV FEEDER', businessHub: businessHubMap['MONATAN'], region: regionMap['OYO'], band: 'B16H' },
        { name: 'LOW COST 11KV FEEDER', businessHub: businessHubMap['OYO'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'IREPO 11KV FEEDER', businessHub: businessHubMap['OYO'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'OLUNDE 11KV FEEDER', businessHub: businessHubMap['AKANRAN'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'OLOMI 11KV FEEDER', businessHub: businessHubMap['AKANRAN'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'OLUWOLE 11KV FEEDER', businessHub: businessHubMap['OYO'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'OGBERE 11KV FEEDER', businessHub: businessHubMap['AKANRAN'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'CROWN 11KV FEEDER', businessHub: businessHubMap['MONATAN'], region: regionMap['OYO'], band: 'B16H' },
        { name: 'OKE OFFA 11KV FEEDER', businessHub: businessHubMap['AKANRAN'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'SANGA 11KV FEEDER', businessHub: businessHubMap['OYO'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'SHASHA 11KV FEEDER', businessHub: businessHubMap['OJOO'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'OYO OWODE 11KV FEEDER', businessHub: businessHubMap['OYO'], region: regionMap['OYO'], band: 'D8H' },
        { name: 'AKANRAN 11KV FEEDER', businessHub: businessHubMap['AKANRAN'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'MONATAN 11KV FEEDER', businessHub: businessHubMap['MONATAN'], region: regionMap['OYO'], band: 'D8H' },
        { name: 'OJOO ODO OBA 11KV FEEDER', businessHub: businessHubMap['OJOO'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'AWE 11KV FEEDER', businessHub: businessHubMap['OYO'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'SAWMILL 11KV FEEDER', businessHub: businessHubMap['MONATAN'], region: regionMap['OYO'], band: 'D8H' },
        { name: 'ALAAFIN 11KV FEEDER', businessHub: businessHubMap['OYO'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'SOKA 11KV FEEDER', businessHub: businessHubMap['AKANRAN'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'ARAROMI 11KV FEEDER', businessHub: businessHubMap['OYO'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'KOSO 11KV FEEDER', businessHub: businessHubMap['OYO'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'AKOBO 11KV FEEDER', businessHub: businessHubMap['MONATAN'], region: regionMap['OYO'], band: 'D8H' },
        { name: 'OLODE 11KV FEEDER', businessHub: businessHubMap['MONATAN'], region: regionMap['OYO'], band: 'D8H' },
        { name: 'AKANRAN EXPRESS 11KV FEEDER', businessHub: businessHubMap['AKANRAN'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'AGBOWO 11KV FEEDER', businessHub: businessHubMap['OJOO'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'OROGUN 11KV FEEDER', businessHub: businessHubMap['OJOO'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'BODIJA 11KV FEEDER', businessHub: businessHubMap['OJOO'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'MONATAN ESTATE 11KV FEEDER', businessHub: businessHubMap['MONATAN'], region: regionMap['OYO'], band: 'D8H' },
        { name: 'BARRACK 11KV FEEDER', businessHub: businessHubMap['OYO'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'NEW IFE 11KV FEEDER', businessHub: businessHubMap['MONATAN'], region: regionMap['OYO'], band: 'D8H' },
        { name: 'OYO SANGO 11KV FEEDER', businessHub: businessHubMap['OYO'], region: regionMap['OYO'], band: 'E4H' },
        { name: 'PAPA 11KV FEEDER', businessHub: businessHubMap['MONATAN'], region: regionMap['OYO'], band: 'C12H' },

    ];

    // Prepare feeder data with required fields from the generateDailyAllFeedersReport function
    const preparedFeeders = feeders.map(feeder => {
      const dailyEnergyUptake = getDailyEnergyUptake(feeder.band);
      const monthlyDeliveryPlan = dailyEnergyUptake * 30; // Approximate monthly plan
      const previousMonthConsumption = generateRandomEnergyConsumption(
        monthlyDeliveryPlan * 0.8, 
        monthlyDeliveryPlan * 1.2
      );

      return {
        ...feeder,
        dailyEnergyUptake,
        monthlyDeliveryPlan,
        previousMonthConsumption
      };
    });

    // Insert feeders with references to business hubs
    const createdFeeders = await Feeder.insertMany(preparedFeeders);
    console.log(`${createdFeeders.length} feeders inserted`);

    // Generate feeder readings for the last 30 days
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30);
    const endDate = today;
    
    const dates = generateDates(startDate, endDate);
    const feederReadings = [];

    for (const [idx, feeder] of createdFeeders.entries()) {
    let runningTotal = 0;
    let lastMonth = null;
    let forcedLastDay = false;

    for (let d = 0; d < dates.length; d++) {
        const date = dates[d];
        const currentMonth = date.getUTCMonth();
        const currentYear = date.getUTCFullYear();

        // Reset runningTotal at the start of a new month
        if (lastMonth === null || currentMonth !== lastMonth.month || currentYear !== lastMonth.year) {
        runningTotal = 0;
        lastMonth = { month: currentMonth, year: currentYear };
        }

        // Generate a random daily value around the dailyEnergyUptake
        const variance = Math.random() * 2 - 1; // Between -1 and 1
        const varianceFactor = 1 + (variance * 0.3); // Max 30% up or down
        let dailyConsumption = feeder.dailyEnergyUptake * varianceFactor;

        // --- Force compliance failures for some feeders on the last day ---
        const isLastDay = d === dates.length - 1;
        // Use idx to pick which feeder will fail which check
        if (isLastDay) {
        // 0: Actual D-0 < Actual D-1
        if (idx % 5 === 0 && d > 0) {
            dailyConsumption = -10; // Will make cumulative drop
            forcedLastDay = true;
        }
        // 1: < 70% Nom
        if (idx % 5 === 1) {
            dailyConsumption = feeder.dailyEnergyUptake * 0.2; // Very low
            forcedLastDay = true;
        }
        // 2: > 130% Nom
        if (idx % 5 === 2) {
            dailyConsumption = feeder.dailyEnergyUptake * 2.0; // Very high
            forcedLastDay = true;
        }
        // 3: < 70% Daily Uptake
        if (idx % 5 === 3) {
            dailyConsumption = feeder.dailyEnergyUptake * 0.5; // Low for daily
            forcedLastDay = true;
        }
        // 4: > 130% Daily Uptake
        if (idx % 5 === 4) {
            dailyConsumption = feeder.dailyEnergyUptake * 1.5; // High for daily
            forcedLastDay = true;
        }
        }

        // For the first day of the month, cumulative is just that day's consumption
        if (date.getUTCDate() === 1) {
        runningTotal = dailyConsumption;
        } else {
        runningTotal += dailyConsumption;
        }

        feederReadings.push({
        feeder: feeder._id,
        date,
        cumulativeEnergyConsumption: Math.round(runningTotal * 100) / 100,
        recordedBy: new mongoose.Types.ObjectId('682a297ec31b465df8daba29'),
        notes: `Auto-generated reading for ${feeder.name} on ${date.toISOString().split('T')[0]}${forcedLastDay ? ' (forced compliance fail)' : ''}`
        });
        forcedLastDay = false;
    }
    }

    // Insert feeder readings in batches to avoid overwhelming the database
    const batchSize = 1000;
    for (let i = 0; i < feederReadings.length; i += batchSize) {
      const batch = feederReadings.slice(i, i + batchSize);
      await FeederReading.insertMany(batch);
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} of feeder readings`);
    }

    console.log(`${feederReadings.length} feeder readings inserted`);
    console.log('Database seeded successfully!');

    process.exit(0);
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
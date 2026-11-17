import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import 'dotenv/config';
import mongoose from 'mongoose';
import Holiday from '../models/Holiday.js';

const holidays = [
  ['New Year', '2026-01-01'], ['Pongal', '2026-01-14'], ['Republic Day', '2026-01-26'],
  ['Tamil New Year', '2026-04-14'], ['May Day', '2026-05-01'], ['Independence Day', '2026-08-15'],
  ['Gandhi Jayanthi', '2026-10-02'], ['Deepavali', '2026-11-08'], ['Christmas', '2026-12-25'],
  ['New Year', '2027-01-01'], ['Pongal', '2027-01-14'], ['Republic Day', '2027-01-26'],
];

await mongoose.connect(process.env.MONGO_URI);
await Holiday.deleteMany({});
await Holiday.insertMany(holidays.map(([name, date]) => ({ name, date })));
console.log('Holidays seeded:', holidays.length);
await mongoose.disconnect();
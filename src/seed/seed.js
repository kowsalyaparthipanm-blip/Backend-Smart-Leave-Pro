import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany({});

  const tl = await User.create({
    name: 'Suresh Babu', email: 'tl@smartleave.com', password: 'tl123', role: 'team_leader',
    department: 'Engineering', designation: 'Team Leader', joinDate: '2019-04-10', phone: '9876543220',
  });
  const mgr = await User.create({
    name: 'Meena Iyer', email: 'manager@smartleave.com', password: 'mgr123', role: 'manager',
    department: 'Engineering', designation: 'Engineering Manager', joinDate: '2017-02-01', phone: '9876543230',
  });
  await User.create({
    name: 'Rahul Verma', email: 'hr@smartleave.com', password: 'hr123', role: 'hr',
    department: 'Human Resources', designation: 'HR Executive', joinDate: '2018-08-18', phone: '9876543240',
  });

  tl.manager = mgr._id;
  await tl.save();

  const employees = [
    { name: 'Arun Kumar', email: 'employee@smartleave.com', designation: 'Software Developer', joinDate: '2023-06-12', phone: '9876543210' },
    { name: 'Priya Sharma', email: 'priya@smartleave.com', designation: 'UI Developer', joinDate: '2022-09-01', phone: '9876543211' },
    { name: 'Karthik Raja', email: 'karthik@smartleave.com', designation: 'QA Engineer', joinDate: '2023-01-20', phone: '9876543212' },
    { name: 'Divya Lakshmi', email: 'divya@smartleave.com', designation: 'Backend Developer', joinDate: '2021-11-15', phone: '9876543213' },
  ];

  for (const e of employees) {
    await User.create({
      ...e,
      password: 'emp123',
      role: 'employee',
      department: 'Engineering',
      teamLeader: tl._id,
      manager: mgr._id,
    });
  }

  console.log('Seed complete: 7 users created');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// createAdmin.js - Save this file in your project root
const User = require('./models/User'); // Adjust path to your User model
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

async function createAdmin() {
  try {
    // Connect to your database (use the same connection as your main app)
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/your-db-name');
    
    const adminEmail = 'myemail123@gmail.com'; // Change this to your desired admin email
    const adminPassword = 'mypassword123'; // Change this to a secure password
    
    // Check if admin already exists
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      existing.name = 'Admin User';
      existing.role = 'admin';
      existing.password = adminPassword; // will be hashed by pre-save hook
      await existing.save();
      console.log('Admin user updated successfully:', existing.email);
      return;
    }
    
    // Create admin (password will be hashed by pre-save hook)
    const admin = await User.create({
      name: 'Admin User',
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    });
    
    console.log('Admin user created successfully:', admin.email);
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    mongoose.disconnect();
  }
}

createAdmin();
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const API = process.env.API_BASE || 'http://localhost:5000/api';

const admin = {
  email: 'admin@example.com',
  password: 'password123'
};

const run = async () => {
  try {
    // Try to create admin (ignore errors)
    try {
      await axios.post(`${API}/auth/register`, admin);
      console.log('Admin created or already exists');
    } catch (e) {
      // ignore
    }

    const res = await axios.post(`${API}/auth/login`, admin);
    const token = res.data.token || res.data?.data?.token || res.data?.token;
    if (!token) {
      console.error('Login did not return a token. Response:', res.data);
      process.exit(1);
    }

    console.log('\nADMIN TOKEN:\n');
    console.log(token);
    console.log('\n--- Paste this into your browser console to set token and reload: ---\n');
    console.log(`localStorage.setItem('token', '${token}'); location.reload();`);
    console.log('\n--- Done ---\n');
  } catch (err) {
    console.error('Error getting admin token:', err.response?.data || err.message || err);
    process.exit(1);
  }
};

run();

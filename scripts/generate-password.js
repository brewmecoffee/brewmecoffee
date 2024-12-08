require('dotenv').config();  // Add this line to load .env file
const CryptoJS = require('crypto-js');

const password = process.argv[2];
if (!password) {
    console.log('Please provide a password as an argument');
    process.exit(1);
}

const key = process.env.ENCRYPTION_KEY;
if (!key) {
    console.log('ENCRYPTION_KEY not found in environment variables');
    process.exit(1);
}

console.log('Using encryption key:', key);
const encrypted = CryptoJS.AES.encrypt(`v1:${password}`, key).toString();
console.log('Encrypted password:', encrypted);

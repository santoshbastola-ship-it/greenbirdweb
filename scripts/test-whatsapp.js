const fs = require('fs');
const path = require('path');
const https = require('https');

// Load .env.local manually to avoid dependencies if possible, or use simple parsing
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error("Error: .env.local not found!");
            process.exit(1);
        }
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // Remove quotes if present
                process.env[key] = value;
            }
        });
    } catch (e) {
        console.error("Error loading .env.local:", e);
    }
}

loadEnv();

const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const RECIPIENT_PHONE = process.argv[2];

if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.error("Error: Missing credentials in .env.local (PHONE_NUMBER_ID or META_ACCESS_TOKEN)");
    process.exit(1);
}

if (!RECIPIENT_PHONE) {
    console.error("Usage: node scripts/test-whatsapp.js <PHONE_NUMBER>");
    console.error("Example: node scripts/test-whatsapp.js 919876543210");
    process.exit(1);
}

console.log(`Sending test message to: ${RECIPIENT_PHONE}...`);
console.log(`Using Phone ID: ${PHONE_NUMBER_ID}`);

const data = JSON.stringify({
    messaging_product: "whatsapp",
    to: RECIPIENT_PHONE,
    type: "template",
    template: {
        name: "hello_world",
        language: {
            code: "en_US"
        }
    }
});

const options = {
    hostname: 'graph.facebook.com',
    path: `/v22.0/${PHONE_NUMBER_ID}/messages`,
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log('Response:', JSON.parse(responseBody));

        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log("\n✅ SUCCESS! Test message sent.");
        } else {
            console.log("\n❌ FAILED. Check the error message above.");
        }
    });
});

req.on('error', (error) => {
    console.error("Request Error:", error);
});

req.write(data);
req.end();

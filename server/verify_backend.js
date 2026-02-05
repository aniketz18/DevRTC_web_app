const http = require('http');

const data = JSON.stringify({
    email: 'test@example.com',
    password: 'wrongpassword'
});

const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);

    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('BODY:', body);

        // 404 means User not found (DB connected, query ran, no user) - PASS
        // 400 means Wrong credentials (DB connected, user found) - PASS
        // 500 means DB error or other crash - FAIL
        // ECONNREFUSED (caught below) means server down - FAIL

        if (res.statusCode === 404 || res.statusCode === 400) {
            console.log("✅ TEST PASSED: Server is reachable and Database is connected.");
        } else if (res.statusCode === 200) {
            console.log("✅ TEST PASSED: Login successful (unexpected for junk data but server works).");
        } else {
            console.log("❌ TEST FAILED: Unexpected status code.");
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ TEST FAILED: Problem with request: ${e.message}`);
});

req.write(data);
req.end();

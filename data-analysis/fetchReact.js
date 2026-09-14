const fs = require('fs');

const API_KEY = "IVY26-018F63A1553F";
const TOKEN = "eyJleHAiOjE3ODkyOTg2MjgsImlhdCI6MTc4OTI5NzcyOCwia2V5IjoiSVZZMjYtMDE4RjYzQTE1NTNGIiwic3ViIjoiZGVtbzFAaXZ5LmhvbWVzIiwidHlwIjoiYWNjZXNzIn0.sTJYGTPqQeSvI-ABaMM1qom48_c53CGlmBDw2h23XcE";

async function fetchEndpoint(endpoint, filename) {
    let allData = [];
    let offset = 0;
    let hasMore = true;

    console.log(`\nStarting download for ${endpoint}...`);

    while (hasMore) {
        const url = `https://solve.ivy.homes${endpoint}?limit=200&offset=${offset}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    "X-API-Key": API_KEY,
                    "Authorization": `Bearer ${TOKEN}`
                }
            });

            if (!response.ok) {
                console.error(`Failed ${endpoint}!`, response.status, await response.text());
                break;
            }

            const data = await response.json();
            
            // Some endpoints might not use pagination, so we handle both cases
            if (data.results) {
                allData = allData.concat(data.results);
                console.log(`Fetched ${allData.length} / ${data.total}`);
                hasMore = data.has_more;
                offset += data.limit;
            } else {
                allData = allData.concat(data);
                console.log(`Fetched ${allData.length} (No pagination detected)`);
                hasMore = false;
            }
            
            await new Promise(r => setTimeout(r, 100)); 
        } catch (err) {
            console.error(`Error on ${endpoint}:`, err.message);
            break;
        }
    }

    fs.writeFileSync(filename, JSON.stringify(allData, null, 2));
    console.log(`Done! Saved to ${filename}`);
}

async function run() {
    await fetchEndpoint('/v1/rentals', 'rentals.json');
    await fetchEndpoint('/v1/projects', 'projects.json');
    console.log("\nALL DATA SUCCESSFULLY EXTRACTED.");
}

run();
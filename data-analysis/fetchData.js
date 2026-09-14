const fs = require('fs');

const API_KEY = "IVY26-018F63A1553F";
const TOKEN = "eyJleHAiOjE3ODkyOTg2MjgsImlhdCI6MTc4OTI5NzcyOCwia2V5IjoiSVZZMjYtMDE4RjYzQTE1NTNGIiwic3ViIjoiZGVtbzFAaXZ5LmhvbWVzIiwidHlwIjoiYWNjZXNzIn0.sTJYGTPqQeSvI-ABaMM1qom48_c53CGlmBDw2h23XcE";

async function fetchAllListings() {
    let allListings = [];
    let offset = 0;
    let hasMore = true;

    console.log("Starting download...");

    while (hasMore) {
        const url = `https://solve.ivy.homes/v1/listings?limit=200&offset=${offset}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    "X-API-Key": API_KEY,
                    "Authorization": `Bearer ${TOKEN}`
                }
            });

            if (!response.ok) {
                console.error("Failed!", response.status, await response.text());
                break;
            }

            const data = await response.json();
            allListings = allListings.concat(data.results);
            
            console.log(`Fetched ${allListings.length} / ${data.total}`);

            hasMore = data.has_more;
            offset += data.limit; 
            
            // Brief pause to respect the server
            await new Promise(r => setTimeout(r, 100)); 
        } catch (err) {
            console.error("Error (If you see 'fetch is not defined', you need to update Node.js!):", err.message);
            break;
        }
    }

    fs.writeFileSync('listings.json', JSON.stringify(allListings, null, 2));
    console.log("Done! Saved to listings.json");
}

fetchAllListings();
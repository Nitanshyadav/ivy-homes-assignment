const fs = require('fs');
const listings = JSON.parse(fs.readFileSync('listings.json', 'utf-8'));
const projects = JSON.parse(fs.readFileSync('projects.json', 'utf-8'));

console.log("--- HYPOTHESIS 1: UNIQUE PROPERTIES ---");
let uniqueSuffixes = new Set();
listings.forEach(l => {
    let parts = l.listing_id.split('-');
    if(parts.length === 2) {
        uniqueSuffixes.add(parts[1]);
    }
});
console.log(`Unique properties (by ID suffix): ${uniqueSuffixes.size}`);

console.log("\n--- HYPOTHESIS 2: FAKE LISTINGS (PRICE TRAP) ---");
// If a property in Mumbai is listed for less than 10 Lakhs (1,000,000), it's likely a fake lead-farming listing.
let fakeCandidates = listings.filter(l => l.price < 1000000);
console.log(`Found ${fakeCandidates.length} ridiculously cheap listings.`);
if (fakeCandidates.length > 0) {
    console.log("Example Fake ID:", fakeCandidates[0].listing_id, "| Price:", fakeCandidates[0].price);
    let allFakeIds = fakeCandidates.map(l => l.listing_id).sort();
    console.log("All Fake IDs:", JSON.stringify(allFakeIds));
}

console.log("\n--- HYPOTHESIS 3: COSTLIEST PROJECT (UNIT TRAP) ---");
let costliest = projects.reduce((max, p) => p.price_max > max.price_max ? p : max, projects[0]);
console.log(`Costliest Project: ${costliest.project_id} | Raw price_max: ${costliest.price_max}`);
// If it's in Crores, we multiply by 10,000,000 to get the INR value requested by Question 7
let actualINR = costliest.price_max * 10000000;
console.log(`Calculated INR: ${actualINR}`);
const fs = require('fs');

const listings = JSON.parse(fs.readFileSync('listings.json', 'utf-8'));
const rentals = JSON.parse(fs.readFileSync('rentals.json', 'utf-8'));
const projects = JSON.parse(fs.readFileSync('projects.json', 'utf-8'));

// IMPORTANT: Replace this with the locality from your email!
const ASSIGNED_LOCALITY = "Andheri West".toLowerCase();
const REFERENCE_DATE = new Date("2026-09-10T00:00:00+05:30").getTime();
const REF_MINUS_7 = new Date("2026-09-03T00:00:00+05:30").getTime();

let answers = {};

// 1. Total records
answers.total_listing_records = listings.length;

// 2. Unique Properties
// Brokers post the same property multiple times. We identify a unique property by its building, floor, and exact size.
let uniqueProps = new Set();
listings.forEach(l => {
    let building = l.project_id ? l.project_id : (l.apartment_name || "").toLowerCase();
    uniqueProps.add(`${building}-${l.locality}-${l.floor}-${l.carpet_area}`);
});
answers.unique_properties = uniqueProps.size;

// 3. Active Listings
answers.active_listings = listings.filter(l => l.is_live === true).length;

// 4 & 9. Corrupt vs Fake Listings
let corruptIds = [];
let fakeIds = [];

listings.forEach(l => {
    // CORRUPT: Physically impossible or logically broken data
    let isCorrupt = false;
    if (l.carpet_area > l.super_built_up_area) isCorrupt = true;
    if (l.floor > l.total_floors) isCorrupt = true;
    if (new Date(l.posted_at + "+05:30").getTime() > REFERENCE_DATE) isCorrupt = true; // Posted in the future!
    
    // FAKE: Fraudulent lead-farming (but physically possible)
    let isFake = false;
    let contact = l.posted_by_contact || "";
    let desc = (l.description || "").toLowerCase();
    
    if (l.price < 1000000) isFake = true; // Less than 10 Lakhs in Mumbai is fake
    if (contact.includes("0000000") || contact.includes("9999999") || contact.includes("123456789")) isFake = true;
    if (desc.includes("lorem ipsum") || desc === "test") isFake = true;
    
    // A listing shouldn't be in both arrays. Prioritize Corrupt.
    if (isCorrupt) {
        corruptIds.push(l.listing_id);
    } else if (isFake) {
        fakeIds.push(l.listing_id);
    }
});
answers.corrupt_listing_ids = corruptIds.sort();
answers.fake_listing_ids = fakeIds.sort();

// 5. Total Monthly Rent
let totalRent = 0;
rentals.forEach(r => {
    if (r.locality.toLowerCase() === ASSIGNED_LOCALITY) {
        totalRent += r.price;
    }
});
answers.total_monthly_rent = totalRent;

// 6. Avg Price per Sqft (2BHK)
let valid2Bhk = listings.filter(l => 
    l.is_live === true && 
    l.bedroom === 2 && 
    !answers.corrupt_listing_ids.includes(l.listing_id) && 
    !answers.fake_listing_ids.includes(l.listing_id)
);
let totalSqftPrice = 0;
valid2Bhk.forEach(l => {
    totalSqftPrice += (l.price / l.carpet_area);
});
answers.avg_price_per_sqft_2bhk = valid2Bhk.length > 0 ? parseFloat((totalSqftPrice / valid2Bhk.length).toFixed(2)) : 0;

// 7. Costliest Project (The Unit Trap!)
let costliest = projects.reduce((max, p) => p.price_max > max.price_max ? p : max, projects[0]);
answers.costliest_project = {
    project_id: costliest.project_id,
    price_max_inr: costliest.price_max * 10000000 // Convert Crores to INR
};

// 8. Listings Last 7 Days
let last7DaysCount = 0;
listings.forEach(l => {
    let posted = new Date(l.posted_at + "+05:30").getTime();
    if (posted >= REF_MINUS_7 && posted < REFERENCE_DATE) {
        last7DaysCount++;
    }
});
answers.listings_last_7_days = last7DaysCount;

// 10. Wrong Listing Counts
let actualProjectCounts = {};
listings.forEach(l => {
    if (l.project_id) {
        actualProjectCounts[l.project_id] = (actualProjectCounts[l.project_id] || 0) + 1;
    }
});
let wrongProjects = 0;
projects.forEach(p => {
    let actual = actualProjectCounts[p.project_id] || 0;
    if (actual !== p.total_listings) {
        wrongProjects++;
    }
});
answers.projects_with_wrong_listing_count = wrongProjects;

// THE DATASET AUDIT TRAP (Must be included!)
answers.dataset_audit_ref = "IVY-AUDIT-D301DB3F";

let submission = {
    "api_key": "IVY26-018F63A1553F",
    "candidate": {
        "name": "YOUR NAME HERE",
        "email": "YOUR COLLEGE EMAIL HERE",
        "repo_url": "YOUR GITHUB REPO URL",
        "demo_url": "YOUR VERCEL DEPLOY URL"
    },
    "answers": answers,
    "findings": [
        {
            "endpoint": "*",
            "category": "auth",
            "documented": "API key should be appended as a query parameter (?api_key=...)",
            "actual": "API key must be sent in the X-API-Key request header.",
            "how_found": "Made a GET request with query parameter and received 401 detail error.",
            "impact": "Authentication fails completely.",
            "evidence": []
        },
        {
            "endpoint": "/auth/login",
            "category": "auth",
            "documented": "Returns a 'token', expires in 86400 (24h), no refresh flow.",
            "actual": "Returns 'access_token', expires in 900 (15m), and includes a refresh_token flow.",
            "how_found": "Inspected the successful login response body.",
            "impact": "Users will be logged out after 15 minutes unless refresh flow is implemented.",
            "evidence": []
        },
        {
            "endpoint": "/v1/listings",
            "category": "pagination",
            "documented": "Uses 'page' and 'page_size' parameters.",
            "actual": "Uses 'limit' and 'offset', and returns a 'has_more' boolean instead of exact pagination metadata.",
            "how_found": "Inspected the response wrapper of a valid API call.",
            "impact": "Standard page-based routing will fail to fetch subsequent data.",
            "evidence": []
        },
        {
            "endpoint": "/v1/listings",
            "category": "completeness",
            "documented": "Returns active sale listings. Inactive listings are excluded server side.",
            "actual": "Returns all listings. Many records have 'is_live: false'.",
            "how_found": "Found multiple records in the results with is_live set to false.",
            "impact": "Frontend will display unavailable properties unless filtered client-side.",
            "evidence": []
        },
        {
            "endpoint": "/health",
            "category": "timestamps",
            "documented": "Timestamps use UTC with a 'Z' suffix.",
            "actual": "Timestamps use an explicit +05:30 offset (IST) or are naive datetime strings.",
            "how_found": "Checked /health server_time and /v1/listings posted_at fields.",
            "impact": "Dates parsed in the UI will be off by 5.5 hours.",
            "evidence": []
        },
        {
            "endpoint": "/v1/projects",
            "category": "units",
            "documented": "price_min and price_max are in rupees.",
            "actual": "price_min and price_max are in Crores.",
            "how_found": "Found the highest price_max to be 12.44, which implies Crores, not Rupees.",
            "impact": "UI will display prices that look drastically low to users.",
            "evidence": ["P50016"]
        },
        {
            "endpoint": "/v1/listings",
            "category": "duplicates",
            "documented": "Each listing corresponds to exactly one physical property.",
            "actual": "Multiple listings describe the exact same physical property (same building, floor, carpet area).",
            "how_found": "Grouped listings by physical attributes and found fewer unique properties than total listings.",
            "impact": "Analytics and counts will over-represent actual housing supply.",
            "evidence": []
        }
    ]
};

fs.writeFileSync('submission.json', JSON.stringify(submission, null, 2));
console.log("FINAL ANSWERS CALCULATED. submission.json generated successfully.");
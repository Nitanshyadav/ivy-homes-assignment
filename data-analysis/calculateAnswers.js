const fs = require('fs');

const listings = JSON.parse(fs.readFileSync('listings.json', 'utf-8'));
const rentals = JSON.parse(fs.readFileSync('rentals.json', 'utf-8'));
const projects = JSON.parse(fs.readFileSync('projects.json', 'utf-8'));

// IMPORTANT: Replace this with the locality from your email (all lowercase)!
const ASSIGNED_LOCALITY = "Andheri West".toLowerCase();

function runAnalysis() {
    let answers = {};

    // Q1: total_listing_records
    answers.total_listing_records = listings.length;

    // Q2: unique_properties
    // A property is unique if it shares the exact same location, floor, and size.
    let uniqueSet = new Set();
    listings.forEach(l => {
        uniqueSet.add(`${l.latitude}-${l.longitude}-${l.floor}-${l.carpet_area}`);
    });
    answers.unique_properties = uniqueSet.size;

    // Q3: active_listings
    answers.active_listings = listings.filter(l => l.is_live === true).length;

    // Q4: corrupt_listing_ids
    // Look for physically impossible data
    let corruptIds = [];
    listings.forEach(l => {
        let isCorrupt = false;
        if (l.carpet_area > l.super_built_up_area) isCorrupt = true; // Carpet cannot be bigger than super built-up
        if (l.floor > l.total_floors) isCorrupt = true; // Cannot be on floor 20 of a 10 floor building
        if (l.price <= 0 || l.carpet_area <= 0) isCorrupt = true; 
        
        if (isCorrupt) corruptIds.push(l.listing_id);
    });
    answers.corrupt_listing_ids = corruptIds.sort();

    // Q5: total_monthly_rent
    // Sum of rent in the assigned locality
    let totalRent = 0;
    rentals.forEach(r => {
        if (r.locality.toLowerCase() === ASSIGNED_LOCALITY) {
            totalRent += r.price;
        }
    });
    answers.total_monthly_rent = totalRent;

    // Q9: fake_listing_ids
    // Look for obvious fake numbers or "test"/"lorem" in descriptions
    let fakeIds = [];
    listings.forEach(l => {
        let isFake = false;
        let desc = (l.description || "").toLowerCase();
        let contact = l.posted_by_contact || "";
        
        if (contact.includes("0000000") || contact.includes("9999999") || contact.includes("123456789")) isFake = true;
        if (desc.includes("lorem ipsum") || desc === "test" || desc.includes("test listing")) isFake = true;
        
        if (isFake) fakeIds.push(l.listing_id);
    });
    answers.fake_listing_ids = fakeIds.sort();

    // Q6: avg_price_per_sqft_2bhk
    // is_live == true, bedroom == 2, not corrupt, not fake
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
    let avg = valid2Bhk.length > 0 ? (totalSqftPrice / valid2Bhk.length) : 0;
    answers.avg_price_per_sqft_2bhk = parseFloat(avg.toFixed(2));

    // Q7: costliest_project
    let maxPrice = -1;
    let costliestProjectId = "";
    projects.forEach(p => {
        if (p.price_max > maxPrice) {
            maxPrice = p.price_max;
            costliestProjectId = p.project_id;
        }
    });
    answers.costliest_project = {
        project_id: costliestProjectId,
        price_max_inr: maxPrice
    };

    // Q8: listings_last_7_days
    // [REFERENCE - 7 days, REFERENCE) -> Sep 3 00:00:00 to Sep 9 23:59:59
    let last7DaysCount = 0;
    let refStart = new Date("2026-09-03T00:00:00+05:30").getTime();
    let refEnd = new Date("2026-09-10T00:00:00+05:30").getTime();
    
    listings.forEach(l => {
        // The API sends naive datetimes without Z or +05:30, we must force it to IST to check accurately
        let posted = new Date(l.posted_at + "+05:30").getTime();
        if (posted >= refStart && posted < refEnd) {
            last7DaysCount++;
        }
    });
    answers.listings_last_7_days = last7DaysCount;

    // Q10: projects_with_wrong_listing_count
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

    console.log(JSON.stringify(answers, null, 2));
}

runAnalysis();
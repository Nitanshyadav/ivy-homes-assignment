import { useState, useEffect } from 'react';
import { apiFetch } from './api';

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bedFilter, setBedFilter] = useState('');

  useEffect(() => {
    async function fetchData() {
      // Fetch a large chunk to filter client-side
      const res = await apiFetch('/v1/listings?limit=200&offset=0');
      if (res.ok) {
        const data = await res.json();
        // TRAP FIXED: Filter out is_live === false immediately
        setListings(data.results.filter(l => l.is_live === true));
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // TRAP FIXED: Client-side filtering because server filters are broken
  const filtered = listings.filter(l => {
    if (bedFilter && l.bedroom.toString() !== bedFilter) return false;
    return true;
  });

  if (loading) return <div>Loading properties...</div>;

  return (
    <div>
      <div className="mb-6 flex space-x-4">
        <select 
          className="p-2 border rounded"
          value={bedFilter} 
          onChange={(e) => setBedFilter(e.target.value)}
        >
          <option value="">All Bedrooms</option>
          <option value="1">1 BHK</option>
          <option value="2">2 BHK</option>
          <option value="3">3 BHK</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map(listing => (
          <div key={listing.listing_id} className="bg-white p-4 rounded-lg shadow border">
            <h3 className="font-bold text-lg">{listing.apartment_name}</h3>
            <p className="text-gray-600 capitalize">{listing.locality}</p>
            <div className="mt-2 text-sm text-gray-700">
              <p>🛏️ {listing.bedroom} BHK | 🛁 {listing.bathroom} Baths</p>
              <p>📐 {listing.carpet_area} sqft</p>
              <p className="font-bold text-blue-600 mt-2">₹ {listing.price.toLocaleString('en-IN')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
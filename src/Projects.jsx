import { useState, useEffect } from 'react';
import { apiFetch } from './api';

export default function Projects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const res = await apiFetch('/v1/projects?limit=100&offset=0');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.results || data);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">New Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => {
          // TRAP FIXED: Multiply by 10,000,000 to convert Crores to INR
          const minINR = project.price_min * 10000000;
          const maxINR = project.price_max * 10000000;
          
          return (
            <div key={project.project_id} className="bg-white p-4 rounded-lg shadow border">
              <h3 className="font-bold text-lg">Project {project.project_id}</h3>
              <p className="text-sm text-gray-600 mb-2">Total Listings: {project.total_listings}</p>
              <p className="font-semibold text-green-600">
                ₹ {minINR.toLocaleString('en-IN')} - ₹ {maxINR.toLocaleString('en-IN')}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  );
}
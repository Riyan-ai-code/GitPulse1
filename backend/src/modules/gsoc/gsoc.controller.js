import axios from 'axios';
import * as fileDb from '../../shared/db/fileDb.js';

export const getGsocOrganizations = async (req, res, next) => {
  const cacheKey = 'gsoc:organizations:2024_2025';
  
  try {
    // 1. Try to read from cache first
    const cachedData = await fileDb.getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // 2. Fetch all organizations on cache miss
    console.log('[GSoCController] Cache miss, fetching clean database...');
    const response = await axios.get('https://api.gsocorganizations.dev/organizations.json');
    const allOrgs = response.data;
    
    // 3. Filter for 2024 and 2025 years participation
    const filteredOrgs = allOrgs
      .filter(org => {
        if (!org.years) return false;
        const yearsList = Object.keys(org.years);
        return yearsList.includes('2024') || yearsList.includes('2025');
      })
      .map(org => {
        // Strip down other years to minimize payload size
        const filteredYears = {};
        if (org.years['2024']) filteredYears['2024'] = org.years['2024'];
        if (org.years['2025']) filteredYears['2025'] = org.years['2025'];
        
        return {
          name: org.name,
          url: org.url,
          image_url: org.image_url,
          image_background_color: org.image_background_color || '#ffffff',
          description: org.description,
          category: org.category,
          topics: org.topics || [],
          technologies: org.technologies || [],
          years: filteredYears
        };
      });
      
    // 4. Save to cache database for 24 hours
    await fileDb.setCache(cacheKey, filteredOrgs, 24 * 60 * 60 * 1000);
    
    return res.json(filteredOrgs);
  } catch (error) {
    console.error('[GSoCController] Failed to load/process GSoC database:', error.message);
    next(error);
  }
};

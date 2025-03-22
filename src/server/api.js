const axios = require('axios');
require('dotenv').config();

const TBA_API_KEY = process.env.TBA_API_KEY;
const BASE_URL = 'https://www.thebluealliance.com/api/v3';

async function fetchAllianceMatches(eventKey, teamKey) {
  try {
    const response = await axios.get(`${BASE_URL}/event/${eventKey}/matches`, {
      headers: {
        'X-TBA-Auth-Key': TBA_API_KEY
      }
    });
    // Filter the matches to only those where the specified team is part of an alliance
    const matches = response.data;
    const teamMatches = matches.filter(match =>
      match.alliances.red.team_keys.includes(teamKey) ||
      match.alliances.blue.team_keys.includes(teamKey)
    );
    return teamMatches;
  } catch (error) {
    console.error('Error fetching alliance matches:', error.message);
    throw error;
  }
}

// Add this new function to fetch event details
async function fetchEventDetails(eventKey) {
  const url = `https://www.thebluealliance.com/api/v3/event/${eventKey}`;
  const response = await fetch(url, {
    headers: {
      'X-TBA-Auth-Key': process.env.TBA_API_KEY
    }
  });
  
  if (!response.ok) {
    throw new Error(`Error fetching event details: ${response.statusText}`);
  }
  
  return response.json();
}

// Don't forget to export the new function
module.exports = {
  fetchAllianceMatches,
  fetchEventDetails
};

const express = require('express');
const router = express.Router();
const { fetchAllianceMatches, fetchEventDetails } = require('./api');

// GET /matches?eventKey=2025onnob&teamKey=frc1334&sort=date
router.get('/matches', async (req, res) => {
  const { eventKey, teamKey, sort = 'match' } = req.query;
  
  if (!eventKey) {
    return res.status(400).json({ error: 'Missing eventKey parameter' });
  }
  
  if (!teamKey) {
    return res.status(400).json({ error: 'Missing teamKey parameter' });
  }
  
  // Add frc prefix if not included
  const formattedTeamKey = teamKey.startsWith('frc') ? teamKey : `frc${teamKey}`;
  
  try {
    // Fetch both matches and event details concurrently
    const [matches, eventDetails] = await Promise.all([
      fetchAllianceMatches(eventKey, formattedTeamKey),
      fetchEventDetails(eventKey)
    ]);
    
    // Get the event name from the details
    const eventName = eventDetails.name || eventKey;
    
    // Sort matches based on sort parameter
    let sortedMatches = [...matches];
    
    if (sort === 'date') {
      // Sort by predicted time or actual time
      sortedMatches.sort((a, b) => {
        return (a.predicted_time || a.time || 0) - (b.predicted_time || b.time || 0);
      });
    } else {
      // Default: sort by match order (comp_level first, then match_number)
      const levelOrder = { 'qm': 1, 'ef': 2, 'qf': 3, 'sf': 4, 'f': 5 };
      sortedMatches.sort((a, b) => {
        // First sort by comp_level
        if (levelOrder[a.comp_level] !== levelOrder[b.comp_level]) {
          return levelOrder[a.comp_level] - levelOrder[b.comp_level];
        }
        // Then sort by match number
        return a.match_number - b.match_number;
      });
    }
    
    // Create HTML content
    let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Team ${formattedTeamKey.replace("frc", "")} Matches at ${eventName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
        }
        .embed-container {
          max-width: 800px;
          margin: 0 auto;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .embed-header {
          background-color: #1c36e0;
          color: white;
          padding: 15px 20px;
          font-size: 1.2em;
          font-weight: bold;
        }
        .disclaimer {
          font-size: 0.7em;
          color: #666;
          text-align: center;
          padding: 5px 0;
          border-bottom: 1px solid #eee;
          margin-bottom: 15px;
        }
        .embed-content {
          padding: 20px;
        }
        .match-card {
          margin-bottom: 15px;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 15px;
        }
        .match-title {
          font-weight: bold;
          margin-bottom: 8px;
          font-size: 1.1em;
        }
        .match-detail {
          margin: 5px 0;
        }
        .red {
          color: #CF3339;
        }
        .blue {
          color: #1c36e0;
        }
        .bold {
          font-weight: bold;
        }
        .time-display {
          font-weight: bold;
        }
        .score {
          font-weight: bold;
          font-size: 1.1em;
        }
        .winner {
          text-decoration: underline;
        }
        .sort-controls {
          margin-bottom: 15px;
          text-align: right;
        }
        .sort-controls a {
          margin-left: 10px;
          text-decoration: none;
          padding: 5px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #f8f8f8;
          color: #333;
        }
        .sort-controls a.active {
          background-color: #1c36e0;
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="embed-container">
        <div class="embed-header">
          Team ${formattedTeamKey.replace("frc", "")} Matches at ${eventName}
        </div>
        <div class="embed-content">
          <div class="disclaimer">
            Data provided by The Blue Alliance. Times subject to change.
          </div>
          <div class="sort-controls">
            Sort by:
            <a href="?eventKey=${eventKey}&teamKey=${teamKey}&sort=match" ${sort === 'match' ? 'class="active"' : ''}>Match Order</a>
            <a href="?eventKey=${eventKey}&teamKey=${teamKey}&sort=date" ${sort === 'date' ? 'class="active"' : ''}>Time</a>
          </div>
    `;
    
    // Process each match
    if (sortedMatches.length === 0) {
      htmlContent += `<p>No matches found for this team.</p>`;
    } else {
      sortedMatches.forEach(match => {
        // Determine which alliance our team is on
        const isRed = match.alliances.red.team_keys.includes(formattedTeamKey);
        const allianceColor = isRed ? "red" : "blue";
        const opposingColor = isRed ? "blue" : "red";
        
        // Get alliance partners and opponents
        const myAlliance = isRed ? match.alliances.red.team_keys : match.alliances.blue.team_keys;
        const opposingAlliance = isRed ? match.alliances.blue.team_keys : match.alliances.red.team_keys;
        
        // Format alliance partners (excluding our team)
        const partners = myAlliance
          .filter(team => team !== formattedTeamKey)
          .map(team => team.replace("frc", ""))
          .join(", ");
        
        // Format opponents
        const opponents = opposingAlliance
          .map(team => team.replace("frc", ""))
          .join(", ");
        
        // Time formatting - just time, no date
        let timeDisplay = "TBD";
        
        if (match.predicted_time || match.time) {
          const timestamp = (match.predicted_time || match.time) * 1000;
          const matchDate = new Date(timestamp);
          
          // Format time: "10:30 AM"
          const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
          timeDisplay = matchDate.toLocaleTimeString('en-US', timeOptions);
        }
        
        // Get match type and number
        const matchLevel = match.comp_level === "qm" ? "Qualification" : 
                          match.comp_level === "ef" ? "Eighth Final" :
                          match.comp_level === "qf" ? "Quarter Final" :
                          match.comp_level === "sf" ? "Semi Final" :
                          match.comp_level === "f" ? "Final" : match.comp_level;
                          
        const matchTitle = `${matchLevel} ${match.match_number}`;
        
        // Handle match scores
        let scoreDisplay = "";
        if (match.alliances.red.score !== null && match.alliances.blue.score !== null && match.alliances.red.score !== -1 && match.alliances.blue.score !== -1) {
          const redScore = match.alliances.red.score;
          const blueScore = match.alliances.blue.score;
          const redWon = redScore > blueScore;
          const blueWon = blueScore > redScore;
          const tie = redScore === blueScore;
          
          scoreDisplay = `
            <div class="match-detail">
              <span class="bold">Result: </span>
              <span class="red ${redWon ? 'winner' : ''}">${redScore}</span>
              -
              <span class="blue ${blueWon ? 'winner' : ''}">${blueScore}</span>
              ${tie ? '(Tie)' : ''}
            </div>
          `;
        }
        
        htmlContent += `
          <div class="match-card">
            <div class="match-title">${matchTitle}</div>
            <div class="match-detail">
              <span class="bold">Time:</span> 
              <span class="time-display">${timeDisplay}</span>
            </div>
            <div class="match-detail">
              <span class="bold">Alliance:</span> <span class="${allianceColor}">${allianceColor.charAt(0).toUpperCase() + allianceColor.slice(1)}</span>
            </div>
            <div class="match-detail"><span class="bold">Partners:</span> ${partners}</div>
            <div class="match-detail">
              <span class="bold">Opposing Alliance:</span> <span class="${opposingColor}">${opposingColor.charAt(0).toUpperCase() + opposingColor.slice(1)}</span> - ${opponents}
            </div>
            ${scoreDisplay}
          </div>
        `;
      });
    }
    
    htmlContent += `
        </div>
      </div>
    </body>
    </html>
    `;
    
    // Set content type to HTML and send the response
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Add a health endpoint for Docker healthchecks
router.get('/health', (req, res) => {
  res.status(200).send('OK');
});

module.exports = router;

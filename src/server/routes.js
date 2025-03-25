const express = require('express');
const router = express.Router();
const { fetchAllianceMatches, fetchEventDetails } = require('./api');

// GET /matches?eventKey=2025onnob&teamKey=frc1334&sort=match&date=YYYY-MM-DD
router.get('/matches', async (req, res) => {
  const { eventKey, teamKey, sort = 'match', showControls = 'true', height = '600', date } = req.query;
  
  if (!eventKey) {
    return res.status(400).json({ error: 'Missing eventKey parameter' });
  }
  
  if (!teamKey) {
    return res.status(400).json({ error: 'Missing teamKey parameter' });
  }
  
  // Add frc prefix if not included
  const formattedTeamKey = teamKey.startsWith('frc') ? teamKey : `frc${teamKey}`;
  
  // Set displaySortControls to true by default unless explicitly set to false
  const displaySortControls = showControls.toLowerCase() !== 'false';
  
  // Parse height (default to 600px if invalid)
  const containerHeight = parseInt(height) > 0 ? parseInt(height) : 600;
  
  try {
    // Fetch both matches and event details concurrently
    const [matches, eventDetails] = await Promise.all([
      fetchAllianceMatches(eventKey, formattedTeamKey),
      fetchEventDetails(eventKey)
    ]);
    
    // Get the event name from the details
    const eventName = eventDetails.name || eventKey;
    
    // Filter matches by date if specified
    let filteredMatches = [...matches];
    let selectedDate = null;
    
    if (date) {
      selectedDate = new Date(date);
      // Check if date is valid
      if (!isNaN(selectedDate.getTime())) {
        // Filter matches that occur on the specified date
        filteredMatches = filteredMatches.filter(match => {
          const matchTimestamp = (match.predicted_time || match.time || 0) * 1000;
          const matchDate = new Date(matchTimestamp);
          return matchDate.toDateString() === selectedDate.toDateString();
        });
      }
    }
    
    // Sort matches based on sort parameter
    let sortedMatches = [...filteredMatches];
    
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
    
    // Get unique dates from matches for the date filter dropdown
    const uniqueDates = [...new Set(matches.map(match => {
      const timestamp = (match.predicted_time || match.time || 0) * 1000;
      const matchDate = new Date(timestamp);
      return matchDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    }).filter(dateStr => dateStr !== "1970-01-01"))]
    .sort();
    
    // Create HTML content
    let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Team ${formattedTeamKey.replace("frc", "")} Matches at ${eventName}</title>
      <style>
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: transparent;
        }
        body {
          font-family: Arial, sans-serif;
          background-color: transparent;
          color: #ffffff;
        }
        .embed-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background-color: #000000;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
          max-height: ${containerHeight}px;
        }
        .embed-header {
          background-color: #CF3339;
          color: white;
          padding: 15px 20px;
          font-size: 1.2em;
          font-weight: bold;
          text-align: center;
          flex: 0 0 auto;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }
        .embed-content {
          position: relative;
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .disclaimer {
          font-size: 0.7em;
          color: #aaaaaa;
          text-align: center;
          padding: 5px 0;
          border-bottom: 1px solid #333333;
          margin-bottom: 0;
          flex: 0 0 auto;
        }
        .controls-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          margin: 10px 15px;
          flex: 0 0 auto;
        }
        .date-filter {
          margin: 5px;
        }
        .date-filter select {
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #ddd;
        }
        .sort-controls {
          margin: 5px;
          text-align: right;
        }
        .matches-container {
          flex: 1 1 auto;
          overflow-y: auto;
          padding: 0 10px 10px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
        }
        .match-card {
          margin-bottom: 15px;
          border: 1px solid #333333;
          border-radius: 6px;
          padding: 12px;
          background-color: #121212;
        }
        .match-title {
          font-weight: bold;
          margin-bottom: 8px;
          font-size: 1.1em;
        }
        .match-detail {
          margin: 5px 0;
          word-wrap: break-word;
        }
        .red {
          color:rgb(202, 64, 68);
        }
        .blue {
          color:rgb(74, 72, 196);
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
        .sort-controls a {
          display: inline-block;
          margin: 5px;
          text-decoration: none;
          padding: 8px 12px;
          border: 1px solid #333333;
          border-radius: 4px;
          background-color: #222222;
          color: #ffffff;
        }
        .sort-controls a.active {
          background-color: #CF3339;
          color: white;
        }
        .date-display {
          font-size: 0.8em;
          color: #aaaaaa;
          margin-left: 5px;
        }
        
        /* Responsive adjustments */
        @media (min-width: 768px) {
          .embed-container {
            max-width: 800px;
            margin: 0 auto;
          }
          .matches-container {
            padding: 0 20px 20px;
          }
        }
        
        @media (max-width: 480px) {
          .match-detail {
            font-size: 0.9em;
          }
          .match-title {
            font-size: 1em;
          }
          .controls-container {
            flex-direction: column;
            align-items: stretch;
          }
          .sort-controls, .date-filter {
            text-align: center;
          }
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
          ${displaySortControls ? `
          <div class="controls-container">
            <div class="date-filter">
              <select onchange="window.location.href='?eventKey=${eventKey}&teamKey=${teamKey}&sort=${sort}&height=${containerHeight}${!displaySortControls ? '&showControls=false' : ''}&date=' + this.value">
                <option value="">All Days</option>
                ${uniqueDates.map(dateStr => {
                  const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  });
                  return `<option value="${dateStr}" ${dateStr === date ? 'selected' : ''}>${formattedDate}</option>`;
                }).join('')}
              </select>
            </div>
            <div class="sort-controls">
              Sort by:
              <a href="?eventKey=${eventKey}&teamKey=${teamKey}&sort=match&height=${containerHeight}${!displaySortControls ? '&showControls=false' : ''}${date ? '&date='+date : ''}" ${sort === 'match' ? 'class="active"' : ''}>Match Order</a>
              <a href="?eventKey=${eventKey}&teamKey=${teamKey}&sort=date&height=${containerHeight}${!displaySortControls ? '&showControls=false' : ''}${date ? '&date='+date : ''}" ${sort === 'date' ? 'class="active"' : ''}>Time</a>
            </div>
          </div>
          ` : ''}
          <div class="matches-container">
    `;
    
    // Process each match
    if (sortedMatches.length === 0) {
      htmlContent += `<p>No matches found for this team${date ? ' on the selected date' : ''}.</p>`;
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
        let dateDisplay = "";
        
        if (match.predicted_time || match.time) {
          const timestamp = (match.predicted_time || match.time) * 1000;
          const matchDate = new Date(timestamp);
          
          // Format time: "10:30 AM"
          const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
          timeDisplay = matchDate.toLocaleTimeString('en-US', timeOptions);
          
          // Format date: "Mar 22"
          const dateOptions = { month: 'short', day: 'numeric' };
          dateDisplay = matchDate.toLocaleDateString('en-US', dateOptions);
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
              <span class="date-display">${dateDisplay}</span>
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
          </div> <!-- Close matches-container -->
        </div> <!-- Close embed-content -->
      </div> <!-- Close embed-container -->
      <script>
        // Auto-refresh embed content every 60 seconds (1 minute)
        setTimeout(function() {
          // Store current scroll position before refresh
          const scrollPos = document.querySelector('.matches-container').scrollTop;
          sessionStorage.setItem('scrollPosition', scrollPos.toString());
          
          // Refresh while preserving query parameters
          window.location.reload();
        }, 60000);
        
        // Restore scroll position after refresh
        window.addEventListener('DOMContentLoaded', function() {
          const savedPos = sessionStorage.getItem('scrollPosition');
          if (savedPos) {
            document.querySelector('.matches-container').scrollTop = parseInt(savedPos);
          }
        });
      </script>
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

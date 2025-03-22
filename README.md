Collecting workspace information# TBA Matches Fetcher

A service to fetch and display alliance matches of a specific team in a FIRST Robotics Competition event using The Blue Alliance API.

## Description

The TBA Matches Fetcher provides a simple web service that displays information about a team's matches at a specific FRC event. It shows:

- Match schedule with times
- Alliance partners
- Opposing alliance teams
- Match results (when available)

## Installation

### Prerequisites

- Node.js v22 or higher
- Docker (optional)

### Local Setup

1. Clone the repository:
   ```sh
   git clone https://github.com/lunarcatowo/TBA-matches-fetch.git
   cd TBA-matches-fetch
   ```

2. Install dependencies:
   ```sh
   npm ci
   ```

3. Create a .env file based on the example:
   ```sh
   cp .env.example .env
   ```

4. Add your TBA API key to the .env file:
   ```
   TBA_API_KEY=your_tba_api_key
   PORT=3001
   ```

5. Start the server:
   ```sh
   npm start
   ```

### Docker Setup

1. Build the Docker image:
   ```sh
   docker build -t tba-matches-fetch .
   ```

2. Run the container:
   ```sh
   docker run -p 3001:3001 --env-file .env -d tba-matches-fetch
   ```

### Docker Compose

1. Configure your environment variables in the .env file
2. Run with docker-compose:
   ```sh
   docker-compose up -d
   ```

## Usage

Once the server is running, access match information at:
```
http://localhost:3001/api/TBA-matches/matches?eventKey=EVENT_KEY&teamKey=TEAM_NUMBER
```

### Parameters:

- `eventKey`: The event key from The Blue Alliance (e.g., `2025onnob`)
- `teamKey`: The team number (e.g., `1334` or `frc1334`)
- `sort`: Optional sorting parameter (`match` or `date`, defaults to `match`)

### Example:

```
http://localhost:3001/api/TBA-matches/matches?eventKey=2025onnob&teamKey=1334&sort=date
```

## API Documentation

### GET `/api/TBA-matches/matches`

Fetches and displays match information for a specific team at a specific event.

#### Health Check

The service includes a health check endpoint at:
```
http://localhost:3001/api/TBA-matches/health
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| TBA_API_KEY | Your Blue Alliance API key | - |
| PORT | Port to run the server on | 3001 |

## License

This project is licensed under the GNU General Public License v3.0 - see the LICENSE file for details.

## Acknowledgements

- Data provided by [The Blue Alliance](https://www.thebluealliance.com/)
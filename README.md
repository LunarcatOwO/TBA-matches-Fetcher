# Blue Alliance Matches API

This project is a simple Express application that fetches alliance matches for a specific team in an event using the Blue Alliance API.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [License](#license)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/blue-alliance-matches.git
   ```
2. Navigate to the project directory:
   ```
   cd blue-alliance-matches
   ```
3. Install the dependencies:
   ```
   npm install
   ```
4. Create a `.env` file based on the `.env.example` file and add your Blue Alliance API key.

## Usage

To start the server, run:
```
npm start
```
The server will start on the specified port (default is 3000).

## API Endpoints

- `GET /api/matches/:eventKey/:teamKey`
  - Fetches the alliance matches for a specific team in a given event.

## Environment Variables

The following environment variables are required:

- `BLUE_ALLIANCE_API_KEY`: Your API key for accessing the Blue Alliance API.
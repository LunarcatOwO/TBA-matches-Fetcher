const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const apiRoutes = require('./routes');

// Middleware
app.use(cors());
app.use(express.json());

// Mount API routes at /api/TBA-matches
app.use('/api/TBA-matches', apiRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

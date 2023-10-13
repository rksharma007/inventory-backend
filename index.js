const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const cors = require('cors')
app.use(cors())

// Connect Database
connectDB();

//Init Middleware
app.use(express.json({extended : false}));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req,res) => res.send('Inventory Dev API Running...'));

// Define Routes
app.use('/api/admin', require('./routes/api/admin'));
app.use('/api/staff', require('./routes/api/staff'));

// Define static assets in production
const PORT = process.env.PORT || 8081;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
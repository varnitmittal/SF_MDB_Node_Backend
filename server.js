require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const API_KEY = process.env.API_KEY;

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri);

app.use((req, res, next) => {

    const apiKey = req.headers['x-api-key'];

    if (apiKey !== API_KEY) {

        return res.status(401).json({
            error: 'Unauthorized'
        });

    }

    next();

});

app.get('/artists', async (req, res) => {

    const page = parseInt(req.query.page) || 1;

    const limitCount = 10;

    const skip = (page - 1) * limitCount;

    try {

        await client.connect();

        const db = client.db('Art_Gallery');

        const collection = db.collection('artists_catalog');

        const totalRecords = await collection.countDocuments();

        const artists = await collection
            .find({})
            .skip(skip)
            .limit(limitCount)
            .toArray();

        res.json({
            currentPage: page,
            limitCount: limitCount,
            totalRecords: totalRecords,
            totalPages: Math.ceil(totalRecords / limitCount),
            hasNextPage: page < Math.ceil(totalRecords / limitCount),
            hasPreviousPage: page > 1,
            data: artists
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});
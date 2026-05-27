require('dotenv').config();

const express =
    require('express');

const cors =
    require('cors');

const apiKeyMiddleware =
    require(
        './middleware/apiKeyMiddleware'
    );

const artistRoutes =
    require(
        './routes/artistRoutes'
    );

const decodeRoutes =
    require(
        './routes/decodeRoutes'
    );

const app = express();

/*
============================================
MIDDLEWARE
============================================
*/

app.use(cors());

app.use(express.json());

app.use(apiKeyMiddleware);

/*
============================================
ROUTES
============================================
*/

app.use(
    '/artists',
    artistRoutes
);

app.use(
    '/decodeFull',
    decodeRoutes
);

/*
============================================
START SERVER
============================================
*/

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );

});
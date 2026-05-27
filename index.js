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

const kafkaRoutes =
    require(
        './routes/kafkaRoutes'
    );

const {
    connectProducer,

    publishMessage

} = require(
    './kafka/kafkaProducer'
);

const app = express();

/*
============================================
MIDDLEWARE
============================================
*/

app.use(cors());

app.use(express.json());

/*
============================================
ROUTES
============================================
*/

app.use(

    '/artists',

    apiKeyMiddleware(
        process.env.API_KEY
    ),

    artistRoutes

);

app.use(

    '/decodeFull',

    decodeRoutes

);

app.use(

    '/kafka',

    kafkaRoutes

);

/*
============================================
START SERVER
============================================
*/

const PORT =
    process.env.PORT || 3000;

async function startServer() {

    try {

        await connectProducer();

        console.log(
            'Kafka Producer Connected'
        );

        /*
        ============================================
        TEST MESSAGE
        ============================================
        */

        setTimeout(async () => {

            try {

                await publishMessage(

                    'artwork-consignments',

                    {

                        artist:
                            'Picasso',

                        value:
                            '5000',

                        source:
                            'Node Startup Test'

                    }

                );

                console.log(
                    'Test Kafka message sent'
                );

            } catch (err) {

                console.error(
                    'Kafka Test Error:',
                    err.message
                );

            }

        }, 5000);

        app.listen(PORT, () => {

            console.log(
                `Server running on port ${PORT}`
            );

        });

    } catch (err) {

        console.error(
            'Startup Error:',
            err
        );

    }

}

startServer();
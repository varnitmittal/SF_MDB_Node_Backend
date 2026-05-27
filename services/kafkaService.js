const {
    publishMessage
} = require(
    '../kafka/kafkaProducer'
);

async function publishConsignment(

    req,

    res

) {

    try {

        const apiKey =
            req.get('x-api-key');

        console.log(
            'Incoming API Key:',
            apiKey
        );

        console.log(
            'Expected API Key:',
            process.env.KAFKA_API_KEY
        );

        if (

            !apiKey ||

            apiKey.trim() !==
            process.env.KAFKA_API_KEY.trim()

        ) {

            return res.status(401).json({

                error:
                    'Unauthorized'

            });

        }

        await publishMessage(

            'artwork-consignments',

            req.body

        );

        res.json({

            success: true,

            message:
                'Published to Kafka'

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({

            error:
                err.message

        });

    }

}

module.exports = {

    publishConsignment

};
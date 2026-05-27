const {
    Kafka
} = require('kafkajs');

const kafka =
    new Kafka({

        clientId:
            'salesforce-kafka-producer',

        brokers:
            ['localhost:9092']

    });

const producer =
    kafka.producer();

async function connectProducer() {

    await producer.connect();

    console.log(
        'Kafka Producer Connected'
    );

}

async function publishMessage(

    topic,

    message

) {

    await producer.send({

        topic,

        messages: [

            {
                value:
                    JSON.stringify(
                        message
                    )
            }

        ]

    });

}

//connectProducer();

module.exports = {

    connectProducer,

    publishMessage

};
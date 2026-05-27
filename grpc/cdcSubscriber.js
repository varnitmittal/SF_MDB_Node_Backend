require('dotenv').config();

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const axios = require('axios');
const { MongoClient } = require('mongodb');

/*
============================================
MONGODB
============================================
*/

const mongoClient = new MongoClient(
    process.env.MONGO_URI
);

/*
============================================
LOAD SALESFORCE PUBSUB PROTO
============================================
*/

const packageDefinition =
    protoLoader.loadSync(
        './grpc/protos/pubsub_api.proto',
        {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true
        }
    );

const pubsubProto =
    grpc.loadPackageDefinition(
        packageDefinition
    ).eventbus.v1;

/*
============================================
GET SALESFORCE ACCESS TOKEN
============================================
*/

async function getAccessToken() {

    try {

        const response = await axios.post(

            `${process.env.SF_LOGIN_URL}/services/oauth2/token`,

            null,

            {
                params: {

                    grant_type:
                        process.env.SF_GRANT_TYPE,

                    client_id:
                        process.env.SF_CLIENT_ID,

                    client_secret:
                        process.env.SF_CLIENT_SECRET

                }

            }

        );

        console.log(
            'Salesforce OAuth successful'
        );

        return response.data;

    } catch (err) {

        console.error(
            'OAuth Error:',
            err.response?.data || err.message
        );

        throw err;

    }

}

/*
============================================
START CDC SUBSCRIBER
============================================
*/

async function startCDCSubscriber() {

    try {

        /*
        ============================================
        CONNECT TO MONGODB
        ============================================
        */

        await mongoClient.connect();

        console.log(
            'Connected to MongoDB'
        );

        const db =
            mongoClient.db('Art_Gallery');

        const cdcCollection =
            db.collection(
                'artist_cdc_events'
            );

        /*
        ============================================
        SALESFORCE AUTH
        ============================================
        */

        const auth =
            await getAccessToken();

        const accessToken =
            auth.access_token;

        const instanceUrl =
            auth.instance_url;

        console.log(
            'Instance URL:',
            instanceUrl
        );

        /*
        ============================================
        CREATE GRPC CLIENT
        ============================================
        */

        const client =
            new pubsubProto.PubSub(
                'api.pubsub.salesforce.com:7443',

                grpc.credentials.createSsl()
            );
        /*
        ============================================
        METADATA WITH ACCESS TOKEN
        ============================================
        */

        const metadata =
            new grpc.Metadata();

        metadata.add(
            'accesstoken',
            accessToken
        );

        metadata.add(
            'instanceurl',
            instanceUrl
        );

        metadata.add(
            'tenantid',
            process.env.SF_TENANT_ID
        );

        /*
        ============================================
        SUBSCRIBE STREAM
        ============================================
        */

        const stream =
            client.Subscribe(metadata);

        console.log(
            'Subscribed to Salesforce CDC'
        );

        /*
        ============================================
        SEND SUBSCRIBE REQUEST
        ============================================
        */

        stream.write({

            topic_name:
                '/data/Artist__ChangeEvent',

            replay_preset: 0,

            num_requested: 10

        });

        /*
        ============================================
        HANDLE EVENTS
        ============================================
        */

        stream.on(
            'data',
            async (event) => {

                try {

                    console.log(
                        'CDC Event Received'
                    );

                    console.log(
                        JSON.stringify(
                            event,
                            null,
                            2
                        )
                    );

                    /*
                    ====================================
                    SAVE RAW EVENT TO MONGODB
                    ====================================
                    */

                    await cdcCollection.insertOne({

                        receivedAt:
                            new Date(),

                        eventPayload:
                            event

                    });

                    console.log(
                        'CDC Event saved to MongoDB'
                    );

                } catch (err) {

                    console.error(
                        'Mongo Insert Error:',
                        err.message
                    );

                }

            }
        );

        /*
        ============================================
        STREAM ERROR
        ============================================
        */

        stream.on(
            'error',
            (err) => {

                console.error(
                    'gRPC Stream Error:',
                    err
                );

            }
        );

        /*
        ============================================
        STREAM END
        ============================================
        */

        stream.on(
            'end',
            () => {

                console.log(
                    'gRPC Stream Ended'
                );

            }
        );

    } catch (err) {

        console.error(
            'CDC Subscriber Fatal Error:',
            err
        );

    }

}

/*
============================================
START PROCESS
============================================
*/

startCDCSubscriber();
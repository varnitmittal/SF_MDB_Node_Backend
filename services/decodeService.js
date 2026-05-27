const avro =
    require('avsc');

const client =
    require('../config/mongo');

const {
    grpc,
    createPubSubClient
} = require('../config/pubsub');

const {
    getAccessToken
} = require(
    './salesforceAuthService'
);

const {
    ObjectId
} = require('mongodb');

async function decodeCDCEvent(id) {

    await client.connect();

    const db =
        client.db('Art_Gallery');

    const collection =
        db.collection(
            'artist_cdc_events'
        );

    /*
    ============================================
    FIND RECORD
    ============================================
    */

    const record =
        await collection.findOne({

            _id:
                new ObjectId(id)

        });

    if (!record) {

        throw new Error(
            'Record not found'
        );

    }

    /*
    ============================================
    EXTRACT EVENT
    ============================================
    */

    const event =
        record.eventPayload
            .events[0];

    const schemaId =
        event.event.schema_id;

    const payloadBase64 =

        event.event.payload
            ?.buffer
            ?.toString('base64')

        ||

        event.event.payload
            ?.$binary
            ?.base64;

    if (!payloadBase64) {

        throw new Error(
            'Payload not found'
        );

    }

    /*
    ============================================
    SALESFORCE AUTH
    ============================================
    */

    const auth =
        await getAccessToken();

    /*
    ============================================
    GRPC CLIENT
    ============================================
    */

    const grpcClient =
        createPubSubClient();

    const metadata =
        new grpc.Metadata();

    metadata.add(
        'accesstoken',
        auth.access_token
    );

    metadata.add(
        'instanceurl',
        auth.instance_url
    );

    metadata.add(
        'tenantid',
        process.env.SF_TENANT_ID
    );

    /*
    ============================================
    GET SCHEMA
    ============================================
    */

    const schemaResponse =
        await new Promise(

            (resolve, reject) => {

                grpcClient.GetSchema(

                    {
                        schema_id:
                            schemaId
                    },

                    metadata,

                    (err, response) => {

                        if (err) {

                            return reject(err);

                        }

                        resolve(response);

                    }

                );

            }

        );

    /*
    ============================================
    PARSE SCHEMA
    ============================================
    */

    const schemaJson =
        JSON.parse(
            schemaResponse
                .schema_json
        );

    /*
    ============================================
    CUSTOM LONG TYPE
    ============================================
    */

    const longType =
        avro.types.LongType
            .__with({

                fromBuffer(buf) {

                    return buf
                        .readBigInt64BE();

                },

                toBuffer(n) {

                    const buf =
                        Buffer.alloc(8);

                    buf.writeBigInt64BE(
                        BigInt(n)
                    );

                    return buf;

                },

                fromJSON(n) {

                    return BigInt(n);

                },

                toJSON(n) {

                    return n.toString();

                },

                isValid(n) {

                    return (
                        typeof n ===
                        'bigint'
                    );

                },

                compare(a, b) {

                    if (a === b) {

                        return 0;

                    }

                    return a > b
                        ? 1
                        : -1;

                }

            });

    /*
    ============================================
    CREATE AVRO TYPE
    ============================================
    */

    const avroType =
        avro.Type.forSchema(

            schemaJson,

            {

                registry: {},

                typeHook(schema) {

                    if (

                        schema &&

                        schema.type ===
                        'long'

                    ) {

                        return longType;

                    }

                }

            }

        );

    /*
    ============================================
    BUFFER
    ============================================
    */

    const payloadBuffer =
        Buffer.from(

            payloadBase64,

            'base64'

        );

    /*
    ============================================
    DECODE
    ============================================
    */

    const decoded =
        avroType.fromBuffer(
            payloadBuffer
        );

    /*
    ============================================
    SAFE BIGINT SERIALIZATION
    ============================================
    */

    const safeDecoded =
        JSON.parse(

            JSON.stringify(

                decoded,

                (key, value) =>

                    typeof value ===
                    'bigint'

                        ? value.toString()

                        : value

            )

        );

    return {

        mongoId:
            id,

        schemaId:
            schemaId,

        eventId:
            event.event.id,

        decodedEvent:
            safeDecoded

    };

}

module.exports = {
    decodeCDCEvent
};
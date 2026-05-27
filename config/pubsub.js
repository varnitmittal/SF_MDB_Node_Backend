const grpc =
    require('@grpc/grpc-js');

const protoLoader =
    require('@grpc/proto-loader');

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

function createPubSubClient() {

    return new pubsubProto.PubSub(

        'api.pubsub.salesforce.com:7443',

        grpc.credentials.createSsl()

    );

}

module.exports = {
    grpc,
    createPubSubClient
};
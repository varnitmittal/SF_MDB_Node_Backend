const client =
    require('../config/mongo');

async function getArtists(page) {

    const limitCount = 10;

    const skip =
        (page - 1) * limitCount;

    await client.connect();

    const db =
        client.db('Art_Gallery');

    const collection =
        db.collection(
            'artists_catalog'
        );

    const totalRecords =
        await collection.countDocuments();

    const artists =
        await collection
            .find({})
            .skip(skip)
            .limit(limitCount)
            .toArray();

    return {

        currentPage:
            page,

        limitCount:
            limitCount,

        totalRecords:
            totalRecords,

        totalPages:
            Math.ceil(
                totalRecords /
                limitCount
            ),

        hasNextPage:
            page <
            Math.ceil(
                totalRecords /
                limitCount
            ),

        hasPreviousPage:
            page > 1,

        data:
            artists

    };

}

module.exports = {
    getArtists
};
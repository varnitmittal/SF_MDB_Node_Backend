module.exports = (

    expectedApiKey

) => {

    return (

        req,

        res,

        next

    ) => {

        const apiKey =
            req.get('x-api-key');

        if (

            !apiKey ||

            apiKey.trim() !==
            expectedApiKey.trim()

        ) {

            return res.status(401).json({

                error:
                    'Unauthorized'

            });

        }

        next();

    };

};
const express =
    require('express');

const router =
    express.Router();

const {
    getArtists
} = require(
    '../services/artistService'
);

router.get('/', async (req, res) => {

    try {

        const page =
            parseInt(
                req.query.page
            ) || 1;

        const result =
            await getArtists(page);

        res.json(result);

    } catch (err) {

        res.status(500).json({

            error:
                err.message

        });

    }

});

module.exports = router;
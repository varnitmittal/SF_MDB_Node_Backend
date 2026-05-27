const express =
    require('express');

const router =
    express.Router();

const {
    decodeCDCEvent
} = require(
    '../services/decodeService'
);

/*
============================================
DECODE FULL CDC EVENT
============================================
*/

router.get('/:id', async (req, res) => {

    try {

        const result =
            await decodeCDCEvent(
                req.params.id
            );

        res.json(result);

    } catch (err) {

        console.error(err);

        res.status(500).json({

            error:
                err.message

        });

    }

});

module.exports = router;
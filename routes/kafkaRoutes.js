const express =
    require('express');

const router =
    express.Router();

const {
    publishConsignment
} = require(
    '../services/kafkaService'
);

router.post(

    '/publish-consignment',

    publishConsignment

);

module.exports = router;
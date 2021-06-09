const express = require('express');
const router = express.Router();

const { updateAllAccessToken } = require('../controllers/user.controller')

router
    .route('/')
    .get(updateAllAccessToken)

module.exports = router;
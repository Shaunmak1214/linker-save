const express = require('express');
const router = express.Router();

const userRoute = require('./user.route');

const defaultRoutes = [
    {
        path: '/update-user',
        route: userRoute
    },
]

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

module.exports = router;
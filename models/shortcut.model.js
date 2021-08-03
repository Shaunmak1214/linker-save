const Sequelize = require('sequelize');
const db = require('../config/database');

const Shortcut = db.define('shortcut', {
    id:{
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id:{
        type: Sequelize.STRING,
    },
    shortcuts:{
        type: Sequelize.STRING
    }
})

module.exports = Shortcut;
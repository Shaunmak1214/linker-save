const Shortcut = require('../models/shortcut.model')

const createShortcut = async(id, shortcutFrom, shortcutTo) => {
    let shortcuts = shortcutFrom + "=" + shortcutTo;

    const shortcutExisted = await Shortcut.findAll({
        where:{
            shortcuts
        }
    })

    if(shortcutExisted.length > 0){
        return 1;
    }else{
        const newShortcut = await Shortcut.create({ user_id: id, shortcuts })

        if(newShortcut){
            return true
        }else{
            return null
        }
    }
}

const getAllShortcut = async(id) => {
    const shortcuts = await Shortcut.findAll({
        where: {
            user_id: `${id}`
        }
    })

    shortcuts.forEach(shortcut => {
        console.log(shortcut.dataValues.shortcuts)
    });
}

const getShortcutViaInput = async(id, shortcutFrom) => {
    const shortcuts = await Shortcut.findAll({
        where: {
            user_id: `${id}`
        }
    })

    let targetShortcut;

    shortcuts.forEach(shortcut => {
        if(shortcut.dataValues.shortcuts.split("=")[0] === shortcutFrom){
            targetShortcut = shortcut.dataValues.shortcuts.split("=")[1]
        }
    });

    if(targetShortcut){
        return targetShortcut
    }else{
        return null;
    }
}

module.exports = {
    createShortcut,
    getAllShortcut,
    getShortcutViaInput
}
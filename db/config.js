const mongoose = require('mongoose')
const { uri } = require('../config/const.json')

mongoose.connect(uri)
    .then(() => console.log(`DB Connected`))
    .catch(err => console.log(`DB Connection ERROR: ${err.message}`))

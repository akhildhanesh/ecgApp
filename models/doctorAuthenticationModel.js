const mongoose = require('mongoose')

const doctorAuthenticationSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
})

module.exports = module.exports = mongoose.model('DoctorAuthentication', doctorAuthenticationSchema)
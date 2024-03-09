const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        required: true,
    },
    sex: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true,
    },
    weight: {
        type: Number,
        required: true,
    },
    height: {
        type: Number,
        required: true,
    },
    image: {
        type: String,
    },
    ecg: {
        type: Array,
    },
    chats: {
        type: Array,
    }
})

module.exports = mongoose.model('User', userSchema)
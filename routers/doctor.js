const express = require('express')
const doctorRouter = express.Router()
const DoctorAuthentication = require('../models/doctorAuthenticationModel')
const { isDoctorAuthenticated, isAuthenticated } = require('../middleware/userAuthentication')
const User = require('../models/userModel')
const { genSalt, hash, compare } = require('bcrypt')
const session = require('express-session')

new DoctorAuthentication({
    username: 'admin',
    password: '$2a$10$RIx6uwSzKy24vGIX/sH6LuvzX/VydwcO/fukN4pg3fCtNMAy4ZbZq'
}).save()
    .catch(() => { })

require('dotenv').config()

doctorRouter.use(session({
    secret: process.env.SESSION_SECRET,
    cookie: {
        maxAge: 3.6e+6
    },
    resave: true,
    saveUninitialized: true
}))

doctorRouter.use('/patient/uploads', isDoctorAuthenticated, express.static('uploads'))

doctorRouter.get('/', isDoctorAuthenticated, (req, res) => {
    User.find()
        .then(data => {
            res.render('selectUser', {
                patients: data
            })
        })
})

doctorRouter.get('/patient/:username', (req, res) => {
    const { username } = req.params
    User.findOne({ username })
        .then(data => {
            res.render('userReport', data)
        })
})

doctorRouter.get('/login', (req, res) => {
    if (!req.session.DoctorLoggedIn) {
        res.status(401).render('doctorLogin')
    } else {
        res.redirect('/doctor')
    }
})

doctorRouter.post('/login', (req, res) => {
    const { username, password } = req.body
    DoctorAuthentication.findOne({ username })
        .then(async data => {
            if (await compare(password, data.password)) {
                req.session.DoctorLoggedIn = true
                req.session.doctorName = username
                if (req.session.path == undefined) {
                    return res.redirect('/doctor')
                }
                return res.redirect(req.session.path)
            } else {
                return res.status(401).render('doctorLogin', {
                    comment: 'Incorrect Username or Password'
                })
            }

        })
        .catch(err => {
            console.error(err)
            return res.status(401).render('doctorLogin', {
                comment: 'Incorrect Username or Password'
            })
        })
})

doctorRouter.post('/patient/comment/:username', isDoctorAuthenticated, async (req, res) => {
    const { chats } = req.body
    User.findOneAndUpdate({ username: req.params.username }, { $push: { chats: { name: `${req.session.doctorName} (Doctor)`, msg: chats } } }, { new: true })
        .then(updatedData => {
            res.json(updatedData.chats)
        })
        .catch(err => {
            console.error(err.message)
            res.status(500).json({
                error: err.message
            })
        })
})

doctorRouter.get('/patient/comment/:username', isDoctorAuthenticated, async (req, res) => {
    const data = await User.findOne({ username: req.params.username })
    res.render('comments', {
        chats: data.chats
    })
})

doctorRouter.get('/patient/comment/:username/get', isDoctorAuthenticated, async (req, res) => {
    const data = await User.findOne({ username: req.params.username })
    res.render('renderComments', {
        chats: data.chats
    })
})

doctorRouter.get('/logout', isDoctorAuthenticated, (req, res) => {
    req.session.DoctorLoggedIn = false
    req.session.destroy()
    res.redirect('/doctor/login')
})

module.exports = doctorRouter
const express = require('express')
const doctorRouter = express.Router()
const DoctorAuthentication = require('../models/doctorAuthenticationModel')
const { isDoctorAuthenticated } = require('../middleware/userAuthentication')
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

doctorRouter.use('/patient/uploads', express.static('uploads'))

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
        res.render('doctorLogin')
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
                req.session.userName = username
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

doctorRouter.get('/signUp', (req, res) => {
    res.render('userSignUp')
})

doctorRouter.post('/signUp', async (req, res) => {
    const { username, password } = req.body
    console.log(username, password)
    const hashedPassword = await hash(password, await genSalt(10))
    new DoctorAuthentication({
        username,
        password: hashedPassword
    }).save()
        .then(() => {
            console.log('saved')
            res.render('userCreated')
        })
        .catch(err => {
            console.error(`user creation failed: ${err.message}`)
            res.render('error', {
                error: `${err.message}`
            })
        })
})

doctorRouter.get('/logout', isDoctorAuthenticated, (req, res) => {
    req.session.DoctorLoggedIn = false
    res.redirect('/doctor/login')
})

module.exports = doctorRouter
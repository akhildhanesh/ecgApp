const express = require('express')
const adminRouter = express.Router()
const DoctorAuthentication = require('../models/doctorAuthenticationModel')
const { isAdminAuthenticated } = require('../middleware/userAuthentication')
const { genSalt, hash, compare } = require('bcrypt')
const session = require('express-session')

require('dotenv').config()

const user = process.env.USER_NAME
const hashedPassword = process.env.HASHED_PASSWORD

adminRouter.use(session({
    secret: process.env.SESSION_SECRET,
    cookie: {
        maxAge: 3.6e+6
    },
    resave: true,
    saveUninitialized: true
}))


adminRouter.get('/', isAdminAuthenticated, (req, res) => {
    res.render('createDoctor')
})

adminRouter.get('/login', (req, res) => {
    if (!req.session.AdminLoggedIn) {
        res.status(401).render('adminLogin')
    } else {
        res.redirect('/admin')
    }
})

adminRouter.post('/login', async (req, res) => {
    const { username, password } = req.body
    if (username != user) {
        return res.status(401).render('adminLogin', {
            comment: 'Incorrect Username or Password'
        })
    }
    if (await compare(password, hashedPassword)) {
        req.session.AdminLoggedIn = true
        req.session.adminName = username
        if (req.session.path == undefined) {
            return res.redirect('/admin')
        }
        return res.redirect(req.session.path)
    } else {
        return res.status(401).render('adminLogin', {
            comment: 'Incorrect Username or Password'
        })
    }
})

adminRouter.post('/create', async (req, res) => {
    const { username, password } = req.body
    const hashedPassword = await hash(password, await genSalt(10))
    new DoctorAuthentication({
        username,
        password: hashedPassword
    }).save()
        .then(() => {
            console.log('saved')
            res.render('doctorCreated')
        })
        .catch(err => {
            console.error(`user creation failed: ${err.message}`)
            res.render('error', {
                error: `${err.message}`
            })
        })
})

adminRouter.post('/verify', (req, res) => {
    const { username } = req.body
    DoctorAuthentication.findOne({ username })
        .then(data => {
            if (data === null) return res.send()
            return res.send('Sorry, the username is already taken')
        })
        .catch(err => {
            return res.send(err.message)
        })
})

adminRouter.get('/logout', isAdminAuthenticated, (req, res) => {
    req.session.AdminLoggedIn = false
    req.session.destroy()
    res.redirect('/admin/login')
})

module.exports = adminRouter
const express = require('express')
const userRouter = express.Router()
const UserAuthentication = require('../models/userAuthenticationModel')
const User = require('../models/userModel')
const { genSalt, hash, compare } = require('bcrypt')
const session = require('express-session')
const { isAuthenticated } = require('../middleware/userAuthentication')
const multer = require('multer')
const sharp = require('sharp')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname);
    },
});

const upload = multer({ storage: storage });
require('dotenv').config()

userRouter.use(session({
    secret: process.env.SESSION_SECRET,
    cookie: {
        maxAge: 3.6e+6
    },
    resave: true,
    saveUninitialized: true
}))

userRouter.use('/uploads', isAuthenticated, express.static('uploads'))

userRouter.get('/', isAuthenticated, (req, res) => {
    User.findOne({ username: req.session.userName })
        .then(data => {
            if (data === null) {
                return res.render('addDetails')
            }
            return res.render('home', data)
        })
})

userRouter.get('/login', (req, res) => {
    if (!req.session.UserLoggedIn) {
        res.status(401).render('userLogin')
    } else {
        res.redirect('/')
    }
})

userRouter.post('/login', (req, res) => {
    const { username, password } = req.body
    UserAuthentication.findOne({ username })
        .then(async data => {
            if (await compare(password, data.password)) {
                req.session.UserLoggedIn = true
                req.session.userName = username
                if (req.session.path == undefined) {
                    return res.redirect('/')
                }
                return res.redirect(req.session.path)
            } else {
                return res.status(401).render('userLogin', {
                    comment: 'Incorrect Username or Password'
                })
            }

        })
        .catch(() => {
            return res.status(401).render('userLogin', {
                comment: 'Incorrect Username or Password'
            })
        })
})

userRouter.get('/signUp', (req, res) => {
    res.render('userSignUp')
})

userRouter.post('/verify', (req, res) => {
    const { username } = req.body
    UserAuthentication.findOne({ username })
        .then(data => {
            if (data === null) return res.send()
            return res.send('Sorry, the username is already taken')
        })
        .catch(err => {
            return res.send(err.message)
        })
})

userRouter.post('/signUp', async (req, res) => {
    const { username, password } = req.body
    console.log(username, password)
    const hashedPassword = await hash(password, await genSalt(10))
    new UserAuthentication({
        username,
        password: hashedPassword
    }).save()
        .then(() => {
            console.log('saved')
            // res.render('userCreated')
            req.session.UserLoggedIn = true
            req.session.userName = username
            res.redirect('/')
        })
        .catch(err => {
            console.error(`user creation failed: ${err.message}`)
            // res.render('error', {
            //     error: `${err.message}`
            // })
        })
})

userRouter.post('/addDetails', upload.single('profileImage'), (req, res) => {
    sharp(`./${req.file.path}`)
        .resize(300)
        .toFormat('webp')
        .webp({ quality: 100 })
        .toFile(`${req.file.path.split('.')[0]}.webp`)
        .then(() => {
            new User({
                username: req.session.userName,
                ...req.body,
                image: `${req.file.path.split('.')[0]}.webp`
            }).save()
                .then(() => {
                    return res.redirect('/')
                })
                .catch(() => {
                    res.render('addDetails')
                })
        })
        .catch(() => {
            new User({
                username: req.session.userName,
                ...req.body,
                image: `${req.file.path}`
            }).save()
                .then(() => {
                    return res.redirect('/')
                })
                .catch(() => {
                    res.render('addDetails')
                })
    })
})

userRouter.post('/editDetails', upload.single('profileImage'), async (req, res) => {
    if (req.file?.path) {
        await sharp(`./${req.file.path}`)
            .resize(300)
            .toFormat('webp')
            .webp({ quality: 100 })
            .toFile(`${req.file.path.split('.')[0]}.webp`)
        req.body.image = `${req.file.path.split('.')[0]}.webp`
    }
    User.findOneAndUpdate({ username: req.session.userName }, {
        ...req.body,
    })
        .then(() => {
            return res.redirect('/')
        })
        .catch(() => {
            res.render('addDetails')
        })
})

userRouter.get('/editDetails', upload.single('profileImage'), (req, res) => {
    User.findOne({ username: req.session.userName })
        .then(data => {
            res.render('editDetails', data)
        })
})

// userRouter.post('/uploadECG', upload.single('ecgImage'), (req, res) => {
//     User.findOneAndUpdate({ username: req.session.userName }, {ecg: req.file.path})
//         .then(() => {
//         res.render('uploaded')
//         })
//         .catch(err => {
//         res.redirect('/')
//     })
// })

userRouter.post('/uploadECG', upload.array('ecgImage'), (req, res) => {
    const paths = req.files.map(file => file.path)
    const newPaths = paths.map(path => {
        if (path.split('.')[1] === 'webp') return path
        sharp(`./${path}`)
            .toFormat('webp')
            .webp({ quality: 100 })
            .toFile(`${path.split('.')[0]}.webp`)
        return `${path.split('.')[0]}.webp`
    })
    User.findOneAndUpdate({ username: req.session.userName }, { ecg: newPaths })
        .then(() => {
            res.render('uploaded')
        })
        .catch(err => {
            console.log(err)
            res.redirect('/')
        })
})

userRouter.post('/comment', isAuthenticated, async (req, res) => {
    const { chats } = req.body
    User.findOneAndUpdate({ username: req.session.userName }, { $push: { chats: { name: req.session.userName, msg: chats } } }, { new: true })
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

userRouter.get('/comment', isAuthenticated, async (req, res) => {
    const data = await User.findOne({ username: req.session.userName })
    res.render('comments', {
        chats: data.chats
    })
})

userRouter.get('/comment/get', isAuthenticated, async (req, res) => {
    const data = await User.findOne({ username: req.session.userName })
    res.render('renderComments', {
        chats: data.chats
    })
})

userRouter.get('/logout', isAuthenticated, (req, res) => {
    req.session.UserLoggedIn = false
    res.redirect('/login')
})

module.exports = userRouter
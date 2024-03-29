const express = require('express')
const app = express()
const userRouter = require('./routers/user')
const doctorRouter = require('./routers/doctor')
const adminRouter = require('./routers/admin')
require('./db/config')
const { mkdir } = require('node:fs/promises')
// const { default: helmet } = require('helmet')

mkdir('uploads')
    .catch(() => { })

const PORT = process.env.PORT || 8081

// app.use(helmet())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

app.set('view engine', 'hbs')

app.use('/', userRouter)
app.use('/doctor', doctorRouter)
app.use('/admin', adminRouter)

app.use('*', (req, res, next) => {
    return res.render('404')
})

app.listen(PORT, () => {
    console.log(`server running on PORT: ${PORT}`)
})
const express = require('express')
const app = express()
const userRouter = require('./routers/user')
const doctorRouter = require('./routers/doctor')
require('./db/config')

const PORT = process.env.PORT || 8081

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.set('view engine', 'hbs')

app.use('/', userRouter)
app.use('/doctor', doctorRouter)

app.listen(PORT, () => {
    console.log(`server running on PORT: ${PORT}`)
})
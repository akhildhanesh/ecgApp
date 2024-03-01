const isAuthenticated = (req, res, next) => {
    if (req.session.UserLoggedIn) {
        next()
    } else {
        req.session.path = req._parsedOriginalUrl.path
        return res.redirect('/login')
    }
}

const isDoctorAuthenticated = (req, res, next) => {
    if (req.session.DoctorLoggedIn) {
        next()
    } else {
        req.session.path = req._parsedOriginalUrl.path
        return res.redirect('/doctor/login')
    }
}


module.exports = {
    isAuthenticated,
    isDoctorAuthenticated
}
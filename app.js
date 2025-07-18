const express = require('express');
const app = express()
const PATH = 6050
const cors = require('cors')
const {checkuser, finduserbyid, Signup} = require('./queries')
const homepage = require('./routes/homepage')
const {PrismaSessionStore} = require('@quixo3/prisma-session-store')
const {PrismaClient} = require('@prisma/client')
const session = require('express-session');
const passport = require('passport');
const {Strategy: LocalStrategy} = require('passport-local');
const bcrypt = require('bcrypt')
const prisma = new PrismaClient()
const URL = "http://127.0.0.1:5500"
const corsOptions = {
    "origin": `${URL}`,
    "methods": "GET,PUT,POST",
    "allowedHeaders": ['Content-Type', 'Authorization'],
    "credentials": true,
    "maxAge":840000,
    "preflightContinue": false,
    "optionsSuccessStatus": 204
} 
app.use(cors(corsOptions))


app.use(session({
    secret: "honeyyesdafdkfljasf",
    cookie: {
        maxAge: 604800* 1000,
    },
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(prisma, {
        checkPeriod: 2 * 60 * 1000,  //ms
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined,
      })
}))


app.use(express.json())
app.use(passport.initialize())
app.use(passport.session())
app.use('/home', homepage)
const customfields = {
    usernameField: "email", 
    passwordField: "password"
}

const callback = async (email, password, done) => {
    const user = await checkuser(email);
    if (!user) {
        return done(null, false, {message: "email not Found"})
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
        return done(null, false, {message: "invalid Password"})
    }
    return done(null, user)
} 
const strategy = new LocalStrategy(customfields, callback)
passport.use(strategy)
const functiond = async (userid, done) => {
    const user = await finduserbyid(userid)
    if (!user) {
        return done(new Error("usernot found"))
    }
    return done(null,user)
}
passport.serializeUser((user, done)=>{
    return done(null,user.id)
})
passport.deserializeUser(functiond)

app.post('/login',(req, res, next)=>{
    passport.authenticate('local', (err, user, info)=>{
        if (err) return next(err);
        if (!user) {
            return res.status(401).json({message:"Email or Password is incorrect"})
        }
        req.login(user, (err)=>{
            if (err) {return next(err)}
            return res.json({message:"Login successful", user})
        })
    })(req, res, next)
})





app.get('/logout', async (req, res, next)=> {
    await req.logout()
    res.json("logged-out")
})

app.post('/signup', async (req, res, next)=> {
    const username = req.body.username
    const email = req.body.email
    const password = req.body.password
    const hashedpass = await bcrypt.hash(password, 10)
    const data = await Signup(username, hashedpass,email)
    if (!data.success) {
        return res.json({message: data.message})
    }
    return res.json({ message: "Signup successful" });
})



// app.use(cors()) // enables all the cors request okah so 


app.get('/', (req, res)=> {
    //  res.set('Cache-Control', 'max-age=1209600, public must-revalidate') // no-store and no-cache also for shared proxy-revalidate public to always cache private for client side store public is sahred cache ok s-maxage 
   res.send("hi")
})

// here just send cache control respective headers using Cache Controls 
app.listen(PATH, ()=> {
    console.log(`listening to Port ${PATH}`)
})



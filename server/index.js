const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
const User = require("./models/UserModel")
const Question = require("./models/QuestionModel")
require('dotenv').config()

const getTotalQuestions = async () => {
	let number = await Question.countDocuments({});
	return number;
};

const app = express()
const corsOpts = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'HEAD', 'PUT', 'PATCH', 'DELETE'],
  exposedHeaders: ['Content-Type', 'x-access-token']
};
app.use(cors(corsOpts));
app.use(express.json())
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});
const PORT = 8080
mongoose.connect(process.env.MONGO_URI);

app.get('/', (req, res) => {
  res.json({ message: "owo what are you doing here?" })
})


app.post('/api/register', async (req, res) => {
  const newPassword = await bcrypt.hash(req.body.pass, 10)
  try {
    await User.create({
      username: req.body.username,
      email: req.body.email,
      password: newPassword,
    })
    res.json({ status: 'ok' })
  } catch (error) {
    res.json({ status: 'error', error: 'Duplicate email' })
  }
})

app.get('/api/getQuestion', async (req, res) => {
  const token = req.headers['x-access-token']
  try {
    const decoded = jwt.verify(token, 'secret123')
    const email = decoded.email
    const user = await User.findOne({ email: email })
    const question = await Question.findOne({ question: `${user.level}` });
    return res.json({ status: 'ok', data: question })
  } catch (error) {
    res.json({ status: 'error', error: 'invalid token' })
  }
})

app.post('/api/login', async (req, res) => {
  const user = await User.findOne({
    email: req.body.email,
  })

  if (!user) {
    return { status: 'error', error: 'Invalid login' }
  }

  const isPasswordValid = await bcrypt.compare(
    req.body.pass,
    user.password
  )

  if (isPasswordValid) {
    const token = jwt.sign(
      {
        username: user.username,
        email: user.email,
        level: user.level,
        lastUpdate: user.lastUpdate
      },
      'secret123'
    )

    return res.json({ status: 'ok', user: token })
  } else {
    return res.json({ status: 'error', user: false })
  }
})

app.get("/api/getData", async (req, res) => {
  const token = req.headers['x-access-token']

  try {
    const decoded = jwt.verify(token, 'secret123')
    const email = decoded.email
    const user = await User.findOne({ email: email })

    return res.json({ status: 'ok', data: user })
  } catch (error) {
    res.json({ status: 'error', error: 'invalid token' })
  }
})

app.post("/api/checkAnswer", async (req, res) => {
  const token = req.headers['x-access-token']
  const answer = req.body.answer
  try {
    const decoded = jwt.verify(token, 'secret123')
    const email = decoded.email
    const user = await User.findOne({ email: email })
    const question = await Question.findOne({ question: `${user.level}` });
    if (question.answer === answer) {
    return res.json({ status: 'ok', correct: true })
    } else {
    return res.json({ status: 'ok', correct: false })
    }
  } catch (error) {
    res.json({ status: 'error', error: 'invalid token' })
  }
})

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`)
})

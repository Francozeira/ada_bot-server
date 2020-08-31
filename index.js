const express = require('express')
const app = express()
const http = require('http').createServer(app)
const bodyParser = require('body-parser')
const routes = require('./src/routes')
var cors = require('cors')
app.options('*', cors())
app.use(cors())

app.use(bodyParser.json())
app.use(routes)

http.listen(process.env.PORT, () => {
	console.log(`Listening at port ${process.env.PORT}`)
})
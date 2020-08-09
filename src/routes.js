const express = require('express')
const router = express.Router()
const main = require('./main')

router.get('/', (req, res) => {
	res.status(200).send('Olá, você acessou o chatbot Ada')
})

router.post('/api/messages', main.receiveMessage)


module.exports = router
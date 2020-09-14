const express = require('express')
const router = express.Router()
const main = require('./integrations/main')
const webhooks = require('./integrations/webhooks')

router.get('/', (req, res) => {
	res.status(200).send('Olá, você acessou o chatbot Ada 13/09')
})

router.post('/api/messages', main.receiveMessage)

router.post('/', (req,res) => {
	if(!req.body)
		return res.status(400).json({
			status:400,
			content:'Missing Body'
		})
	if(!req.body.route)
		return res.status(400).json({
			status:400,
			content:'Missing Route'
		})
	
	req.url = req.body.route
	router.handle(req, res)
})

router.post('/courseInfo', ( req , res ) => {
	
	if(!req.body)
		return res.status(400).json({
			status:400,
			content:'Missing Body'
		})
	if(!req.body.courseName)
		return res.status(400).json({
			status:400,
			content:'Missing Info'
		})
		
	const input = {
		courseName: req.body.courseName,
	}

	webhooks.courseInfo(input).then((output)=>{
		res.status(200).json(output)
	})
		.catch((err)=>{
			res.status(500)
				.json({
					error: err.error,
					msg: err.msg
				})
		})

})


module.exports = router
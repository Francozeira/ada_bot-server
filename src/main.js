const uuidv1 = require('uuid/v1')
const AssistantV2 = require('ibm-watson/assistant/v2')
const { IamAuthenticator } = require('ibm-watson/auth')
const Cloudant = require('@cloudant/cloudant')

// WATSON ASSISTANT
const assistant = new AssistantV2({
	version: process.env.WA_VERSION,
	authenticator: new IamAuthenticator({
		apikey: process.env.WA_IAM_APIKEY,
	}),
	url: process.env.WA_URL,
})

// CLOUDANT DB
const cloudant = Cloudant({ 
	account: process.env.CL_ACC, 
	plugins: ['retry',{ iamauth: { iamApiKey: process.env.CL_IAM_APIKEY } } ]
})
cloudant.db.use(process.env.DB_NAME)

cloudant.db.list().then((body) => {
	body.forEach((db) => {
		console.log(db)
	})
}).catch((err) => { console.log(err) })

// GENERATE RANDOM STRING
function generateID() {
	return uuidv1()
}


async function receiveMessage (req, res) {
	const message = req.body
	console.log('message :>> ', message)

	var session = null

	await assistant.createSession({
		assistantId: process.env.WA_ASSISTANT_ID
	})
		.then(res => {
			console.log(JSON.stringify(res.result, null, 2))
			session = res.result.session_id
		})
		.catch(err => {
			console.log(err)
		})

	assistant.message({
		assistantId: process.env.WA_ASSISTANT_ID,
		sessionId: session,
		input: {
			'message_type': message.text,
			'text': 'hi'
		}
	})
		.then(res => {
			console.log(JSON.stringify(res.result, null, 2))
		})
		.catch(err => {
			console.log(err)
		})

	res.send({ message: 'ok' })
}

module.exports.receiveMessage = receiveMessage
const AssistantV2 = require('ibm-watson/assistant/v2')
const { IamAuthenticator } = require('ibm-watson/auth')
const cloudant = require('./cloudant')

// WATSON ASSISTANT
const assistant = new AssistantV2({
	version: process.env.WA_VERSION,
	authenticator: new IamAuthenticator({
		apikey: process.env.WA_IAM_APIKEY,
	}),
	url: process.env.WA_URL,
})

// RECEIVE USER MESSAGE, SAVE IT ON DB AND SEND IT TO WATSON 
async function receiveMessage (req, res) {
	const message = req.body
	console.log(`Info :>> User ${message.user_id} message received: ${message.text}`)

	const activeSession =	await getActiveSessionFromUser(message)

	// assistant.message({
	// 	assistantId: process.env.WA_ASSISTANT_ID,
	// 	sessionId: createdSession.result.session_id,
	// 	input: {
	// 		'message_type': message.type,
	// 		'text': message.text
	// 	}
	// })
	// 	.then(res => {
	// 		console.log(JSON.stringify(res.result, null, 2))
	// 	})
	// 	.catch(err => {
	// 		console.log(err)
	// 	})

	res.send({ message: 'ok' })
}

// GET USER ACTIVE SESSIONS
const getActiveSessionFromUser = async message => {
	const activeSession = await cloudant.activeSessionCheck(message.user_id)

	if (activeSession === null) {
		console.log(`Info :>> No ${message.user_id} active sessions found`)

		const createdSession = await createSession()
		return createdSession

	}
	else {
		console.log(`Info :>> ${message.user_id} active session found: ${activeSession._id}`)
		return activeSession
	}
}

// CREATES WATSON SESSION 
const createSession = async () => {

	const createdSession = await assistant.createSession({
		assistantId: process.env.WA_ASSISTANT_ID
	})
		.catch (err => {
			console.error('Watson Error (createSession) :>> ', err.message)
			return err
		})

	console.log(`Info :>> Created new WATSON session: ${createdSession.result.session_id}`)
	return createdSession.result.session_id
}

module.exports.receiveMessage = receiveMessage
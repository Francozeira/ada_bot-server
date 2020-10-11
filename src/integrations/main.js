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

// RECEIVE USER MESSAGE AND ORCHESTRATE ANSWER
async function receiveMessage (req, res) {
	let userMessage = req.body
	console.log(`Info :>> User ${userMessage.user_id} message received: ${userMessage.content}`)

	let activeSession =	await getActiveSessionFromUser(userMessage)
	let msgReply = await sendMessageToWA(activeSession, userMessage)

	// CASE OF WA SESSION EXPIRED
	if (msgReply === undefined) {
		activeSession =	await getActiveSessionFromUser(userMessage)
		msgReply = await sendMessageToWA(activeSession, userMessage)
	}

	// UPDATES USER MESSAGE VARIABLE TO SAVE IT IN DB
	userMessage.session_id = activeSession._id
	userMessage.intents = msgReply.result.output.intents
	userMessage.entities = msgReply.result.output.entities
	
	// CREATES BOT MESSAGE VARIABLE TO SAVE IT IN DB
	const botMessage = {
		session_id: activeSession._id,
		message: {
			type : msgReply.result.output.generic[0].response_type,
			content : msgReply.result.output.generic[0].text
		}
	}

	await Promise.all([
		cloudant.saveUserMessage(userMessage),
		cloudant.saveBotMessage(botMessage)
	])

	res.send({ message: msgReply.result.output.generic[0].text})
}

// GET USER ACTIVE SESSIONS
const getActiveSessionFromUser = async message => {
	const activeSession = await cloudant.activeSessionCheck(message.user_id)

	if (activeSession === null) {
		console.log(`Info :>> No ${message.user_id} active sessions found`)

		const createdWASession = await createWASession()
		const createdSession = await cloudant.createSession(message.user_id, createdWASession)
		console.log(`Info :>> Created new ${message.user_id} session: ${createdSession._id}`)
		return createdSession

	}
	else {
		console.log(`Info :>> ${message.user_id} active session found: ${activeSession._id}`)
		return activeSession
	}
}

// CREATE WATSON SESSION 
const createWASession = async () => {
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

// USE AN ACTIVE SESSION TO SEND A NEW MESSAGE TO WATSON ASSISTANT
const sendMessageToWA = async (activeSession, message) => {

	let watsonMessageReturn = await assistant.message({
		assistantId: process.env.WA_ASSISTANT_ID,
		sessionId: activeSession.watson_session_id,
		input: {
			'message_type': message.type,
			'text': message.text
		}
	})

		.catch(async err => {
			
			if(err.message === 'Invalid Session') {
				console.log('Info :>> Invalid Session')

				await Promise.all([
					cloudant.invalidateSession(activeSession),
					getActiveSessionFromUser(message)
				])

			} else {
				console.error('Watson Error (sendMessageToWA) :>> ', err.message)
			}
		})

	return watsonMessageReturn
		
}


module.exports.receiveMessage = receiveMessage
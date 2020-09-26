const uuidv1 = require('uuid/v1')
const Cloudant = require('@cloudant/cloudant')

// CLOUDANT DB
const dBConnect = Cloudant({ 
	account: process.env.CL_ACC, 
	plugins: ['retry',{ iamauth: { iamApiKey: process.env.CL_IAM_APIKEY } } ]
})
const cloudant = dBConnect.db.use(process.env.DB_NAME)

// GENERATE RANDOM STRING
function generateID() {
	return uuidv1()
}

// SAVE NEW USER MESSAGE
const saveUserMessage = async userMsg => {
	userMsg.timestamp = Date.now()
	userMsg._id = 'user_msg:' + generateID()
	
	cloudant.insert(userMsg)
		.catch (err => {
			console.error('Cloudant Error (saveUserMessage) :>> ', err)
		})
}

// SAVE NEW BOT MESSAGE
const saveBotMessage = async botMessage => {
	botMessage.timestamp = Date.now()
	botMessage._id = 'bot_msg:' + generateID()
	
	cloudant.insert(botMessage)
		.catch (err => {
			console.error('Cloudant Error (saveBotMessage) :>> ', err)
		})
}

// CHECK FOR ACTIVE 

const activeSessionCheck = async user_id => {
	const activeUsersession = await cloudant.search('Partitioned', 'getSessionById', { q: `enabled: true AND user_id: "${user_id}"`, partition: 'session', include_docs: true })

	if (activeUsersession.rows.length === 0) {
		return null
	}

	else if (activeUsersession.rows.length === 1) {
		return activeUsersession.rows[0].doc

	} else {
		console.error(`Logical Error (activeSessionCheck) :>> ${activeUsersession.rows.length} active session found`)
	}
}

// CREATE NEW SESSION
const createSession = async (user_id, watson_session_id) => {
	const session = {
		_id: 'session:' + generateID(),
		createdAt: Date.now(),
		watson_session_id: watson_session_id,
		user_id: user_id,
		enabled: true
	}	
	await cloudant.insert(session)
		.catch (err => {
			console.error('Cloudant Error (createSession) :>> ', err)
		})

	return session

}

// CREATE NEW SESSION
const invalidateSession = async sessionToInvalidate => {
	sessionToInvalidate.enabled = false
	await cloudant.insert(sessionToInvalidate)
		.catch (err => {
			console.error('Cloudant Error (createSession) :>> ', err)
		})

	return

}

module.exports.saveUserMessage = saveUserMessage
module.exports.saveBotMessage = saveBotMessage
module.exports.activeSessionCheck = activeSessionCheck
module.exports.createSession = createSession
module.exports.invalidateSession = invalidateSession
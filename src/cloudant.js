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
async function saveUserMessage (message) {
	const userMsg = {
		_id: 'user_msg:' + generateID(),
		timeStamp: Date.now(),
		intents: [],
		message: {
			type: message.type,
			content: message.text
		},
		session_id: null,
		enabled: true
	}	
	cloudant.insert(userMsg)

		.catch (err => {
			console.error('Cloudant Error (saveUserMessage) :>> ', err)
		})
}

// CHECK FOR ACTIVE SESSION
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
		updatedAt: Date.now(),
		intents: [],
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
module.exports.activeSessionCheck = activeSessionCheck
module.exports.createSession = createSession
module.exports.invalidateSession = invalidateSession
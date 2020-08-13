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

const activeSessionCheck = async user_id => {
	const activeUsersession = await cloudant.search('Partitioned', 'getSessionById', { q: `active: true && user_id: "${user_id}"`, partition: 'session', include_docs: true })

	if (activeUsersession.rows.length === 0) {
		return null
	}

	else if (activeUsersession.rows.length === 1) {
		return activeUsersession.rows[0].doc

	} else {
		console.error(`Logical Error (activeSessionCheck) :>> ${activeUsersession.rows.length} active session found`)
	}
}

module.exports.saveUserMessage = saveUserMessage
module.exports.activeSessionCheck = activeSessionCheck
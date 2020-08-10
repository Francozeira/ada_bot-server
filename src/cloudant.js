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
		session_id: null
	}	
	cloudant.insert(userMsg)

		.catch (err => {
			console.error('Cloudant Error (saveUserMessage) :>> ', err)
		})
}

module.exports.saveUserMessage = saveUserMessage
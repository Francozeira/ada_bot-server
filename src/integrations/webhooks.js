const coursesInfoArray = require('../utils/courseInfos.json')

async function courseInfo (input) {
	return new Promise((resolve, reject) =>{

		const infoRes = coursesInfoArray.courses.find(course => course.name === input.courseName)

			.catch( () => {
				reject.status(500)
					.json({
						error: 1,
						msg: 'Problem reading JSON file'
					})
			})

		if (infoRes === undefined) {
			resolve({ error:2, msg:'Curso não cadastrado no sistema!'})
			return
		} else {
			resolve({ ...infoRes })
		}

	})
}


module.exports.courseInfo = courseInfo
const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const cors = require('cors')
const app = express()
const port = 876

app.use(bodyParser.json(), cors())

app.post('/store', (req, res) => {
	const {data} = req.body
	if (!data) return res.status(400).send('No data provided')
	fs.appendFile('passwords.txt', data + '\n', (err) => {
		if (err) throw err
		res.send('Password stored successfully!')
	})
})

app.post('/retrieve', (req, res) => {
	const {domain} = req.body
	if (!domain) return res.status(400).send('No data provided')
	fs.readFile('passwords.txt', 'utf8', (err, data) => {
		if (err) throw err
		const lines = data.split('\n').filter((line) => line.startsWith(domain))
		res.json(lines)
	})
})

app.post('/update', (req, res) => {
	const {item, data} = req.body
	if (isNaN(item) || !data) return res.status(400).send('No data provided')

	fs.readFile('passwords.txt', 'utf8', (err, fileData) => {
		if (err) return res.status(500).send('Error reading file')

		const lines = fileData.split('\n')
		let lineFound = false

		const updatedLines = lines.map((line, index) => {
			if (index === item) {
				lineFound = true
				return data
			}
			return line
		})
		if (!lineFound) return res.status(404).send('Item not found')

		fs.writeFile('passwords.txt', updatedLines.join('\n'), (err) => {
			if (err) return res.status(500).send('Error writing file')
			res.send('Password updated successfully!')
		})
	})
})
app.listen(port, () => console.log(`Server started on port ${port}`))

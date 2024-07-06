
;(async () => {
	const result = await chrome.storage.local.get(['key', 'apiUrl'])
	let key = new Uint8Array(result.key),
		apiUrl = result.apiUrl

	document.getElementById('saveForm').addEventListener('submit', async function (e) {
		e.preventDefault()

		const username = document.getElementById('username').value
		const password = document.getElementById('password').value

		const encryptedDomain = await deterministicEncrypt(website, key)
		const encryptedUsername = await encrypt(username, key)
		const encryptedPassword = await encrypt(password, key)
		const encryptedData = `${encryptedDomain}: ${encryptedUsername} ${encryptedPassword}`

		fetch(apiUrl + '/store', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({data: encryptedData})
		})
			.then((response) => response.text())
			.then((data) => alert(data))
	})

	document.getElementById('retrieveButton').addEventListener('click', async function () {
		const encryptedDomain = await deterministicEncrypt(website, key)

		fetch(apiUrl + '/retrieve', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({domain: encryptedDomain})
		})
			.then((response) => response.json())
			.then(async (data) => {
				const decryptedData = await Promise.all(
					data.map(async (item) => {
						const [encDomain, encCredentials] = item.split(': ')
						const [encUsername, encPassword] = encCredentials.split(' ')
						const username = await decrypt(encUsername, key)
						const password = await decrypt(encPassword, key)
						return {username, password}
					})
				)

				populateTable(decryptedData, apiUrl, key)
			})
	})
})()

document.getElementById('generate').addEventListener('click', async function () { 
	const password = generatePassword()
	const passwordField = document.getElementById('generatedPassword')
	passwordField.innerText = password
	passwordField.classList.remove('hidden')
})

document.getElementById('generatedPassword').addEventListener('click', async (event) => {
	const element = event.target
	const text = element.innerText

	await copyToClipboard(text, element)
})
document.addEventListener('DOMContentLoaded', function () {
	chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
		let activeTab = tabs[0]
		let activeTabUrl = new URL(activeTab.url)
		window.website = activeTabUrl.hostname
	})
})
let website = window.website
function encrypt(text, key) {
	const iv = crypto.getRandomValues(new Uint8Array(16))
	const cipher = new TextEncoder().encode(text)
	return window.crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt']).then((cryptoKey) =>
		window.crypto.subtle
			.encrypt(
				{
					name: 'AES-GCM',
					iv: iv
				},
				cryptoKey,
				cipher
			)
			.then((encrypted) => {
				const encryptedArray = new Uint8Array(encrypted)
				const result = new Uint8Array(iv.byteLength + encryptedArray.byteLength)
				result.set(iv, 0)
				result.set(encryptedArray, iv.byteLength)
				return btoa(String.fromCharCode.apply(null, result))
			})
	)
}

const deterministicEncrypt = async (text, key) =>
	Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', await crypto.subtle.importKey('raw', new TextEncoder().encode(key), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']), new TextEncoder().encode(text))))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')

function decrypt(text, key) {
	const data = atob(text)
		.split('')
		.map((char) => char.charCodeAt(0))
	const iv = new Uint8Array(data.slice(0, 16))
	const encryptedData = new Uint8Array(data.slice(16))
	return window.crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['decrypt']).then((cryptoKey) =>
		window.crypto.subtle
			.decrypt(
				{
					name: 'AES-GCM',
					iv: iv
				},
				cryptoKey,
				encryptedData
			)
			.then((decrypted) => new TextDecoder().decode(decrypted))
	)
}
function generatePassword(length = 16) {
	const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-='
	const password = []
	const values = crypto.getRandomValues(new Uint8Array(length))
	for (let i = 0; i < length; i++) password.push(charset[values[i] % charset.length])
	return password.join('')
}

function populateTable(data, apiUrl, key) {
	const table = document.getElementById('retrievedData')
	table.classList.remove('hidden')
	const tableBody = table.getElementsByTagName('tbody')[0]
	tableBody.innerHTML = ''

	data.forEach((item) => {
		const row = document.createElement('tr')

		const usernameCell = document.createElement('td')
		usernameCell.innerText = item.username
		usernameCell.addEventListener('click', (event) => copyToClipboard(item.username, event.target, null))
		row.appendChild(usernameCell)

		const passwordCell = document.createElement('td')
		passwordCell.innerText = item.password
		passwordCell.addEventListener('click', (event) => copyToClipboard(item.password, event.target, null))
		row.appendChild(passwordCell)

		const editCell = document.createElement('td')
		editCell.innerText = 'Edit'
		editCell.addEventListener('click', () => editFields(row, apiUrl, key))
		row.appendChild(editCell)

		tableBody.appendChild(row)
	})
}
function editFields(row, apiUrl, key) {
	const usernameCell = row.cells[0]
	const passwordCell = row.cells[1]
	const editCell = row.cells[2]

	const username = usernameCell.innerText
	const password = passwordCell.innerText

	usernameCell.innerHTML = `<textarea>${username}</textarea>`
	passwordCell.innerHTML = `<textarea>${password}</textarea>`

	const usernameTextarea = usernameCell.getElementsByTagName('textarea')[0]
	const passwordTextarea = passwordCell.getElementsByTagName('textarea')[0]
	usernameTextarea.addEventListener('click', (event) => event.stopPropagation())
	passwordTextarea.addEventListener('click', (event) => event.stopPropagation())


	editCell.innerText = 'Save'
    const newEditCell = editCell.cloneNode(true)
	editCell.parentNode.replaceChild(newEditCell, editCell)
	newEditCell.addEventListener('click', () => saveFields(row, apiUrl, key))
}

async function saveFields(row, apiUrl, key) {
	const rowIndex = row.rowIndex - 1
	const usernameInput = row.cells[0].getElementsByTagName('textarea')[0]
	const passwordInput = row.cells[1].getElementsByTagName('textarea')[0]
	
	row.cells[0].innerText = usernameInput.value
	row.cells[1].innerText = passwordInput.value

	const editCell = row.cells[2]
	editCell.innerText = 'Edit'
    const newEditCell = editCell.cloneNode(true)
	editCell.parentNode.replaceChild(newEditCell, editCell)
	newEditCell.addEventListener('click', () => editFields(row, apiUrl, key))
	
	const encryptedDomain = await deterministicEncrypt(window.website, key)
	const encryptedUsername = await encrypt(usernameInput.value, key)
	const encryptedPassword = await encrypt(passwordInput.value, key)
	const encryptedData = `${encryptedDomain}: ${encryptedUsername} ${encryptedPassword}`
	
	fetch(apiUrl + '/update', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({item: rowIndex, data: encryptedData})
	})
		.then((response) => response.text())
		.then((data) => alert(data))
}
async function copyToClipboard(text, element, left = 0) {
	try {
		await navigator.clipboard.writeText(text)

		const copiedMessage = document.createElement('div')
		with (copiedMessage) {
			innerText = 'Copied!'
			style.position = 'absolute'
			style.background = 'rgba(0, 0, 0, 0.8)'
			style.color = 'white'
			style.padding = '5px 10px'
			style.borderRadius = '4px'
			style.zIndex = '1000'
		}

		const rect = element.getBoundingClientRect()
		copiedMessage.style.top = `${rect.top - 30}px`
		left ?? (copiedMessage.style.left = `${rect.left}px`)

		document.body.appendChild(copiedMessage)

		setTimeout(() => copiedMessage.remove(), 2000)
	} catch (err) {
		console.error('Failed to copy: ', err)
	}
}

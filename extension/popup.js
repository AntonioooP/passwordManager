let website;

document.addEventListener('DOMContentLoaded', function () {
	chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
		let activeTab = tabs[0]
		let activeTabUrl = new URL(activeTab.url)
		website = activeTabUrl.hostname
	})
})
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

				document.getElementById('retrievedData').innerText = JSON.stringify(decryptedData, null, 2)
			})
	})
})()

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

function decrypt(text, key) {
	const data = atob(text)
		.split('')
		.map((char) => char.charCodeAt(0))
	const iv = new Uint8Array(data.slice(0, 16))
	const encryptedData = new Uint8Array(data.slice(16))
	return window.crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['decrypt']).then((cryptoKey) =>  window.crypto.subtle
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

const deterministicEncrypt = async (text, key) => Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), new TextEncoder().encode(text)))).map(b => b.toString(16).padStart(2, '0')).join('')
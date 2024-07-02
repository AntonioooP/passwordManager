chrome.runtime.onInstalled.addListener(() => {
	fetch(chrome.runtime.getURL('config.json'))
		.then((response) => response.json())
		.then((config) =>
			chrome.storage.local.set(
				{
					key: config.key,
					apiUrl: config.apiUrl
				},
				() => console.log('Password Manager Extension Installed')
			)
		)
		.catch((error) => console.error('Error loading config:', error))
})

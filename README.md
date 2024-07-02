# Password Manager

This is a password manager application that allows users to *securely* manage their passwords. The application consists of two main components: the backend and a chrome extension. The purpose of building this application was to not rely on any third-party services.

Note that this isn't a project that should be considered as a secure password manager because of the use of encryption, even though it does have a somewhat secure encryption function, it has the risk of having to store a key in a local file. 
## Backend

The backend is responsible for handling API requests, managing passwords, and interacting with the database. It is built using Node.js and Express.js, the database is just a `.txt` file, ideally it would be in a safer database, you are welcome to use any database you want.

### Dependencies

- Express.js: A popular web framework for Node.js.
- Body-parser: Middleware for parsing incoming request bodies.
- Cors: Middleware for enabling CORS.

## Extension

The extension folder is a Chrome extension that allows users to manage their passwords securely within the browser.

### Features

- **index.html:** The main interface for the Password Manager extension. (Needs CSS to be improved)
- **popup.js:** The script responsible for handling interactions within the popup window of the extension. It facilitates functionalities like displaying saved passwords, adding new passwords, and generating secure passwords.

## Installation

To install and run the backend, follow these steps:

1. Clone the repository.
2. Navigate to the `backend` directory.
3. Run `npm i` to install the dependencies.
4. Run `node .` to start the server.

To install and run the extension, follow these steps:

1. Clone the repository.
2. Navigate to the `extension` directory.
3. Load the extension in Chrome by going to `chrome://extensions`, enabling developer mode, and clicking "Load unpacked". Then, select the `extension` directory.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue. Any criticism is not welcome as I don't really care about it. Thank you!
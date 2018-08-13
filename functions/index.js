const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.server-status = functions.https.onRequest((request, response) => {
	response.send("The server is fully operational. All services are running as expected.");
});
exports.hello-world = functions.https.onRequest((request, response) => {
	response.send("Hello from <b>Sniper Angel</b>!");
});

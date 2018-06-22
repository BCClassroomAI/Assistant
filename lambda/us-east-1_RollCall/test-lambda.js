// this file is for testing lambda locally
// once working, it will invoke lambda via lambda-local package

const lambdaLocal = require('lambda-local');

const jsonPayload = require("./local-event.json");

lambdaLocal.execute({
    event: jsonPayload,
    lambdaPath: './index.js',
    callback: function(err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log(data);
        }
    }
});
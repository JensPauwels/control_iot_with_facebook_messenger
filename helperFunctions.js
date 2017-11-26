const request = require('request');
const config = require('./config.json');


const simpleRequest = function (url,sender, messageData) {
  request({
    url: `https://graph.facebook.com/v2.6/me/${url}`,
    qs: { access_token: config.token},
    method: 'POST',
    json: {
      recipient: { id: sender},
      message: messageData
    }
  }, (error, response, body) => {
    if (error) console.log("sending error");
    else if (response.body.error) {
      console.log(`response body error`);
      console.log(Object.keys(response.body.error));
      console.log(Object.values(response.body.error));
    }
  })
};

module.exports = {
  request: simpleRequest
}

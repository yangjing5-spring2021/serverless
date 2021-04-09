'use strict';
const AWS = require("aws-sdk");
AWS.config.update({region: "us-east-1"});
const ses = new AWS.SES({apiVersion: '2010-12-01'});
const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

exports.handler = async function(event) {
    console.log('Received event:', JSON.stringify(event, null, 4));
    const message = event.Records[0].Sns.Message;
    const username = event.Records[0].Sns.MessageAttributes.username.Value;
    console.log('Message received from SNS:', message);
    console.log('Username received from SNS:', username);


    const subject = `Confirmation Email from Book Web App for User ${username}`;
    const body_html = `<html>
    <head></head>
    <body>
      <h1>Confirmation Email</h1>
      <p>${message}</p>
    </body>
    </html>`;
    const SENDER_EMAIL_ADDRESS = 'no-reply-book-app@prod.jingyang.me';
    // Create sendEmail params 
    const params = {
        Destination: { /* required */
            ToAddresses: [
                username,
                /* more items */
            ]
        },
        Message: { /* required */
            Body: { /* required */
                Html: {
                    Charset: "UTF-8",
                    Data: body_html
                },
                Text: {
                    Charset: "UTF-8",
                    Data: message
                }
            },
            Subject: {
                Charset: 'UTF-8',
                Data: subject
            }
        },
        Source: SENDER_EMAIL_ADDRESS
    };

    const DBAddParams = {
        TableName: 'EmailMessages',
        Item: {
          'MessageId' : {S: message}
        }
      };

    const DBQueryParams = {
        TableName: 'EmailMessages',
        Key: {
            'MessageId' : {S: message}
        }
    };

    try {
        const data = await ddb.getItem(DBQueryParams).promise();
         console.log("Success when querying DB", data.Item);
         if (data.Item == null) {
             try {
                 await ddb.putItem(DBAddParams).promise();
                 console.log("Success when adding item", data);
                 return ses.sendEmail(params).promise();
             } catch(err) {
                console.log("Error when adding item ", err);
                return Promise.reject(err);
             }
         }
         console.log("message already sent");
         return Promise.reject("message already sent");
    } catch (err) {
        console.log("Error when querying DB", err);
        return Promise.reject(err);
    }
};
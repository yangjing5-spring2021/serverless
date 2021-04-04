'use strict';

const ses = new AWS.SES({apiVersion: '2010-12-01'}, {region: "us-east-1"});

exports.handler = async function(event) {
    // console.log('Received event:', JSON.stringify(event, null, 4));
    const message = event.Records[0].Sns.Message;
    console.log('Message received from SNS:', message);
    const bookOperation = message.bookLink ? "created" : "deleted";

    const subject = "Confirmation Email from Book Web App";
    
    const linkStringContent = message.bookLink ? 
        `Click this link to check the book you created ${message.bookLink}` : "";
    // The email body for recipients with non-HTML email clients.
    const body_text = `Confirmation Email for User ${message.userEmail}\r\n`
                    + `This email is to confirm that book: ${message.bookId} has been successfully
                    ${bookOperation} for user ${message.userEmail}.\r\n`
                    + linkStringContent;

    // The HTML body of the email.
    const linkContent = message.bookLink ? 
        `<a href='${message.bookLink}'>Click this link to check the book you created</a>` : '';
    
    const body_html = `<html>
    <head></head>
    <body>
      <h1>Confirmation Email for User ${message.userEmail}</h1>
      <p>This email is to confirm that book: ${message.bookId} has been successfully
        ${bookOperation} for user ${message.userEmail}.<br>
        ${linkContent}
      </p>
    </body>
    </html>`;

    const SENDER_EMAIL_ADDRESS = 'sender1@prod.jingyang.me';

    // Create sendEmail params 
    const params = {
        Destination: { /* required */
            ToAddresses: [
                `${message.userEmail}`,
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
                    Data: body_text
                }
            },
            Subject: {
                Charset: 'UTF-8',
                Data: subject
            }
        },
        Source: SENDER_EMAIL_ADDRESS, /* required */
        ReplyToAddresses: [
            SENDER_EMAIL_ADDRESS,
            /* more items */
        ],
    };
  
    // Create the promise and SES service object
    const sendPromise = ses.sendEmail(params).promise();
    
    // Handle promise's fulfilled/rejected states
    sendPromise.then(
        function(data) {
            console.log(data.MessageId);
            return new Promise.resolve(data);
        }).catch(
        function(err) {
            console.error(err, err.stack);
            return new Promise.reject(err);
        });
};


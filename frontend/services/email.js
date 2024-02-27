// Import the SendGrid library
const sgMail = require('@sendgrid/mail');

// Function to send email using SendGrid
function sendmail() {
  
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  // Define the email message
  const msg = {
    to: 'richardpeng9149@gmail.com', // Change to your recipient
    from: 'team.sportshub@gmail.com', // Change to your verified sender
    subject: 'Sending with SendGrid is Fun',
    text: 'and easy to do anywhere, even with Node.js',
    html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  };

  // Send the email
  sgMail.send(msg)
    .then(() => {
      console.log('Email sent');
    })
    .catch((error) => {
      console.error(error);
    });
}


sendmail();

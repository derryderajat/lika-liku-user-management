const nodemailer = require("nodemailer");
require("dotenv").config();
const { SERVICE_MAIL, SENDER_MAIL, SENDER_MAIL_PW } = process.env;
const transporter = nodemailer.createTransport({
  host: SERVICE_MAIL,

  auth: {
    user: SENDER_MAIL,
    pass: SENDER_MAIL_PW,
  },
});
const sendMail = async (to, message) => {
  const mailOptions = {
    from: SENDER_MAIL,
    to: to,
    subject: "Request to change password",
    text: message,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      return false;
    } else {
      console.log("Email sent: " + info.response);
      return true;
    }
  });
};

module.exports = { sendMail };

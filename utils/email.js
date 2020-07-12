const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Olaosebikan  <${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            return 1;
        } else {
            return nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });
        }
    }

    // Sending the actual mail
    async send(template, subject) {
        // 1) Rendering HTML based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject,
        });
        // 2) Define the email options(i.e the parameters that would be sent in the mail)
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html),
        };

        // 3) Create a Transport & send email
        await this.newTransport().sendMail(mailOptions);
    };

    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours family!');
    };

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password reset token valid for only 10 minutes')
    }
};
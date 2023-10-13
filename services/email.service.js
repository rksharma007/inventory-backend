const nodeMailer = require('nodemailer');
require('dotenv').config();

const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth:{
        user: process.env.GMAIL,
        pass: process.env.GMAIL_PASSWORD
    }
});

async function verifyEmail(email, verifyLink) {
    try {
        const mailOptions = {
            from: {
                name: 'Inventory App',
                address: process.env.GMAIL,
            },
            to: email,
            subject: 'Verify your email',
            text: 'Verify your email',
            html: `
            <h3>Welcome to Inventory App</h3>
            <p>Click <a href="${verifyLink}">here</a> to verify your email.</p>`
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            // console.log(info);
        } catch (err) {
            console.log(err);
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    };

};

async function resetPasswordEmail(email, resetLink) {
    try {
        const mailOptions = {
            from: {
                name: 'Inventory App',
                address: process.env.GMAIL,
            },
            to: email,
            subject: 'Reset password',
            text: 'Reset password link for Inventory App',
            html: `<p>Click <a href="${resetLink}">here</a> to reset you password.</p>`
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            // console.log(info);
        } catch (err) {
            console.log(err);
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    };

};

async function passwordChangedSuccessfully(email) {
    try {
        const mailOptions = {
            from: {
                name: 'Inventory App',
                address: process.env.GMAIL,
            },
            to: email,
            subject: 'Password changed',
            text: 'Password changed for Inventory App.',
            html: `<p>Password for Inventory App has been changed successfully.</p>`
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            // console.log(info);
        } catch (err) {
            console.log(err);
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    };

};

module.exports = { verifyEmail, resetPasswordEmail, passwordChangedSuccessfully };
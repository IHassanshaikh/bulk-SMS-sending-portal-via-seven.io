import nodemailer from "nodemailer";

const sendEmail = async (options) => {
    // 1. Create Transporter
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // 2. Define Email Options
    const mailOptions = {
        from: `SMS System <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.message
    };

    // 3. Send Email
    await transporter.sendMail(mailOptions);
};

export default sendEmail;

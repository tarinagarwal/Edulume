import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Generate OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
export const sendOTPEmail = async (email, otp, type = "signup") => {
  try {
    const transporter = createTransporter();

    const subject =
      type === "signup"
        ? "AlienVault - Verify Your Account"
        : "AlienVault - Password Reset Code";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #ffffff; padding: 20px; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #00ff41; font-size: 32px; margin: 0; text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);">
            👽 AlienVault
          </h1>
          <p style="color: #888; margin: 5px 0 0 0;">College Resource Hub</p>
        </div>
        
        <div style="background-color: #1a1a1a; padding: 30px; border-radius: 8px; border: 1px solid #2a2a2a;">
          <h2 style="color: #00ff41; margin-top: 0;">
            ${
              type === "signup"
                ? "Welcome to the Vault!"
                : "Password Reset Request"
            }
          </h2>
          
          <p style="color: #ccc; line-height: 1.6;">
            ${
              type === "signup"
                ? "Thank you for joining AlienVault! To complete your registration, please verify your email address using the code below:"
                : "You requested to reset your password. Use the verification code below to proceed:"
            }
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #00ff41; color: #0a0a0a; font-size: 32px; font-weight: bold; padding: 15px 30px; border-radius: 8px; display: inline-block; letter-spacing: 5px; box-shadow: 0 0 20px rgba(0, 255, 65, 0.3);">
              ${otp}
            </div>
          </div>
          
          <p style="color: #888; font-size: 14px; text-align: center;">
            This code will expire in 10 minutes for security reasons.
          </p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;">
            If you didn't ${
              type === "signup"
                ? "create an account"
                : "request a password reset"
            } with AlienVault, please ignore this email.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: subject,
      html: html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
};

// Check if OTP verification is enabled
export const isOTPEnabled = () => {
  return process.env.OTP_MODE === "production";
};

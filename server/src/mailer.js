import nodemailer from 'nodemailer';

const sender = 'MatruCare AI <matrucareai@gmail.com>';
const configured = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
const transporter = configured ? nodemailer.createTransport({
  service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
}) : null;

export async function sendOtpEmail(email, otp) {
  if (!transporter) { console.log(`[demo] OTP for ${email}: ${otp}`); return; }
  await transporter.sendMail({ from: sender, to: email, subject: 'Your MatruCare AI verification code', text: `Your MatruCare AI verification code is ${otp}. It expires in 10 minutes.` });
}

export async function sendRegistrationEmail(registration) {
  if (!transporter) { console.log(`[demo] Registration confirmation for ${registration.email}`); return; }
  const members = registration.teamMembers?.map((member) => `${member.name} (${member.email})`).join(', ') || 'Solo participant';
  await transporter.sendMail({
    from: sender, to: registration.email, subject: 'MatruCare AI hackathon registration confirmed',
    text: `Registration confirmed for ${registration.fullName}.\n\nEvent: MatruCare AI Hackathon\nDomain: ${registration.domain}\nProject: ${registration.projectName}\nTeam: ${members}`
  });
}

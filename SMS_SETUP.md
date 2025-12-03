# SMS Verification Setup Guide

This guide will help you configure the SMS verification feature using Twilio.

## Prerequisites

1. A Twilio account (sign up at https://www.twilio.com/)
2. A Twilio phone number with SMS capabilities

## Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
```

## Getting Your Twilio Credentials

1. Log in to your [Twilio Console](https://console.twilio.com/)
2. Your **Account SID** and **Auth Token** are displayed on the dashboard
3. To get a phone number:
   - Go to Phone Numbers > Manage > Buy a number
   - Select a number with SMS capabilities
   - Your phone number should be in E.164 format (e.g., +15551234567)

## Installation

After adding the environment variables, install the dependencies:

```bash
npm install
```

## Testing

1. Start your development server: `npm run dev`
2. Navigate to the contact page
3. Fill out the SMS consent form
4. Check your phone for the verification code
5. Enter the code in the verification modal

## Notes

- Verification codes expire after 10 minutes
- Codes are stored in memory (for production, consider using Redis or a database)
- Make sure `.env.local` is in your `.gitignore` file (it should be by default in Next.js)


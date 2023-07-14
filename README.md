## Introduce

Title: Enabling SMTP Access for kunpro-mail-assistant in Gmail

1.Open your web browser and go to the Google Account management page (https://myaccount.google.com). Sign in to your Gmail account.
2.Navigate to the "Security" tab or find the "Security" section in the sidebar.
3.Look for the "Two-Step Verification" option and click on it. If prompted for verification, follow the instructions to proceed.
4.If you haven't already set up two-step verification, you'll be prompted to do so. Follow the on-screen instructions to complete the setup process.
5.Once two-step verification is enabled, you'll receive a verification code via text message or through the Google Authenticator app (if you set it up).
6.Enter the verification code to confirm and enable two-step verification for your account.
7.After enabling two-step verification, return to the "Security" tab or section and locate the "App Passwords" option. It should now be visible.
8.Click on "App Passwords" to access the application-specific password settings.
9.In the "Select app" dropdown menu, choose the appropriate app category (e.g., Mail).
10.In the "Select device" dropdown menu, select the device you want to use (e.g., Windows computer, Mac, iPhone, etc.).
11.Click on the "Generate" button to generate a unique application-specific password.
12.Google will display the generated password. Copy it to your clipboard or securely store it.
13.Now, open your kunpro-mail-assistant and enter the following information:
   Email Address: Your Gmail email address
   Password: Enter the application-specific password generated in step 12.
   
Please note that these instructions may vary slightly depending on the specific third-party tool you are using. Consult the documentation or support resources for your particular application for further guidance.

Remember to keep your application-specific password secure and avoid sharing it with others. If you suspect any security issues or need to revoke access, you can always generate a new application-specific password or disable it entirely through the "App Passwords" section in your Google Account settings.

I hope this formatted document helps you. If you have any further questions, feel free to ask!

## Quick Start

## First of all, you need to make sure that your computer has node and yarn installed

```bash
git clone https://github.com/kunpro-tech/kunpro-mail-assistant.git
```

```bash
cd kunpro-mail-assistant
```

```bash
yarn
```

### Windows computers can only package Windows installation packages, and the same is true for Macs
### If you want to package the installation package for the Windows platform

```bash
yarn make-window
```

### If you want to package the installation package for Mac platforms

```bash
yarn make-mac
```

### Then you will be able to find the installation package in the release directory
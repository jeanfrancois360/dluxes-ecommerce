# NextPik Authentication Guide

This guide covers everything you need to know about signing in, securing your account, and recovering access when something goes wrong.

---

## Table of Contents

1. [Signing Up](#1-signing-up)
2. [Logging In](#2-logging-in)
3. [Two-Factor Authentication (2FA)](#3-two-factor-authentication-2fa)
4. [Backup Codes](#4-backup-codes)
5. [Magic Link (Passwordless Login)](#5-magic-link-passwordless-login)
6. [Google OAuth](#6-google-oauth)
7. [Email Verification](#7-email-verification)
8. [Changing Your Password](#8-changing-your-password)
9. [Resetting a Forgotten Password](#9-resetting-a-forgotten-password)
10. [Account Recovery](#10-account-recovery)
11. [Session Management](#11-session-management)
12. [Security Best Practices](#12-security-best-practices)

---

## 1. Signing Up

### What you need
- A valid email address
- A password that meets the following requirements:
  - At least **12 characters** long
  - Contains at least one **uppercase** letter
  - Contains at least one **lowercase** letter
  - Contains at least one **digit**
  - Contains at least one **special character** (`@`, `$`, `!`, `%`, `*`, `?`, `&`)

### Seller registration
If you register as a **Seller**, a store is automatically created for you with an `ACTIVE` status. You can start listing products immediately after registration. The store name defaults to `[Your First Name]'s Store` — you can update it from your seller dashboard.

### After signing up
A verification email is sent to your inbox. You do not need to verify your email to use the platform in development, but **email verification is required in production**. See [Email Verification](#7-email-verification) if you do not receive the email.

---

## 2. Logging In

### Standard login
Enter your registered email and password. If your credentials are incorrect, you will see:

> "Invalid email or password. Please check your credentials and try again."

This message is intentionally identical whether the email is unknown or the password is wrong. This prevents attackers from discovering which email addresses have accounts.

### Rate limiting
After **5 failed login attempts** within a 15-minute window (tracked per email and per IP address), your account is locked for **15 minutes**. The error message will tell you how many minutes remain.

### Suspended accounts
If your account has been suspended, you will be informed at login. Contact support to resolve a suspension.

### Two-factor authentication
If you have enabled 2FA, after entering your password you will be asked for either:
- A **TOTP code** from your authenticator app, or
- A **backup code** (see [Backup Codes](#4-backup-codes))

---

## 3. Two-Factor Authentication (2FA)

2FA adds a second verification step to your login. Even if someone obtains your password, they cannot access your account without the second factor.

### Setting up 2FA

1. Log in to your account.
2. Go to **Account Settings > Security > Two-Factor Authentication**.
3. Click **Set Up 2FA**.
4. Scan the QR code with an authenticator app (e.g., Google Authenticator, Authy, Microsoft Authenticator).
5. Enter the 6-digit code displayed by your app to confirm setup.
6. Click **Enable 2FA**.

### What happens when you enable 2FA
- A set of **10 backup codes** is generated and displayed once. Save them somewhere safe (printed, in a password manager, etc.). They are never shown again.
- Every future login will require a TOTP code or a backup code after your password.

### Disabling 2FA
You can disable 2FA from Account Settings. Disabling clears your backup codes. If you re-enable 2FA later, a new set of backup codes is generated.

### Important: Google-linked accounts
If your account has 2FA enabled, Google OAuth cannot auto-link to your account. You must log in with your password first, then link Google from your account settings. This prevents an attacker from bypassing 2FA by linking an external identity.

---

## 4. Backup Codes

Backup codes are emergency login codes you can use if you lose access to your authenticator app (e.g., phone lost or reset).

### How they work
- **10 codes** are generated when you enable 2FA.
- Each code is **single-use** — once used, it is permanently consumed.
- Codes are 8-character hex strings (e.g., `a3f8c12d`).

### Using a backup code
At the 2FA prompt during login, there is an option to enter a backup code instead of a TOTP code. Enter one of your saved codes. The code is verified and removed from your account.

### Regenerating backup codes
If you have used some or all of your backup codes, you can regenerate a fresh set of 10 from **Account Settings > Security > 2FA > Regenerate Backup Codes**. This requires you to be logged in with 2FA still enabled.

### If you have no backup codes left and no access to your authenticator
See [Account Recovery](#10-account-recovery).

---

## 5. Magic Link (Passwordless Login)

Magic link lets you log in without a password by clicking a link sent to your email.

### How to use it
1. On the login page, click **Log in with Magic Link**.
2. Enter your email address.
3. Check your inbox for an email from NextPik containing a login link.
4. Click the link. You are logged in.

### Important details
- Magic links expire after **15 minutes**. If you click an expired link, you will see a clear message and can request a new one.
- Each link is single-use. Clicking it twice will show an "already used" message.
- If you do not receive the email, check your spam folder. You can also request a new link from the login page.

---

## 6. Google OAuth

You can sign in with your Google account, which skips the password entirely.

### First-time Google sign-in
- If your Google email is **not** registered on NextPik, a new account is created automatically. Your email is marked as verified (Google guarantees it).
- If your Google email **is** already registered (e.g., you signed up with a password earlier), Google is linked to your existing account — provided:
  - Your account is **not suspended**, and
  - You have **not enabled 2FA** on your account (see the note in [Two-Factor Authentication](#3-two-factor-authentication-2fa)).

### Unlinking Google
You can unlink Google from your account in **Account Settings > Security > Connected Accounts**, but only if you have a password set. This prevents you from locking yourself out.

### Google accounts without a password
If you signed up via Google only, your account has no password. You can set one from Account Settings at any time. You must set a password before unlinking Google.

---

## 7. Email Verification

### Why it matters
Email verification confirms you own the email address on your account. It is required for full platform access in production.

### What to do if you did not receive the email
1. Check your spam/junk folder.
2. If the email is not there, go to the login page and look for a **Resend Verification Email** option. Enter your email address.
3. A new verification link is sent.

### What to do if the link expired
If you click an expired verification link, you will see an error that includes an option to resend the verification email directly. The error response includes:
- `canResend: true` — indicating a resend is possible
- The email to resend to

Click the resend option or navigate to the resend page.

### Notes
- Verification links expire after **24 hours**.
- Each link is single-use.

---

## 8. Changing Your Password

You can change your password from **Account Settings > Security > Change Password** while logged in.

### Requirements
- You must enter your **current password** to confirm your identity.
- Your **new password** must meet the same requirements as registration (12+ characters, uppercase, lowercase, digit, special character).

### What happens after a password change
- Your current session remains active.
- Other active sessions are not automatically invalidated — if you want to force logout from other devices, use [Session Management](#11-session-management) afterward.

---

## 9. Resetting a Forgotten Password

### How to reset
1. On the login page, click **Forgot Password**.
2. Enter your registered email address.
3. Check your inbox for a password reset link.
4. Click the link and enter your new password.

### Important details
- Reset links expire after **1 hour**.
- Each link is single-use.
- If you do not receive the email, check your spam folder or try again.

---

## 10. Account Recovery

If you are locked out of your account (e.g., lost access to your authenticator app and have no backup codes), follow these steps:

### Step 1: Try backup codes
If you have any unused backup codes saved (from when you enabled 2FA), use one at the login 2FA prompt.

### Step 2: Try password reset
If you still have access to your email, use the **Forgot Password** flow to reset your password. Note: password reset does not disable 2FA, so you will still need a TOTP code or backup code after resetting.

### Step 3: Contact support
If you cannot access your authenticator app and have no backup codes, contact support. Be prepared to verify your identity through your registered email address. Support can assist with disabling 2FA on your account.

### Prevention
- Always save your backup codes when you enable 2FA.
- Store them in a password manager or print them and keep them in a safe place.
- Regenerate backup codes periodically if you use them.

---

## 11. Session Management

### What are sessions?
Each time you log in (via password, magic link, or Google OAuth), a session is created. Sessions track the device and IP address used to log in.

### Viewing your sessions
Go to **Account Settings > Security > Active Sessions**. You will see a list of all your active sessions with:
- Device type and browser
- IP address
- Login time
- A **Current** label on the session you are using right now

### Revoking sessions
- **Revoke a single session:** Click the revoke button next to any session that is not your current one.
- **Revoke all other sessions:** There is an option to revoke all sessions except the current one. This is useful if you suspect unauthorized access.

### Session security
Sessions use a **fingerprint** derived from the IP address and browser user-agent. If a session is used from a different device or IP than the one it was created on, it is **automatically invalidated**. This protects you if a session token is stolen.

---

## 12. Security Best Practices

1. **Use a strong, unique password.** Do not reuse passwords across services. Use a password manager.
2. **Enable 2FA.** It is the single most effective way to protect your account from unauthorized access.
3. **Save your backup codes.** Store them offline or in a password manager. They are your emergency access if you lose your authenticator.
4. **Review your active sessions regularly.** Revoke any sessions you do not recognize.
5. **Do not share your account.** Each account should belong to one person.
6. **Lock your devices.** Sessions can be stolen if someone has physical access to an unlocked device.
7. **Keep your email secure.** Your email is used for password resets, verification, and magic links. Securing your email is as important as securing your NextPik account.
8. **Log out when done on shared devices.** Or revoke the session from your session management page.

---

*Last updated: February 4, 2026*

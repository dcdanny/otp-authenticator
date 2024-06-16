# OTP Aauthenticator
HTML & JS based 2 factor authenticator supporting the TOTP and HOTP standards

Web App Interface (c) Daniel Clarke 2015-2024

## Background
HOTP (HMAC-based One Time Passcode) and TOTP (Time-based One Time Passcode) are two standards for generating one time passcodes from a secret usually for two factor authentication.
They both use a changing factor known to both server and client to generate unique codes. HOTP uses an incrementing counter and TOTP uses the current time (in the current minute).

This project stores the Authenticator secret keys and config in a file named `keys.js` which must be manually updated, due to browser restrictions. There is also `keysSAMPLE.js` which isn't used by the programme but gives an example of the file format.

## Getting Started
1. Pull/clone the repo locally
2. Open `index.html` in a web browser (using the `file://` interface)
3. Create a new HOTP or TOTP Authenticator with `Manage Authenticators` > `+ New Authenticator`. You can import from QR code or put your account in manually.
4. Copy the resulting code into the `keys.js` file. You should fully overwrite the contents of the file when doing this.

Refresh and you should now see your OTP codes on the page

### Alternatively
1. Pull/clone the repo locally
2. Rename/copy `keysSAMPLE.js` to `keys.js`
3. Put your account and secret into the file as specified in the comments at top of file
	- If you are getting the data from a QR code make sure to set `isBase32` to true
	- Remember to use the correct type of HOTP or TOTP. This will be specified in a QR code's data
	- See [github.com/google/google-authenticator/wiki/Key-Uri-Format](https://github.com/google/google-authenticator/wiki/Key-Uri-Format) for details on a QR code's URI format.

Refresh and you should now see your OTP codes on the page

## Limitations
- When you use or refresh HOTP codes you need to update the counter to the keys.js file manually, as the browser won't write to the file itself.
- If you refresh the page without doing this you will lose any unsaved authenticators and any HOTP counter values.
- TOTP codes don't refresh automatically yet. Press the `Reload All Codes` button at the top of the page to update these codes



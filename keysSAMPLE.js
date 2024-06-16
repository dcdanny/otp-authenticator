// keysSAMPLE.js - rename this file to keys.js and add accounts in json format as below
// DO NOT SHARE the keys.js file! It will contain your OTP secrets!

// Dictionary of shared secrets for each account. Add to this to include new accounts
//	AccountName: {					// Must be unique
//		type:	['totp'|'hotp'],	// Which otp method to use (HMAC or Time)
//		secret:	"SharedSecret",		// Arbitrary key value encoded in Base32
//		isBase32: [true|false],		// Specify if secret encoded base32 (true if extracted from qr code)(default: false)
//		format:	[dec6|dec8|hex40],	// Only used if type is hotp (Default dec6)
//		count: 0					// Only used if type is hotp (Number of uses of 
//		},							// 		key so far, keep updated with each use)
//
// For more info see README.md

var dict = {
	SampleTOTPAccount: {
		type:	'totp',
		secret:	"SharedSecretHere"
		},
	SampleHOTPAccount: {
		type:	'hotp',
		secret:	"SharedSecretHere1",
		format:	'dec6',
		count: 0
		}
	// etc.
};

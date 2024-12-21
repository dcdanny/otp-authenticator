// keysSAMPLE.js - rename this file to keys.js and add accounts in json format as below
// DO NOT SHARE the keys.js file! It contains your OTP secrets!

// Dictionary of shared secrets for each account. Add to this to include new accounts
//	AccountName: {                      // Label for your reference, must be unique
//		type:	['totp'|'hotp'],        // Which OTP method to use (HMAC or Time)
//		secret:	"SharedSecret",         // Arbitrary key value often base32 encoded
//		isBase32: [true|false],         // True if base32 encoded secret (true if extracted from qr code)(default: false)
//		format:	[dec6|dec7|dec8|hex40], // Format of OTP required. (hex40 only available for hotp) (Default dec6)
//		count: 0                        // Only used for hotp (Counts the number of uses of the key, keep up to date)
//	},
//
// For more info see README.md

var dict = {
	SampleTOTPAccount: {
		type:	'totp',
		secret:	"SharedSecretHere"
	},
	SampleHOTPAccount1: {
		type:	'hotp',
		secret:	"SharedSecretHere1",
		format:	'dec6',
		count: 0
	}
	// etc.
};

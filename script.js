if (localStorage.getItem('dict') != null && localStorage.getItem('dict') !== JSON.stringify(dict)) {
    recoverPreviousSession();
} else {
    generate();
}
const newAuthForm = document.getElementById("newAuthForm");
newAuthForm.addEventListener('submit', (e) => {
    //download track
    e.preventDefault();
    newAuth(newAuthForm);
});
function recoverPreviousSession() {
    const outputEle = document.getElementById("authSitesTOTP");
    const menubar = document.getElementById("menubar");
    menubar.style.display = "none";
    let authElement =
        generateMessage('Your keys.js file and the last known state of the page differ. Did you refresh the page without updating your keys.js file?', 'warn');
    outputEle.appendChild(authElement);
    authElement =
        generateMessage('What would you like to do?\n\n', 'warn');
    let continueFileButton = document.createElement('button');
    continueFileButton.addEventListener('click', (e) => {
        localStorage.setItem('dict', JSON.stringify(dict));
        menubar.style.display = "block";
        generate();
    });
    continueFileButton.innerText = "Continue loading from keys.js";
    authElement.appendChild(continueFileButton);
    let restoreLastSessionButton = document.createElement('button');
    restoreLastSessionButton.addEventListener('click', (e) => {
        dict = JSON.parse(localStorage.getItem('dict'));
        menubar.style.display = "block";
        generate();
    });
    restoreLastSessionButton.innerText = "Restore Last Session (Safer)";
    authElement.appendChild(restoreLastSessionButton);

    outputEle.appendChild(authElement);
}

//Function to generate all codes and display them
function generate() {
    //Remove previous codes from HTML
    var outputEle = document.getElementById("authSitesTOTP")
    var child = outputEle.lastElementChild;
    while (child) {
        outputEle.removeChild(child);
        child = outputEle.lastElementChild;
    }
    //Generate and insert for each site
    if (typeof dict === "undefined") {
        const authElement = generateMessage(
            "Error loading keys.js file. Ensure keys.js exists in the current folder and has structure based on keysSAMPLE.js.",
            "err"
        )
        outputEle.appendChild(authElement);
    } else if (Object.keys(dict).length === 0) {
        const authElement = generateMessage(
            "keys.js is empty or contains no authenticators. \nCreate an Authenticator using the Manage Authenticators button and copy it"
            + " to the keys.js file, or refer to README.md file for help",
            "warn"
        )
        outputEle.appendChild(authElement);
    } else {
        for (var prop in dict) {
            if (Object.prototype.hasOwnProperty.call(dict, prop)) {
                outputEle.appendChild(generateCodeElement(prop));
            }
        }
    }
}
//Function to reload one code, replacing previous one in doc
function reloadCode(prop, thisEle) {
    dict[prop].count++;
    var reminder = document.createElement("div");
    reminder.innerText = 'Remember: Update keys.js file with the new count value (' + (dict[prop].count + 1) + ')';
    reminder.appendChild(document.createElement("br"));
    reminder.setAttribute("class", "title msg");
    var authElement = generateCodeElement(prop);
    authElement.appendChild(reminder);
    thisEle.parentNode.parentNode.replaceChild(authElement, thisEle.parentNode);
    outputKeysJs(); //Output to manage auth box
}

function generateCode(prop) {
    var otp = "";
    var count = undefined;
    var format = undefined;
    var secret = undefined;
    if (typeof dict[prop].secret == 'string') {//Check secret is specified by user
        if (dict[prop].isBase32) {//Check if need to decode secret
            //Decode secret
            secret = "";
            var decoder = new base32.Decoder({ type: "rfc4648" });
            var out = decoder.write(dict[prop].secret).finalize();
            out.forEach(element => secret += (element < 16 ? '0' : '') + element.toString(16));
        } else {
            //No need to decode secret
            secret = dict[prop].secret;
        }
        switch (dict[prop].type) {
            case 'totp':
                //Generate TOTP code using JS library
                var totpObj = new TOTP();
                let otpLength;
                switch (dict[prop].format) {
                    case 'dec6':
                        otpLength = 6;
                        break;
                    case 'dec7':
                        otpLength = 7;
                        break;
                    case 'dec8':
                        otpLength = 8;
                        break;
                    case 'hex40':
                        return {"error":"Err: No hex40 function for totp"}
                    default:
                        otpLength = 6;
                }
                otpObj = totpObj.getOTP(secret,otpLength);
                if (otpObj.error) {
                    return {"error": "totp: " + otpObj.error};
                }
                return {"otp":otpObj.otp,"format":dict[prop].format,"secondsRemaining":otpObj.secondsRemaining};
                break;
            case 'hotp':
                try {
                    //Generate HOTP code using JS library
                    count = dict[prop].count || 0;
                    format = dict[prop].format || 'dec6';
                    otp = hotp(secret, count, format);
                    return {"otp":otp,"format":format,"count":count};
                } catch (error) {
                    return {"error": "hotp: " + error};
                }
                break;
            default:
                // User hasn't specified 'hotp' or 'totp'
                return {"error":"Err: Specify which of HOTP or TOTP should be used"};
        }
    } else {
        return {"error":"Err: Secret not provided"};
    }
}

function generateCodeElement(prop) {
    const authElement = document.createElement("div");
    authElement.className = "authString";

    let generatedCodeObj = generateCode(prop);

    if(generatedCodeObj.error) {
        return generateMessage(generatedCodeObj.error + " for " + prop, "err");
    }
    // Add auth code display
    var codeEle = document.createElement("span");
    codeEle.innerText = generatedCodeObj.otp;
    codeEle.setAttribute("class", "code");
    authElement.appendChild(codeEle);
    authElement.appendChild(document.createElement("br"));
    // Add auth code's title
    var titleEle = document.createElement("span");
    titleEle.innerText = prop;
    titleEle.setAttribute("class", "title");
    authElement.appendChild(titleEle);
    //authElement.innerHTML = '<span class="code">' + otp + '</span> <br> <span class="title">' + prop +'</span>';
    if (!isNaN(generatedCodeObj.count)) {
        // Add next code to hotp authenticators
        authElement.appendChild(document.createElement("br"));
        var countEle = document.createElement("span");
        countEle.innerText = 'Count: ' + generatedCodeObj.count;
        countEle.setAttribute("class", "title");
        authElement.appendChild(countEle);
        var nextButton = document.createElement("button");
        nextButton.innerText = 'Next Code';
        nextButton.setAttribute("class", "reloadButton");
        nextButton.addEventListener("click", function () { reloadCode(prop, this); });
        authElement.appendChild(nextButton);
    }
    if (!isNaN(generatedCodeObj.secondsRemaining)) {
        // Add countdown to totp authenticators
        authElement.appendChild(document.createElement("br"));
        var timeExpiredWarnEle = document.createElement("span");
        authElement.appendChild(timeExpiredWarnEle);
        var remainingTimeEle = document.createElement("div");
        remainingTimeEle.setAttribute("class", "timeRemainingDisp");
        authElement.appendChild(remainingTimeEle);

        let timeExpiredCallback = function() {
            timeExpiredWarnEle.innerText = "Code expired. Use Reload All Codes button";
            timeExpiredWarnEle.setAttribute("class", "title warn");
        }
        let intervalId = setTimeBar(remainingTimeEle, generatedCodeObj. secondsRemaining, 30, timeExpiredCallback);
    }
    // Add button to copy the code to clipboard
    var copyCodeButton = document.createElement("button");
    copyCodeButton.innerText = 'Copy';
    copyCodeButton.setAttribute("class", "copyCode");
    copyCodeButton.setAttribute("title", "Copy this Code to the Clipboard");
    copyCodeButton.addEventListener("click", function (e) {
        navigator.clipboard.writeText(e.target.parentElement.getElementsByClassName('code')[0].innerText);
    });
    authElement.appendChild(copyCodeButton);
    return authElement;
}

function setTimeBar(element,secondsRemaining, secondsTotal, timeoutCallback){
    let percentage = 100*(secondsRemaining/secondsTotal);
    element.style.width = percentage + "%";
    let intervalId = setInterval((element) => {
        secondsRemaining -= 1;
        percentage = 100*(secondsRemaining/secondsTotal);
        element.style.width = percentage+"%";
      }, 1000, element);

    let timeoutId = setTimeout((intervalId, element) => {
        if (typeof element === "object") {
            element.style.width = "0%";
        }
        if (typeof intervalId === "number") {
            clearTimeout(intervalId);
        }
        timeoutCallback();

    }, secondsRemaining*1000,intervalId, element);

    return intervalId;
}

//Display err/warn/info message as an authenticator element
function generateMessage(message, type) {
    const authElement = document.createElement("div");
    authElement.className = "authString";
    var reminder = document.createElement("span");
    switch (type) {
        case 'msg':
            reminder.setAttribute("class", "title msg");
            break;
        case 'warn':
            reminder.setAttribute("class", "title warn");
            break;
        case 'err':
            reminder.setAttribute("class", "title err");
            break;
        default:
            return;
    }
    reminder.innerText = message;
    authElement.appendChild(reminder);
    return authElement;
}
function toggleManageAuthDisplay(message, type) {
    outputKeysJs();
    const manageAuthContainer = document.getElementById('manageAuthContainer');
    if (manageAuthContainer.style.display == "block") {
        manageAuthContainer.style.display = "none";
    } else {
        manageAuthContainer.style.display = "block";
    }
}
function toggleNewAuthDisplay(message, type) {
    outputKeysJs();
    const manageAuthContainer = document.getElementById('newAuthContainer');
    if (manageAuthContainer.style.display == "block") {
        manageAuthContainer.style.display = "none";
    } else {
        manageAuthContainer.style.display = "block";
    }
}
function newAuth(formElement) {
    newAuthObject = formToDict(formElement);
    outputKeysJs()
    document.getElementById('postGenerateMessage').style.display = "block";
    generate();
}
//Output keys.js to manage auth output box
function outputKeysJs() {
    const outputEle = document.getElementById('dictOutput');
    localStorage.setItem('dict', JSON.stringify(dict));

    let keysjs = '// DO NOT SHARE the keys.js file! It contains your OTP secrets!\n'
                + 'var dict = '
                + JSON.stringify(((typeof dict == "undefined") ? {} : dict), null, "\t") + ";";
    outputEle.innerText = keysjs;
}

function formToDict(formElement) {
    let data = {};
    let acctName;
    this.formInputs = formElement.querySelectorAll('input[type=text], input[type=radio]:checked');
    for (element of this.formInputs) {
        if (element.name == "acctName") {
            acctName = element.value;
        } else {
            data[element.name] = element.value;
        }
    }
    this.checkboxInputs = formElement.querySelectorAll('input[type=checkbox]');
    for (element of this.checkboxInputs) {
        data[element.name] = element.checked;
    }
    this.numberInputs = formElement.querySelectorAll('input[type=number]');
    for (element of this.numberInputs) {
        if (data["type"] == "hotp") {
            data[element.name] = element.value * 1;
        }
    }
    if (typeof dict === "undefined") {
        dict = {};
        dict[acctName] = data;
    } else {
        dict[acctName] = data
    }
    return dict;
}
function qrcodeSubmit() {
    let file = document.getElementById("qrupload").files[0];
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false

    var img = new Image;
    img.onload = function () {
        ctx.drawImage(img, 10, 10, 150, 150);
        const imageData = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight) // Assigns image base64 string in jpeg format to a variable
        const code = jsQR(imageData.data, img.naturalWidth, img.naturalHeight)
        if (code) {
            setPostQRCodeMessage('Found QR code', 'msg');
            console.log(code.data)
            setPostQRCodeMessage('Found QR code: ' + code.data.split('?')[0], 'msg');
            let data = parseOtpUri(code.data);
            otpDataToForm(data, newAuthForm);
        } else {
            setPostQRCodeMessage('Error: No QR Code found in image', 'err');
        }
    }
    img.src = URL.createObjectURL(file);
}

function parseOtpUri(uri) {
    //For URI Structure see: https://github.com/google/google-authenticator/wiki/Key-Uri-Format
    let data = {}
    let protocolArr = uri.split('://');
    if (protocolArr[0] == "otpauth") {
        data.protocol = protocolArr[0];
        let hostname = protocolArr[1].split('/');
        if (hostname[0] == 'hotp' || hostname[0] == 'totp') {
            data.type = hostname[0];
            let username = hostname[1].split('?');
            data.username = username[0];
            let args = username[1].split('&');
            data.protocol = protocolArr[0];
            //Split args which come after username
            for (i = 0; i < args.length; i++) {
                parameter = args[i].split('=');
                data[parameter[0]] = decodeURIComponent(parameter[1]);
            }
            data.isBase32 = true;
        } else {
            setPostQRCodeMessage('Error: invalid URI, otp type must be hotp or totp', 'err');
        }
    } else if (protocolArr[0] == "otpauth-migration") {
        let uriData = {}
        uriData.protocol = protocolArr[0];
        let hostname = protocolArr[1].split('?');
        if (hostname[0] == 'offline') {
            uriData.type = hostname[0];
            let args = hostname[1].split('&');
            //Split args which come after username
            for (i = 0; i < args.length; i++) {
                parameter = args[i].split('=');
                uriData[parameter[0]] = decodeURIComponent(parameter[1]);
            }
            //url to uint array
            let uint = Uint8Array.from(atob(uriData.data), (c) => c.charCodeAt(0));
            //decode protocol buffer
            let pbf = new Pbf(uint);
            let decodedBuffer = Payload.read(pbf).otp_parameters;
            //base32 encode secret
            var encoder = new base32.Encoder({ type: "rfc4648" });
            //map to data object
            data.secret = encoder.write(decodedBuffer[0].secret).finalize();
            data.username = decodedBuffer[0].name;
            data.counter = decodedBuffer[0].counter;
            data.issuer = decodedBuffer[0].issuer;
            switch (decodedBuffer[0].type) {
                case 0:
                    data.type = "unspecified";
                    break;
                case 1:
                    data.type = "hotp";
                    break;
                case 2:
                    data.type = "totp";
                    break;
                default:
                    data.type = "";
            }
            switch (decodedBuffer[0].digits) {
                case 1:
                    data.digits = 6;
                    break;
                case 2:
                    data.digits = 8;
                    break;
                default:
                    data.digits = 0;
            }
            data.isBase32 = true;
        }
    } else {
        setPostQRCodeMessage('Error: invalid URI, protocol must be otpauth', 'err');
    }
    return data;

}
function otpDataToForm(data, formElement) {
    document.getElementById('acctName').value = data.issuer + ':' + data.username;
    document.getElementById('secret').value = data.secret;
    document.getElementById('isBase32').checked = true;
    if (data.type === 'hotp') {
        document.getElementById('hotp').checked = true;
        document.getElementById('count').value = data.counter;
    } else if (data.type === 'totp') {
        document.getElementById('totp').checked = true;
    }

    if (data.digits == '6') {
        document.getElementById('dec6').checked = true;
    } else if (data.digits == '7') {
        document.getElementById('dec7').checked = true;
    } else if (data.digits == '8') {
        document.getElementById('dec8').checked = true;
    } else if (data.digits == '40') {
        document.getElementById('hex40').checked = true;
    }
}
function setPostQRCodeMessage(message, type) {
    const postQRCodeMessage = document.getElementById('postQRCodeMessage');
    return messageLog(message, type, postQRCodeMessage);
}
function messageLog(message, type, element) {
    element.style.display = "block";
    switch (type) {
        case 'msg':
            element.setAttribute("class", "title msg");
            console.log(message);
            break;
        case 'warn':
            element.setAttribute("class", "title warn");
            console.warn(message);
            break;
        case 'err':
            element.setAttribute("class", "title err");
            console.error(message);
            break;
        default:
            return;
    }
    element.innerText = message;
    return element;
}

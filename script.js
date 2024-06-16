generate();
const newAuthForm = document.getElementById("newAuthForm");
newAuthForm.addEventListener('submit', (e) => {
    //download track
    e.preventDefault();
    newAuth(newAuthForm);
});

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
        const authElement = generateMessage (
            "keys.js was not loaded. Ensure you have created the file from keysSAMPLE.js file.",
            "err"
        )
        outputEle.appendChild(authElement);
    } else if (Object.keys(dict).length === 0) {
        const authElement = generateMessage (
            "keys.js is empty or contains no authenticators. Create one using the New Authenticator button or refer to keysSAMPLE.js file",
            "warn"
        )
        outputEle.appendChild(authElement);
    } else {
        for (var prop in dict) {
            if (Object.prototype.hasOwnProperty.call(dict, prop)) {
                outputEle.appendChild(generateCode(prop));
            }
        }
    }
}
//Function to reload one code, replacing previous one in doc
function reloadCode(prop, thisEle){
    dict[prop].count++;
    var reminder = document.createElement("span");
    reminder.innerText = '\nRemember: Update keys.js file with the new count value ('+(dict[prop].count+1)+')';
    reminder.setAttribute("class", "title warn");
    var authElement = generateCode(prop);
    authElement.appendChild(reminder);
    thisEle.parentNode.parentNode.replaceChild(authElement, thisEle.parentNode);
    outputKeysJs(); //Output to manage auth box
}
function generateCode(prop){
    const authElement = document.createElement("div");
    authElement.className = "authString";
    var otp = "";
    var count = undefined;
    var format = undefined;
    var secret = undefined;
    if(typeof(dict[prop].secret) == 'string') {//Check secret is specified by user
        if(dict[prop].isBase32){//Check if need to decode secret
            //Decode secret
            secret = "";
            var decoder = new base32.Decoder({ type: "rfc4648" });
            var out = decoder.write(dict[prop].secret).finalize();
            out.forEach(element => secret += (element < 16 ? '0' : '') + element.toString(16));
        }else{
            //No need to decode secret
            secret = dict[prop].secret;
        }
        switch(dict[prop].type) {
          case 'totp':
            //Generate TOTP code using JS library
            var totpObj = new TOTP();
            otp = totpObj.getOTP(secret);

            break;
          case 'hotp':
            //Generate HOTP code using JS library
            count = dict[prop].count || 0;
            format = dict[prop].format || 'dec6';
            otp = hotp(secret,count,format)
            break;
          default:
            // User hasn't specified 'hotp' or 'totp'
            otp = "Err: Specify which of HOTP or TOTP should be used";
        }
    }else{
        otp = "Err: Secret not specified";
    }
    authElement.innerHTML = '<span class="code">' + otp + '</span> <br> <span class="title">' + prop +'</span>';
    if(!isNaN(count)){
        authElement.appendChild(document.createElement("br"));
        var countEle = document.createElement("span");
        countEle.innerText = 'Count: ' + count;
        countEle.setAttribute("class", "title");
        authElement.appendChild(countEle);
        var nextButton = document.createElement("button");
        nextButton.innerText = 'Next Code';
        nextButton.setAttribute("class", "reloadButton");
        nextButton.addEventListener("click", function(){ reloadCode(prop, this); });
        authElement.appendChild(nextButton);
    }
    return authElement;
}
//Display err/warn/info message as an authenticator element
function generateMessage (message, type) {
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
function toggleManageAuthDisplay (message, type) {
    outputKeysJs();
    const manageAuthContainer = document.getElementById('manageAuthContainer');
    if(manageAuthContainer.style.display == "block") {
        manageAuthContainer.style.display = "none";
    } else {
        manageAuthContainer.style.display = "block";
    }
}
function toggleNewAuthDisplay (message, type) {
    outputKeysJs();
    const manageAuthContainer = document.getElementById('newAuthContainer');
    if(manageAuthContainer.style.display == "block") {
        manageAuthContainer.style.display = "none";
    } else {
        manageAuthContainer.style.display = "block";
    }
}
function newAuth (formElement) {
    newAuthObject = formToDict(formElement);
    outputKeysJs()
    document.getElementById('postGenerateMessage').style.display = "block";
}
//Output keys.js to manage auth output box
function outputKeysJs () {
    const outputEle = document.getElementById('dictOutput');
    let keysjs = 'var dict = ' + JSON.stringify(dict, null, "\t") + ";";
    outputEle.innerText = keysjs;
}

function formToDict(formElement){
    let data = {};
    let acctName;
    this.formInputs = formElement.querySelectorAll('input[type=text], input[type=radio]:checked');
    for(element of this.formInputs){
        if (element.name == "acctName") {
            acctName = element.value;
        } else {
            data[element.name] = element.value;
        }
    }
    this.checkboxInputs = formElement.querySelectorAll('input[type=checkbox]');
    for(element of this.checkboxInputs){
        data[element.name] = element.checked;
    }
    this.numberInputs = formElement.querySelectorAll('input[type=number]');
    for(element of this.numberInputs){
        if (data["type"] == "hotp") {
            data[element.name] = element.value * 1;
        }
    }
    dict[acctName] = data
    return dict;
}
function qrcodeSubmit() {
    let file = document.getElementById("qrupload").files[0];
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false

    var img = new Image;
    img.onload = function() {
        ctx.drawImage(img, 10,10,150,150);
        const imageData = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight) // Assigns image base64 string in jpeg format to a variable
        const code = jsQR(imageData.data, img.naturalWidth, img.naturalHeight)
        if (code) {
            console.log("Found QR code", code.data)
            let data = parseOtpUri(code.data);
            console.log(data);
            otpDataToForm(data, newAuthForm);
        } else {
            console.error("No QR Code found");
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
        if (hostname[0] == 'hotp' || hostname[0] == 'totp'){
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
            console.log("Error: invalid otp type must be hotp or totp");
        }
    } else {
        console.log("invalid protocol must be otpauth");
    }
    return data;
    
}
function otpDataToForm(data, formElement) {
    document.getElementById('acctName').value = data.issuer + ':' + data.username;
    document.getElementById('secret').value = data.secret;
    document.getElementById('isBase32').checked = true;
    if (data.type === 'hotp'){
        document.getElementById('hotp').checked = true;
        document.getElementById('count').value = data.counter;
    } else if (data.type === 'totp'){
        document.getElementById('totp').checked = true;
    }

    if(data.digits == '6'){
        document.getElementById('dec6').checked = true;
    } else if (data.digits == '7') {
        document.getElementById('dec7').checked = true;
    } else if (data.digits == '8') {
        document.getElementById('dec8').checked = true;
    } else if (data.digits == '40') {
        document.getElementById('hex40').checked = true;
    }
}

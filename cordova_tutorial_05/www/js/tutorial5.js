var currentPath = "/";
var wlansd = new Array();
var isFileExist = false;

function onLoad(){
    document.addEventListener("deviceready", onDeviceReady, false);
}

function onDeviceReady(){
    getFileList('');
    $(document).on("click", "a.dir", function(){
        getFileList(this.text);
    });
    $(document).on("click", "a.file", function(){
        downloadFile(this.text, currentPath);
    });
    $("#doUpload").click(function(){
        navigator.notification.confirm("Are you sure you upload 'upload.jpg'?", confirmCallback, "UPLOAD", "YES,NO");
        function confirmCallback(buttonIndex) {
            switch (buttonIndex) {
                // Dialog closed without tapped any buttons.
                case 0:
                    break;
                // "YES" tapped
                case 1:
                    uploadFile();
                    break;
                // "NO" tapped
                case 2:
                    break;
            }
        }
    });
    document.addEventListener("backbutton", onBackKeyDown, false);
    $("#head-left").click(function(){
        onBackKeyDown();
    });
}

function onBackKeyDown(){
    if(isFileExist == false){
        location.href = "index.html";
    } else if(currentPath == "/"){
        location.href = "index.html";
    } else {
        getFileList("..");
    }
}
// Get the content list.
function getFileList(dir){
    isFileExist = false;
    var nextPath = makePath(dir);
    var url = "http://flashair/command.cgi?op=100&DIR=" + nextPath;

    $.get(url, function(data){
        //Save the current path.
        currentPath = nextPath;
        // Split lines by new line characters.
        wlansd = data.split(/\n/g);
        // Ignore the first line (title) and last line (blank).
        wlansd.shift();
        wlansd.pop();
        splitFileList(currentPath);
        wlansd.sort(cmptime);
        showFileList(currentPath);
        // Success to get content list.
        isFileExist = true;
    });
}
// Make a Path to show next.
function makePath(dir){
    var arrPath = currentPath.split('/');

    if(currentPath == "/"){
        arrPath.pop();
    }
    if(dir == ".."){
        // Go to parent directory. Remove last fragment.
        arrPath.pop();
    } else if(dir != "" && dir != "."){
        // Go to child directory. Append dir to the current path.
        arrPath.push(dir);
    }
    if (arrPath.length == 1){
        arrPath.push("");
    }
    return arrPath.join("/");
}
// Split the content list data.
function splitFileList(){
    for(var i=0; i<wlansd.length; i++){
        var elements = wlansd[i].split(",");
        wlansd[i] = new Array();
        wlansd[i]["r_uri"] = elements[0];
        wlansd[i]["fname"] = elements[1];
        wlansd[i]["fsize"] = Number(elements[2]);
        wlansd[i]["attr"]  = Number(elements[3]);
        wlansd[i]["fdate"] = Number(elements[4]);
        wlansd[i]["ftime"] = Number(elements[5]);
    }
}
// Sort contents by date and time.
function cmptime(a,b){
    if(a["fdate"] == b["fdate"]){
        return a["ftime"] - b["ftime"];
    } else {
        return a["fdate"] - b["fdate"];
    }
}
// Show the content list.
function showFileList(path){
    $("#list").html('');
    $.each(wlansd, function(){
        var file = this;
        var filelink = $('<a href="javascript:void(0)"></a>');
        var caption = file["fname"];
        var faDir = file["r_uri"];
        var fileobj = $("<div></div>");
        var img = $("<img>");
        // Skip hidden file.
        if(file["attr"] & 0x02){
            return;
        }
        // Make a link to directories and files.
        if(file["attr"] & 0x10){
            img.attr("src", "img/folder.png");
            filelink.addClass("dir");
        } else {
            var array = file["fname"].split(".");
            var ext = array.length >=2 ? array[array.length-1] : '';
            // Check a file extension.
            if( ext.toUpperCase() == "JPG"){
                img.attr("src", "http://flashair/thumbnail.cgi?" + faDir + "/" + caption);
            } else {
                img.attr("src", "img/flashair.png");
            }
            filelink.addClass("file");
        }
        $("#list").append(
            fileobj.append(
                filelink.append(
                    img
                ).append(
                    caption
                )
            )
        );
    });
}
// Download the content.
function downloadFile(fname, dir){
    var fileTransfer = new FileTransfer();
    var dlPath = dir !="/" ? dir + "/" + fname : dir + fname;
    var dlUrl = encodeURI("http://flashair" + dlPath);
    var destUrl = encodeURI("cdvfile://localhost/persistent/download/" + fname);

    fileTransfer.download(dlUrl, destUrl, function(entry) {
        window.open = cordova.InAppBrowser.open(entry.toURL(), '_blank', 'location=no');
    }, function(error) {
        switch (error.code){
            case 1:
                alert("Failed to download the file. Error code is 'FILE_NOT_FOUND_ERR'");
                break;
            case 2:
                alert("Failed to download the file. Error code is 'INVALID_URL_ERR'");
                break;
            case 3:
                alert("Failed to download the file. Error code is 'CONNECTION_ERR'");
                break;
            case 4:
                alert("Failed to download the file. Error code is 'ABORT_ERR'");
                break;
            case 5:
                alert("Failed to download the file. Error code is 'NOT_MODIFIED_ERR'");
                break;
        }
    });
}
// Upload the content.
function uploadFile(){
    var uppath = makePath(".");
    var cgi = "http://flashair/upload.cgi";
    var dt = new Date();
    // The range of years for FAT32 is from 1980 to 2107.
    var year = (dt.getFullYear() - 1980) << 9;
    var month = (dt.getMonth() + 1) << 5;
    var date = dt.getDate();
    var hours = dt.getHours() << 11;
    var minites = dt.getMinutes() << 5;
    var seconds = Math.floor(dt.getSeconds() / 2);
    var timestring = "0x" + (year + month + date).toString(16) + (hours + minites + seconds).toString(16);
    var param = cgi + "?WRITEPROTECT=ON&UPDIR=" + uppath + "&FTIME=" + timestring;
    // GET request upload.cgi parameters.
    $.get(param, function(){
        // Create boundary.
        var boundary = "--------------------FlashAir" + year.toString() + month.toString() + date.toString() + hours.toString() + minites.toString() + seconds.toString();
        var localReq = new XMLHttpRequest();
        var preReader = new FileReader();
        var sufReader = new FileReader();
        var localBuffer, faBuffer;
        // GET request upload file (as ArrayBuffer).
        localReq.open("GET", "img/upload.jpg", true);
        localReq.responseType = "arraybuffer";
        // POST request to FlashAir succeeds.
        var faReqSuccess = function(){
            navigator.notification.alert("Upload complete!", function(){
                // Update the content list.
                getFileList(".");
            }, "UPLOAD", "OK");
        };
        // Suffix loading succeeds.
        var sufReaderSuccess = function(){
            // Connect HTTP Body suffix.
            faBuffer = connectBuffer(faBuffer, sufReader.result);
            var faReq = new XMLHttpRequest();
            // POST request upload file to FlashAir.
            faReq.open("POST", cgi, true);
            // Set HTTP Headers.
            faReq.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
            faReq.onload = faReqSuccess;
            faReq.send(faBuffer);
        };
        // Prefix loading succeeds.
        var preReaderSuccess = function(){
            // Connect HTTP Body prefix and upload file.
            faBuffer = connectBuffer(preReader.result, localBuffer);
            // HTTP Body suffix
            var suffix = '\r\n' + '--' + boundary + '--';
            sufReader.onload = sufReaderSuccess;
            // Load suffix (as ArrayBuffer).
            sufReader.readAsArrayBuffer(new Blob([suffix]));
        };
        // GET request upload file succeeds.
        var localReqSuccess = function(){
            localBuffer = localReq.response;
            // HTTP Body prefix
            var prefix = '--' + boundary + '\r\n' + 'Content-Disposition: form-data; name="userfile"; filename="upload.jpg"\r\n' + 'Content-Type: image/jpeg\r\n\r\n';
            preReader.onload = preReaderSuccess;
            // Load prefix (as ArrayBuffer).
            preReader.readAsArrayBuffer(new Blob([prefix]));
        };
        localReq.onload = localReqSuccess;
        localReq.send(null);
    });
    return false;
}
// Add addBuffer to oriBuffer (as ArrayBuffer).
function connectBuffer(oriBuffer, addBuffer){
    var uint8Array = new Uint8Array(oriBuffer.byteLength + addBuffer.byteLength);
    uint8Array.set(new Uint8Array(oriBuffer), 0);
    uint8Array.set(new Uint8Array(addBuffer), oriBuffer.byteLength);
    return uint8Array.buffer;
}

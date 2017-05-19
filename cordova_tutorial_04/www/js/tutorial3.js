var currentPath = "/";
var wlansd = new Array();
var doesFileExist = false;

function onLoad(){
    document.addEventListener("deviceready", onDeviceReady, false);
}

function onDeviceReady(){
    getFileList("");
    $(document).on("click", "a.dir", function(){
        getFileList(this.text);
    });
    $(document).on("click", "a.file", function(){
        downloadFile(this.text, currentPath);
    });
    document.addEventListener("backbutton", onBackKeyDown, false);
    $("#head-left").click(function(){
        onBackKeyDown();
    });
}

function onBackKeyDown(){
    if(doesFileExist == false){
        location.href = "index.html";
    } else if(currentPath == "/"){
        location.href = "index.html";
    } else {
        getFileList("..");
    }
}
// Get the content list.
function getFileList(dir){
    doesFileExist = false;
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
        doesFileExist = true;
    });
}
// Make a Path to show next.
function makePath(dir){
    var arrPath = currentPath.split("/");

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
function showFileList(){
    $("#list").html("");
    $.each(wlansd, function(){
        var file = this;
        var filelink = $("<a href='javascript:void(0)'></a>");
        var caption = file["fname"];
        var faDir = file["r_uri"];
        var fileobj = $("<div></div>");
        // Skip hidden file.
        if(file["attr"] & 0x02){
            return;
        }
        // Make a link to directories and files.
        if(file["attr"] & 0x10){
            filelink.addClass("dir");
        } else {
            filelink.addClass("file");
        }
        $("#list").append(
            fileobj.append(
                filelink.append(
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
        window.open = cordova.InAppBrowser.open(entry.toURL(), "_blank", "location=no");
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

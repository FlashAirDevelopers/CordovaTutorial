function onLoad() {
    document.addEventListener("deviceready", onDeviceReady, false);
}

function onDeviceReady() {
    document.addEventListener("backbutton", onBackKeyDown, false);
    $("#head-left").click(function(){
        onBackKeyDown();
    });
}

function onBackKeyDown() {
    location.href = "index.html";
}

function getFlashAirInfo(){
    var wlansd = new Array();

    $.ajax({
        type: "GET",
        url: "http://flashair/command.cgi?op=101&DIR=/",
        success: function(res){
            $("#nof").html(res);
        },
        error: function(xhr){
            alert("Status: " + xhr.status);
        }
    });

    $.ajax({
        type: "GET",
        url: "http://flashair/command.cgi?op=100&DIR=/",
        success: function(res){
            wlansd = res.split(/\n/g);
            wlansd.shift();
            wlansd.pop();
            $("#lof").html("");
            $.each(wlansd, function(){
                var file = this;
                var fileobj = $("<div></div>");
                $("#lof").append(
                    fileobj.append(
                        file
                    )
                );
            });
        },
        error: function(xhr){
            alert("Status: " + xhr.status);
        }
    });
}

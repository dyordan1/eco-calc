function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

onmessage = function(e) {
  if(e.data.type == 'cookie') {
    payload = e.data.payload;
    setCookie(payload.key, payload.value, 30);
  }
  postMessage('qwer');
}

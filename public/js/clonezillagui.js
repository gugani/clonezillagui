var socket = io.connect('http://127.0.0.1:3000');
console.log("iosocket connected")

var activehds = [];

document.onload = socket.emit('guievent', { type: 'command', name: 'refresh', val: 1 } );

//Server events messages
$('#refreshbutton').on('click', function(event) {
  // event.preventDefault(); // To prevent following the link (optional)
  console.log("refresh HD list!");
  socket.emit('guievent', { type: 'command', name: 'refresh', val: 1 } );
  removedisks()
  appendto("consolecontent", "Refrescamos listado de discos");
});

$('#testbutton').on('click', function(event) {
  console.log(activehds.length);
  for (i = 0; i < activehds.length; i++){
    console.log(activehds[i].id);
  }
});

$('#hdlist').on('click', '.list-group-item', function(event) {
  event.preventDefault();
  console.log(event);
  activehds = document.getElementsByClassName("list-group-item active");
  // for (i = 0; i < activehds.length; i++){
  //   console.log(activehds[i].id);
  // }
});

//Server events messages
socket.on('serverevent', function (data) {
    // console.log(data);

    if (data.type == "adddisk"){
        adddisk(data.name, data.size);
    }

    if (data.type == "consoledebug"){
      var lines = data.data.split('\n');
      for (i = 0; i < lines.length; i++) {
        appendto("consolecontent", lines[i]);
      }
    }

});


//Utils
function adddisk(name, size){
  $("#hdlist").append('<a id="' + name + '"href="#" class="list-group-item">' + name + ' - ' + size + ' Kb</a>');
  console.log("adddisk");
}

function removedisks(){
  // document.getElementById("hdlist").innerHTML = "";
  $("#hdlist").empty()
}

function appendto(id, text){
    var div = document.getElementById(id);
    div.innerHTML = div.innerHTML + "<br>" + text;
    var scrollingconsole = document.getElementById("scrollingconsole");
    scrollingconsole.scrollTop = scrollingconsole.scrollHeight;
    console.log(text);
}

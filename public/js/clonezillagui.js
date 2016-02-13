var socket = io.connect('http://127.0.0.1:3000');
console.log("iosocket connected")

//Server events messages
$('#refreshbutton').on('click', function(event) {
  event.preventDefault(); // To prevent following the link (optional)
  console.log("clicked!");
  socket.emit('guievent', { type: 'command', name: 'refresh', val: 1 } );
  // socket.send({ type: 'command', subtype: 'projinput', val: "hdmi1" } );
});

//Server events messages
socket.on('serverevent', function (data) {
    console.log(data);
    if (data.type == "adddisk"){
        adddisk(data.name, data.size);
    }

    // console.log("LOG: Mensaje recibido. Type: " + data.type + " Subtype: " + data.subtype + " Value: " + data.val);
});


//Utils
function adddisk(name, size){
  $("#hdlist").append('<a id="' + name + '"href="#" class="list-group-item">' + name + ' - ' + size + ' Kb</a>');
  console.log("adddisk");
}

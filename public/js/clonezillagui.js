var socket = io.connect('http://127.0.0.1:3000');
console.log("iosocket connected")

//Server events messages
$('#refreshbutton').on('click', function(event) {
  // event.preventDefault(); // To prevent following the link (optional)
  console.log("refresh HD list!");
  socket.emit('guievent', { type: 'command', name: 'refresh', val: 1 } );
  removedisks()
});

$('#hdlist').on('click', '.list-group-item', function(event) {
  event.preventDefault();
  console.log(event)
});

//Server events messages
socket.on('serverevent', function (data) {
    console.log(data);

    if (data.type == "adddisk"){
        adddisk(data.name, data.size);
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

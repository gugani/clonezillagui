var socket = io.connect('http://192.168.1.103:3000');
console.log("iosocket connected")


$('#refreshbutton').on('click', function(event) {
  event.preventDefault(); // To prevent following the link (optional)
  console.log("clicked!");
  socket.emit('guievent', { type: 'command', subtype: 'projinput', val: "hdmi1" } );
  socket.send({ type: 'command', subtype: 'projinput', val: "hdmi1" } );
});

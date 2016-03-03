var socket = io.connect('http://127.0.0.1:3000');
console.log("iosocket connected")

var activehds = [];
var activeimage;

document.onload = socket.emit('guievent', { type: 'command', name: 'refreshhds', val: 1 } );
document.onload = socket.emit('guievent', { type: 'command', name: 'refreshimagelist', val: 1 } );

//GUI events----------------------------------------------------------------------------
$('#refreshhdsbtn').on('click', function(event) {
  // event.preventDefault(); // To prevent following the link (optional)
  console.log("refresh HD list!");
  socket.emit('guievent', { type: 'command', name: 'refreshhds', val: 1 } );
  emptygrouplist("hdlist")
  appendto("consolecontent", "Refrescamos listado de discos");
});

$('#startbtn').on('click', function(event) {


  var activehds_ = $(".hdlistitem.list-group-item.active");
  var activeimage_ = $(".imagelistitem.list-group-item.active");

  if (activehds_.length == 0){
    alert("Seleccione discos destino para la copia.");
  }
  else{
    console.log(activehds_.length);
    for (i = 0; i < activehds_.length; i++){
      console.log(activehds_[i].id);
      activehds[i] = activehds_[i].id;
    }
  }

  if (activeimage_.length == 0) {
    alert("Seleccione una imagen como origen para la copia.");
  }
  else{
    console.log("Activeimage definida: " + activeimage_[0].id);
    activeimage = activeimage_[0].id
  }

  socket.emit('guievent', { type: 'command', name: 'start', image: activeimage, hdlist: activehds, pwd: $("#pwd").val()} );

});

$('#refreshimagesbtn').on('click', function(event) {
  console.log("refresh images list!");
  socket.emit('guievent', { type: 'command', name: 'refreshimagelist', val: 1 } );
  emptygrouplist("imageslist")
  appendto("consolecontent", "Refrescamos listado de imágenes");
});

$('#hdlist').on('click', '.list-group-item', function(event) {
  event.preventDefault();
  // console.log(event);
  // activehds = document.getElementsByClassName("hdlistitem list-group-item active");
  // for (i = 0; i < activehds.length; i++){
  //   console.log(activehds[i].id);
  // }
});

$('#imageslist').on('click', '.list-group-item', function(event) {
  event.preventDefault();
  // console.log(event);
  // activeimage = document.getElementsByClassName("imagelistitem list-group-item active")[0];
});

$('#createimagebtn').on('click', function(event) {
  appendto("consolecontent", "Creando nueva imagen");
});


//Server events messages----------------------------------------------------------------
socket.on('serverevent', function (data) {
    // console.log(data);
    if (data.type == "adddisk"){
        adddisk(data.name, data.size);
    }
    else if (data.type == "addimage"){
        addimage(data.name);
    }
    else if (data.type == "consoledebug"){
      var lines = data.data.toString().split('\n');
      for (i = 0; i < lines.length; i++) {
        appendto("consolecontent", lines[i]);
      }
    }
});


//Utils-----------------------------------------------------------------------------------
function adddisk(name, size){
  $("#hdlist").append('<a id="' + name + '"href="#" class="hdlistitem list-group-item">' + name + ' - ' + size + ' Kb</a>');
  console.log("adddisk");
}

function emptygrouplist(id){
  // document.getElementById("hdlist").innerHTML = "";
  // $("#hdlist").empty();
  $('#' + id).empty()
}

function addimage(name){
  $("#imageslist").append('<a id="' + name + '"href="#" class="imagelistitem list-group-item">' + name + '</a>');
  console.log("addimage");
}

function appendto(id, text){
    var div = document.getElementById(id);
    div.innerHTML = div.innerHTML + "<br>" + text;
    var scrollingconsole = document.getElementById("scrollingconsole");
    scrollingconsole.scrollTop = scrollingconsole.scrollHeight;
    console.log(text);
}

$('.pull-down').each(function() {
	$(this).css('margin-top', $(this).parent().height()-$(this).height())
});

var ip = location.host;
var socket = io.connect('http://' + ip);
// var socket = io.connect('http://192.168.21.112:3000');
console.log("iosocket connected")

var activehds = [];
var activeimage;
var status = "undefined";

socket.on('connect', function () {
    console.log('connect');
});

socket.on('error', function (data) {
    console.log(data || 'error');
});

socket.on('connect_failed', function (data) {
    console.log(data || 'connect_failed');
});

document.onload = socket.emit('guievent', { type: 'command', name: 'refreshhds', val: 1 } );
document.onload = socket.emit('guievent', { type: 'command', name: 'refreshimagelist', val: 1 } );

//GUI events----------------------------------------------------------------------------

// Evento refresco del listado de imágenes
$('#refreshimagesbtn').on('click', function(event) {
  console.log("refresh images list!");
  socket.emit('guievent', { type: 'command', name: 'refreshimagelist', val: 1 } );
  emptygrouplist("imageslist")
  appendto("consolecontent", "Refrescamos listado de imágenes");
});

// Evento refresco del listado de discos
$('#refreshhdsbtn').on('click', function(event) {
  // event.preventDefault(); // To prevent following the link (optional)
  console.log("refresh HD list!");
  socket.emit('guievent', { type: 'command', name: 'refreshhds', val: 1 } );
  emptygrouplist("hdlist")
  appendto("consolecontent", "Refrescamos listado de discos");
});

// Evento al hacer click en listado de discos
$('#hdlist').on('click', '.list-group-item', function(event) {
  event.preventDefault();
  // console.log(event);
  // activehds = document.getElementsByClassName("hdlistitem list-group-item active");
  // for (i = 0; i < activehds.length; i++){
  //   console.log(activehds[i].id);
  // }
});

// Evento al hacer click en el listado de imágenes
$('#imageslist').on('click', '.list-group-item', function(event) {
  event.preventDefault();
  // console.log(event);
  // activeimage = document.getElementsByClassName("imagelistitem list-group-item active")[0];
});

// Evento comienzo de creación de imagen de disco
$('#createimagebtn').on('click', function(event) {
  if (status == "standby"){
    activehds = []
    var activehds_ = $(".hdlistitem.list-group-item.active");

    if (activehds_.length == 0){
      alert("Seleccione un disco origen.");
    }
    else{
      console.log(activehds_.length);
      for (i = 0; i < activehds_.length; i++){
        console.log(activehds_[i].id);
        activehds[i] = activehds_[i].id;
      }
    }
    console.log("Disco origen: " + activehds);
    if (activehds.length > 1){
      alert("Escoger sólo un disco origen.")
    }
    else{
      appendto("consolecontent", "Creando nueva imagen");
      socket.emit('guievent', { type: 'command', name: 'start_crate_image', hd: activehds[0], image: $("#newimagename").val(), pwd: $("#pwd").val()} );
    }
  }
});

// Evento comienzo de multicopia
$('#startbtn').on('click', function(event) {

  if (status == "standby"){
    activehds = []
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
      activeimage = activeimage_[0].id;
    }

    socket.emit('guievent', { type: 'command', name: 'start_multiple_copy', image: activeimage, hdlist: activehds, pwd: $("#pwd").val()} );

  }
});

// Borrado de imágenes
$("#remove-button").on('click', function(event) {
  event.preventDefault();
  var x;
  var activeimage_ = $(".imagelistitem.list-group-item.active");
  if (activeimage_.length == 0) {
    alert("Seleccione la imagen que desee borrar.");
  }
  else if ($("#pwd").val().length == 0) {
    alert("Debes indicar el password");
  }
  else{
    if (confirm("Desea borrar la imagen de disco " + activeimage_[0].id) == true) {
      console.log("Activeimage definida: " + activeimage_[0].id);
      activeimage = activeimage_[0].id;
      console.log("delete");
      socket.emit('guievent', { type: 'command', name: 'delete_image', image: activeimage, pwd: $("#pwd").val()} );
    } else {
        console.log("Operación de borrado de imagen de disco cancelada");
    }
  }
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
      var lines = data.data.split('\n');
      for (i = 0; i < lines.length; i++) {
        appendto("consolecontent", lines[i]);
      }
    }
    else if (data.type == "status"){
      if (status == "undefined"){
        if (data.value == "cloning"){
          alert("Equipo ocupado: clonando.")
        }
        else if (data.value == "savingimage") {
          alert("Equipo ocupado: guardando imagen.")
        }
        else if (data.value == "standby") {
          appendto("consolecontent", "Qi Replicator preparada");
        }
      }


      status = data.value;

      switch (status) {
        case "cloning":
          $("#statuslabel").removeClass();
          $("#statuslabel").addClass("label label-danger")
          $("#statuslabel").html("Clonando");
          break;
        case "savingimage":
          $("#statuslabel").removeClass();
          $("#statuslabel").addClass("label label-danger")
          $("#statuslabel").html("Guardando imagen");
          break;
        case "standby":
          $("#statuslabel").removeClass();
          $("#statuslabel").addClass("label label-success")
          $("#statuslabel").html("En espera");
          break;
        default:

      }
      console.log("Status: " + data.value);
    }
    else if (data.type == "command") {
      if (data.name == "update_imagelist") {
        console.log("refresh images list!");
        socket.emit('guievent', { type: 'command', name: 'refreshimagelist', val: 1 } );
        emptygrouplist("imageslist")
        // appendto("consolecontent", "Refrescamos listado de imágenes");
      }
    }
});


//Utils-----------------------------------------------------------------------------------
function addimage(name){
  // $("#imageslist").append('<a id="' + name + '"href="#" class="imagelistitem list-group-item">' + name + '<button id="rm_' + name + '" type="button" class="btn btn-danger remove-button pull-right">Borrar</button></a>');
  $("#imageslist").append('<a id="' + name + '"href="#" class="imagelistitem list-group-item">' + name + '</a>');

  //
  console.log("addimage");
}

function adddisk(name, size){
  $("#hdlist").append('<a id="' + name + '"href="#" class="hdlistitem list-group-item">' + name + ' - ' + size + ' Kb</a>');
  console.log("adddisk");
}

function emptygrouplist(id){
  // document.getElementById("hdlist").innerHTML = "";
  // $("#hdlist").empty();
  $('#' + id).empty()
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

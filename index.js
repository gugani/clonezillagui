// Libraries
var http = require('http');
var express = require("express");
var fs = require('fs'),
    path = require('path');

var app = express();

var localhost = "127.0.0.1";
var port = 3000;
var sysdisks = ["sda", "sdb"];
var disks;
var status = "standby";

// Start the app
// http.createServer(app).listen(3000, function() {
//   console.log('Express app started');
// });

//---------------
//Serve templates
//---------------
app.set('views', __dirname + '/views');
//app.set('view engine', "jade");
//app.get("/", function(req, res){
//    res.render("index");
//});

//---------------
//Serve static
//---------------
//app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/public'));
app.get("/", function(req, res){
    res.sendFile(__dirname + '/views/index.html');
});

//---------------
//Socket.io
//---------------
var io = require('socket.io').listen(app.listen(port));

io.sockets.on('connection', function (socket) {
    console.log('User connected');
    io.sockets.emit('serverevent', { type: 'status', value: status});

    //Mensajes de sistema
    // socket.on('message', function(data){
    //     console.log("Type: " + data.type + " Subtype: " + data.subtype + " Value: " + data.val);
    // 		//ToDo
		// });

    //Mensajes de eventos de control
    socket.on('guievent', function (data) {
        console.log("gui event received: ");

        // Refrescamos el listado de discos disponibles para copia
        if (data.name == "refreshhds"){
            get_linux_partitions()
        }

        // Refrescamos listado de imágenes disponibles para copia
        else if (data.name == "refreshimagelist"){
            var imagelist = getDirectories("/home/partimag");
            console.log(imagelist);
            for (i = 0; i < imagelist.length; i++) {
              io.sockets.emit('serverevent', { type: 'addimage', name: imagelist[i]});
            }
        }

        // Comienzo de creación de imagen de disco
        else if (data.name == "start_crate_image"){
          // console.log("Type: " + data.type + " Name: " + data.name + " HD: " + data.hd + " Imagen: " + data.image);
          if (data.hd && data.image){
            console.log("Saving image !!!");
            status = "savingimage";
            io.sockets.emit('serverevent', { type: 'status', value: status});
            exec_command(data.hd, data.image, data.pwd);
          }
        }

        // Comienzo de la copia de imagen a múltiples discos
        else if (data.name == "start_multiple_copy"){
          console.log(data);
          // console.log(data.image);
          var hdstring = data.hdlist.toString().replace(","," ");

          if (data.image && data.hdlist.length > 0){
            console.log("Clonning !!!");
            status = "cloning";
            io.sockets.emit('serverevent', { type: 'status', value: status});
            exec_command(data.image,data.hdlist,data.pwd);
          }
        }

        else if (data.name == "delete_image"){

          console.log("Delete image");
          console.log(data);
          delete_image(data.image, data.pwd);
        }

    });//End of guievents
});


//Functions--------------------------------------------------------------------------------------------------------------

/**
 * Get Linux drives
 * */
function get_linux_partitions(){
  // fs = require('fs')
  fs.readFile('/proc/partitions', 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    else{
      var lines = data.split('\n');
      for (i = 0; i < lines.length; i++) {
        if (lines[i].search("sd[a-z]$") != -1){
          // console.log(lines[i]);
          var details = lines[i].split(" ");
          if (!isInArray(details[details.length - 1], sysdisks)) {
            console.log("Name: " + details[details.length - 1] + " - Size: " + details[details.length - 2]);
            io.sockets.emit('serverevent', { type: 'adddisk', name: details[details.length - 1], size: details[details.length - 2]});
          }
        }
      }
    }
  });
}


/**
 * Get Images in /home/partimag
 * */
function getDirectories(srcpath) {
  return fs.readdirSync(srcpath).filter(function(file) {
    return fs.statSync(path.join(srcpath, file)).isDirectory();
  });
}


/**
 * Función que lanza el script correspondiente según status
 * */
function exec_command(arg1, arg2, pwd){
  var sudo = require('sudo');
  var options = {
      cachePassword: true,
      prompt: 'Password, yo? Has puesto el password.....mmmm.....nO?',
      spawnOptions: { /* other options for spawn */ }
  };

  switch (status) {

    case "savingimage":
      var hd = arg1;
      var image = arg2;
      var args = [ 'sh','hd_to_image.sh',image,hd];
      var child = sudo(args, options);
      break;

    case "cloning":
      var image = arg1;
      var hdlist = arg2;
      var args = [ 'sh','image_to_hds.sh',image];
      for (i = 0; i < hdlist.length; i++){
        args.push(hdlist[i]);
      }
      var child = sudo(args, options);
      break;

    default:
      console.log("No debería estar aquí");
  }//End of switch

  //STDOUT
  child.stdout.on('data', function(data) {
    //Común
    console.log('stdout: ' + data);
    if (data.toString().search("Starting") != -1 || data.toString().search("Elapsed") != -1){
      io.sockets.emit('serverevent', { type: 'consoledebug', data: data.toString()});
    }
    //Saving image
    if (status == "savingimage"){

    }
    //Cloning
    if (status == "cloning"){

    }
  });//End of STDOUT

  //STDERR
  child.stderr.on('data', function(data) {
    //Común
    console.log('stderr: ' + data.toString());
    if (data.toString().search("node-sudo-passwd") != -1){
      console.log("Asking for password");
      child.stdin.write(pwd + "\n");
    }

    else if (data.toString().search("3 incorrect password attempts") != -1){
      io.sockets.emit('serverevent', { type: 'consoledebug', data: "Password incorrecto"});
    }

    else if (data.toString().search("Starting") || data.toString().search("Elapsed")!= -1){
      // console.log(data.toString());
      io.sockets.emit('serverevent', { type: 'consoledebug', data: data.toString()});
    }
    //Saving image
    if (status == "savingimage"){

    }
    //Cloning
    if (status == "cloning"){

    }
  });//End of STDERR

  //CLOSE
  child.on('close', function(code) {
    //Común
    console.log('closing code: ' + code);
    if (status == "cloning" || status == "savingimage"){
      status = "standby";
      io.sockets.emit('serverevent', { type: 'status', value: status});
      io.sockets.emit('serverevent', { type: 'consoledebug', data: "Trabajo finalizado"});
    }
    //Saving image
    if (status == "savingimage"){
      io.sockets.emit('serverevent', { type: "command", name: 'update_imagelist', val: ""});
    }
    //Cloning
    if (status == "cloning"){

    }
  });//End of CLOSE
} //End of exec_command


/**
 * Función que elimina imágenes de disco ubicadas en /home/partimag
 * */

function delete_image(arg1, pwd){
  console.log("Delete Image: " + arg1);
  var sudo = require('sudo');
  var options = {
      cachePassword: true,
      prompt: 'Password, yo? Has puesto el password.....mmmm.....nO?',
      spawnOptions: { /* other options for spawn */ }
  };

  var image_name = arg1;
  var args = [ 'sh','delete_folder.sh',"/home/partimag/" + image_name];
  var child = sudo(args, options);

  //STDOUT
  child.stdout.on('data', function(data) {
    console.log('stdout: ' + data);

  });//End of STDOUT

  //STDERR
  child.stderr.on('data', function(data) {
    console.log('stderr: ' + data.toString());
    if (data.toString().search("node-sudo-passwd") != -1){
      console.log("Asking for password");
      child.stdin.write(pwd + "\n");
    }

    else if (data.toString().search("3 incorrect password attempts") != -1){
      io.sockets.emit('serverevent', { type: 'consoledebug', data: "Password incorrecto"});
    }

  });//End of STDERR

  //CLOSE
  child.on('close', function(code) {
    console.log('closing code: ' + code);
    io.sockets.emit('serverevent', { type: "command", name: 'update_imagelist', val: ""});
    io.sockets.emit('serverevent', { type: 'consoledebug', data: "Borramos imagen de disco: " + image_name});

  });//End of CLOSE
}



// Check if an element is present in an array
function isInArray(value, array) {
  return array.indexOf(value) > -1;
}

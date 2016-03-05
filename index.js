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

        if (data.name == "refreshhds"){
          // Refrescamos el listado de discos disponibles para copia
            get_linux_partitions()
        }
        else if (data.name == "refreshimagelist"){
          // Refrescamos listado de imágenes disponibles para copia
            var imagelist = getDirectories("/home/partimag");
            console.log(imagelist);
            for (i = 0; i < imagelist.length; i++) {
              io.sockets.emit('serverevent', { type: 'addimage', name: imagelist[i]});
            }
        }
        else if (data.name == "start_multiple_copy"){
          // Comienzo de la copia de imagen a múltiples discos
          console.log(data);
          console.log(data.image);

          var hdstring = data.hdlist.toString().replace(","," ");
          console.log(hdstring);

          var clonecommmand = ['ocs-restore-mdisks','-b', '-p', '"-g auto -e1 auto -e2 -c -r -j2 -p true"',data.image];
          for (i = 0; i < data.hdlist.length; i++){
            // console.log(data.hdlist[i]);
            clonecommmand.push(data.hdlist[i]);
          }
          // Lanzamos script de copia múltiple
          // console.log(clonecommmand);
          status = "cloning";
          io.sockets.emit('serverevent', { type: 'status', value: status});
          exec_image_to_disks(data.image,data.hdlist,data.pwd);
        }
        else if (data.name == "start_crate_image"){
          console.log("Type: " + data.type + " Name: " + data.name + " HD: " + data.hd + " Imagen: " + data.image);
          status = "savingimage";
          io.sockets.emit('serverevent', { type: 'status', value: status});
          exec_disk_to_image(data.hd, data.image, data.pwd);
        }
    });
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
 * Creación de imágenes de disco
 * */
function exec_disk_to_image(hd,image,pwd){
  var args = [ 'sh','hd_to_image.sh',image,hd];

  var sudo = require('sudo');
  var options = {
      cachePassword: true,
      prompt: 'Password, yo? Has puesto el password.....mmmm.....nO?',
      spawnOptions: { /* other options for spawn */ }
  };

  var child = sudo(args, options);

  child.stdout.on('data', function(data) {
    console.log('stdout: ' + data);
    // if (data.toString().search("¿Está seguro que quiere continuar?") != -1){
    //   console.log("¿Está seguro que quiere continuar? yessss!");
    //   child.stdin.write("y\n");
    // }

    io.sockets.emit('serverevent', { type: 'consoledebug', data: data.toString()});

  });
  child.stderr.on('data', function(data) {
    console.log('stderr: ' + data.toString());
    if (data.toString().search("node-sudo-passwd") != -1){
      console.log("Asking for password");
      child.stdin.write(pwd + "\n");
    }
    io.sockets.emit('serverevent', { type: 'consoledebug', data: data.toString()});
  });
  child.on('close', function(code) {
    console.log('closing code: ' + code);
    io.sockets.emit('serverevent', { type: 'consoledebug', data: code.toString()});
    if (status == "cloning" || status == "savingimage"){
      status = "standby";
      io.sockets.emit('serverevent', { type: 'status', value: status});
    }
  });
}

/**
 * Copia múltiple desde imagen de disco
 * */
function exec_image_to_disks(image, hdlist, pwd){

  var args = [ 'sh','image_to_hds.sh',image];
  for (i = 0; i < hdlist.length; i++){
    // console.log(data.hdlist[i]);
    args.push(hdlist[i]);
  }

  var sudo = require('sudo');
  var options = {
      cachePassword: true,
      prompt: 'Password, yo? Has puesto el password.....mmmm.....nO?',
      spawnOptions: { /* other options for spawn */ }
  };

  var child = sudo(args, options);

  child.stdout.on('data', function(data) {
    console.log('stdout: ' + data);
    if (data.toString().search("Starting") != -1){
      // console.log(data.toString());
      io.sockets.emit('serverevent', { type: 'consoledebug', data: data.toString()});
    }
  });
  child.stderr.on('data', function(data) {
    console.log('stderr: ' + data.toString());
    if (data.toString().search("node-sudo-passwd") != -1){
      console.log("Asking for password");
      child.stdin.write(pwd + "\n");
    }
  });
  child.on('close', function(code) {
    console.log('closing code: ' + code);
    if (status == "cloning" || status == "savingimage"){
      status = "standby";
    }
  });
}

// Check if an element is present in an array
function isInArray(value, array) {
  return array.indexOf(value) > -1;
}

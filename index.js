// Libraries
var http = require('http');
var express = require("express");
var fs = require('fs'),
    path = require('path');

var app = express();

var localhost = "127.0.0.1";
var port = 3000;

var disks;

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

    //Mensajes de sistema
    // socket.on('message', function(data){
    //     console.log("Type: " + data.type + " Subtype: " + data.subtype + " Value: " + data.val);
    // 		//ToDo
		// });

    //Mensajes de eventos de control
    socket.on('guievent', function (data) {
        console.log("gui event received");
        console.log("Type: " + data.type + " Name: " + data.name + " Value: " + data.val);
        if (data.name == "refreshhds"){
            get_linux_partitions()
        }
        else if (data.name == "refreshimagelist"){
            var imagelist = getDirectories("/home/partimag");
            console.log(imagelist);
            for (i = 0; i < imagelist.length; i++) {
              io.sockets.emit('serverevent', { type: 'addimage', name: imagelist[i]});
            }
        }
        else if (data.name == "start"){
          console.log(data);
          for (i = 0; i < data.hdlist.length; i++){
            console.log(data.hdlist[i]);
          }
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
          console.log("Name: " + details[details.length - 1] + " - Size: " + details[details.length - 2]);
          io.sockets.emit('serverevent', { type: 'adddisk', name: details[details.length - 1], size: details[details.length - 2]});
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
 * Test (borrar)
 * */
function exectest(){
  var exec = require('child_process').exec;
  var child = exec('ls /etc');
  child.stdout.on('data', function(data) {
    // console.log('stdout: ' + data);
    io.sockets.emit('serverevent', { type: 'consoledebug', data: data});
    // var lines = data.split('\n');
    // for (i = 0; i < lines.length; i++) {
    //   io.sockets.emit('serverevent', { type: 'consoledebug', data: lines[i]});
    // }
  });
  child.stderr.on('data', function(data) {
    console.log('stderr: ' + data);
    // var sendtoclients = data;
    // io.sockets.emit('serverevent', { type: 'consoledebug', line: sendtoclients});
  });
  child.on('close', function(code) {
    console.log('closing code: ' + code);
    // var sendtoclients = data;
    // io.sockets.emit('serverevent', { type: 'consoledebug', line: sendtoclients});
  });
}

// Libraries
var http = require('http');
var express = require("express");

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

    exectest();

    //Mensajes de sistema
    // socket.on('message', function(data){
    //     console.log("Type: " + data.type + " Subtype: " + data.subtype + " Value: " + data.val);
    // 		//ToDo
		// });

    //Mensajes de eventos de control
    socket.on('guievent', function (data) {
        console.log("gui event received");
        console.log("Type: " + data.type + " Name: " + data.name + " Value: " + data.val);
        if (data.name == "refresh"){
            get_linux_partitions()
        }
    });
});


// http://nodejs.org/api.html#_child_processes
// var util = require('util')
// var exec = require('child_process').exec;
// var child;

// child = exec("cat /proc/partitions", function (error, stdout, stderr) {
//   console.log('stdout: ' + stdout);
//   console.log('stderr: ' + stderr);
//   if (error !== null) {
//     console.log('exec error: ' + error);
//   }
// });





//Functions--------------------------------------------------------------------------------------------------------------

/**
 * Get Linux drives
 * */
function get_linux_partitions(){
  fs = require('fs')
  fs.readFile('partitions', 'utf8', function (err,data) {
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

function exectest(){
  var exec = require('child_process').exec;
  var child = exec('cat /var/log/monthly.out');
  child.stdout.on('data', function(data) {
    // console.log('stdout: ' + data);
    // console.log(typeof(data));
    // var sendtoclients = data;
    // io.sockets.emit('serverevent', { type: 'consoledebug', line: sendtoclients});
  });
  child.stderr.on('data', function(data) {
    console.log(typeof(data));
    // console.log('stdout: ' + data);
    // var sendtoclients = data;
    // io.sockets.emit('serverevent', { type: 'consoledebug', line: sendtoclients});
  });
  child.on('close', function(code) {
    console.log(typeof(data));
    // console.log('closing code: ' + code);
    // var sendtoclients = data;
    // io.sockets.emit('serverevent', { type: 'consoledebug', line: sendtoclients});
  });
}

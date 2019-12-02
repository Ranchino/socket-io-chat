const express = require('express');
const axios = require('axios');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const bodyparser = require('body-parser');

app.use(bodyparser.json());

app.use(express.static('public'));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname+'/public/static/web/index.html'));
});

var nickname;
var chatNickName = []

app.post('/addNick', function (req, res) {
 
  if (!req.body.pass || !req.body.room || req.body.rom && !req.body.pass || !req.body.room && req.body.pass ) {
    console.log("Rum och lösenord är skapat");
    res.status(403).send({message: "Skriv in ett rum och lösenord 😇" });
    /* res.send({ message: "Skriv in ett rum och lösenord 😇"}, 403); */

    return
  } else {
    for(var i = 0; i < chatNickName.length; i++){
      if(req.body.name == chatNickName[i].alias) {
        res.status(403).send({ message: "Namnet är upptaget, välj något annat! 😇"});
        return
      }
    }
    chatNickName.push(
      {
        alias: req.body.name
      }
    )
    res.send("Du har skapat ett alias");

  }

})

app.get('/joke', function(req, res){
    axios.get('https://api.yomomma.info/')
    .then(function (response) {
        res.send(response.data.joke)
    })
    .catch(function (error) {
        console.error(error);
    });
});

app.get('/gif', function(req, res){
    axios.get('https://api.tenor.com/v1/random?q=cat&key=KSA73B7YRX6Z')
    .then(function (response) {
        res.send(response.data.results[0].media[0].tinygif.url);
    })
    .catch(function (error) {
        console.error(error);
    });
});

io.on('connection', function(socket){

  socket.on('create', function(room, password){
    console.log(room, password);
    if(room.length >= 1 && password.length >= 1){
      socket.join(room);
      /* socket.to(room).emit('some event'); */
      socket.room = room
    }
  })

    socket.on('userNickName', function(inputNickName){
      socket.nickname = inputNickName;
      io.to(socket.room).emit('connected user', socket.nickname);
      
    })
    
    socket.on('disconnect', function(inputNickName){
        console.log('user disconnected');
        nickname = inputNickName;
        io.to(socket.room).emit('disconnected user', socket.nickname);
    });


    socket.on('chat message', function(msg){
        console.log(socket.nickname + ' message: ' + msg);
        io.to(socket.room).emit('chat message', msg, socket.nickname);
    });

    socket.on('typing', function(typing){
        console.log('Någon skriver..' + typing + " " + socket.nickname);
        io.to(socket.room).emit('typing', typing, socket.nickname);
    });

    socket.on('joke', function(joke){
        console.log(joke);
        io.emit('joke', joke);
    });

    socket.on('gif', function(gif){
        console.log(gif);
        io.emit('gif', gif);
    });

});

http.listen(1337, function(){
  console.log('Listening on 1337');
});


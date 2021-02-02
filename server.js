const rooms = []
const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server,{
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const { ExpressPeerServer } = require('peer');

const peerServer = ExpressPeerServer(server, {
  debug: true
});

app.get('/', (request, response) => {
  response.json({message: 'Hello'})
})

app.use('/peerjs', peerServer);



io.on('connection', socket => {
  socket.on('join-room', (roomId, userId, name) => {
    socket.join(roomId)

    socket.to(roomId).broadcast.emit('user-connected', {userId, userName: name} )
    
    socket.to(roomId).broadcast.emit('create-notification', { notification:`${name} - Entrou no chat`})
    
    socket.on('message', ({name, message}) => {
      socket.to(roomId).broadcast.emit('create-message', {name, message})
    });

    socket.on('notification', ({ notification}) => {
      socket.to(roomId).broadcast.emit('create-notification', {notification})
    });

    socket.on('hand-up', ({userId, isHandUp}) => {
      
      if(isHandUp){
        socket.to(roomId).broadcast.emit('create-notification', {notification:`${name} - Levantou a mão`})
      }else {
        socket.to(roomId).broadcast.emit('create-notification', {notification:`${name} - Abaixou a mão`})
      }
      
      socket.to(roomId).broadcast.emit('toggle-hand-up', {userId: `${userId}`, isHandUp})
    });

    socket.on('mute', ({userId, isMute}) => {
      

      if(isMute){
        socket.to(roomId).broadcast.emit('create-notification', {notification:`${name} - Desabilitou audio`})
      }else {
        socket.to(roomId).broadcast.emit('create-notification', {notification:`${name} - Habilitou audio`})
      }
      
      socket.to(roomId).broadcast.emit('toggle-mute', {userId: `${userId}`, isMute})
    });


    socket.on('disable-cam', ({userId, isDisableCam}) => {      
      socket.to(roomId).broadcast.emit('toggle-cam', {userId: `${userId}`, isDisableCam})
    });

    

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
      socket.to(roomId).broadcast.emit('create-notification', { notification:`${name} - Saiu da sala`})
      
    })

    socket.on('user-start-transmitting', ()=> {
      socket.to(roomId).broadcast.emit('create-notification', {notification:`${name} - Está transmitindo`})
    })

    socket.on('user-stop-transmitting', ()=> {
      socket.to(roomId).broadcast.emit('create-notification', {notification:`${name} - Parou de transmitir`})
      io.to(roomId).emit('remove-shared-screen', {userId})
    })
  })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {console.log(`Listening in port: ${PORT}`)})
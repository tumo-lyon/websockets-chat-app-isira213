import { createServer } from 'node:http';
import express from 'express';
import { Server as SocketServer } from 'socket.io';
import fs from 'node:fs';

const app = express();
const server = createServer(app);
const io = new SocketServer(server);

app.use(express.static('public'));

app.get("/", (req,res)=> {
    res.redirect("/index.html");
});

server.listen(3000, ()=>{
    console.log("Server is listening on port 3000");
});

const typingUsers = new Set();
const cooldown = new Set();
io.on('connection', (socket) =>{
    console.log(`Un client est connecté: ${socket.id}`);
    io.emit('system_message', {content : `Bienvenue dans le chat ${socket.id}.`});

    socket.on('disconnect', () => {
        console.log(`Un client c'est déconnecté: ${socket.id}`)
        io.emit('system_message', {content : `${socket.id} s'est déconnecté du chat.`});

    });

    socket.on('user_message_send', (content) =>{
        if (cooldown.has(socket.id)) return;
        let date = new Date();
        let time = date.toLocaleTimeString()

        cooldown.add(socket.id)

        setTimeout(() => cooldown.delete(socket.id), 1000);
        if(content.content.trim() !==''){
            for(const [id, sock] of io.sockets.sockets){
                sock.emit('user_message', {
                    author : socket.id,
                    content : content.content,
                    time : time,
                    isMe : id === socket.id
                });
            }
        }
        
        // let log = content.content
        // fs.writeFile("logs.txt", log);

        

    });

    socket.on('typing_start', () =>{
        typingUsers.add(socket.id);
        io.emit('typing', Array.from(typingUsers));
    });

    socket.on('typing_stop', () =>{
        typingUsers.delete(socket.id);
        io.emit('typing', Array.from(typingUsers));
    });


    

})




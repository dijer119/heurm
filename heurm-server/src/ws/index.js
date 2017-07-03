const Router = require('koa-router');

const ws = new Router();
const dispatcher = require('lib/dispatcher');

const connections = [];

dispatcher.on('new_post', post => {
    connections.forEach(socket => {
        try {
            socket.send(JSON.stringify(post));
        } catch(e) {
            if(e.message === 'not opened') {
                socket.close();
            }
        }
    });
});

ws.get('/ws', (ctx, next) => {
    connections.push(ctx.websocket);
    const index = connections.length - 1;
    console.log('Client #' + index + ' has connected');
    

    ctx.websocket.on('close', () => {
        connections.splice(index, 1);
        console.log('Client #' + index + ' has disconnected');
    });
});

module.exports = ws;

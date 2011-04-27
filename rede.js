var redis  = require('redis'),
    http   = require('http'),
    io     = require('socket.io'),
    subscriber = redis.createClient(),
    publisher  = redis.createClient(),
    Channel    = require('./channel').channel;

Channel.publisher  = publisher;
Channel.subscriber = subscriber;

var server = http.createServer(function(request, response) {
  response.writeHeader(200, { 'Content-Type': 'text/html' });
  response.end('Hello world\n');
});

server.listen(8080, '0.0.0.0');
console.log('Server is active at http://0.0.0.0:8080');

var socket = io.listen(server);

socket.on('connection', function(client) {
  console.log('Connection [' + client.sessionId + ']');
  client.send("'connected'");

  client.on('message', function(text) {
    console.log('Message [' + client.sessionId + ']: ' + text);

    var message = JSON.parse(text);
    var channel = Channel.all[message.to] || Channel.create(message.to);

    if (message.state) {
      switch(message.state) {
        case 'available':
          channel.subscribe(client.sessionId);
          break;
        case 'unavailable':
          channel.unsubscribe(client.sessionId);
          break;
      }
    }

    console.info('Publish [' + client.sessionId + ']: ' + message.to);
    channel.publish(text);
  });

  client.on('disconnect', function() {
    console.log('Disconnect [' + client.sessionId + ']');

    for (var name in Channel.all) {
      var channel = Channel.all[name];
      if (channel.subscribers[client.sessionId]) {
        var unavailable = {
          from:  client.sessionId,
          state: 'unavailable',
          to:    channel.name,
        }

        console.log('unavailable');
        channel.publish(JSON.stringify(unavailable));
        channel.unsubscribe(client.sessionId);
      }
    }
  });
});

Channel.subscriber.on('message', function(channel, message) {
  console.info('Subscription found [' + channel + ']');

  if (channel = Channel.all[channel]) {
    for (var subscriber in channel.subscribers) {
      console.info('Subscriber is ' + subscriber);
      socket.clients[subscriber].send(message);
    }
  }
});


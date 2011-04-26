Channel = function(name) {
  this.name        = name;
  this.subscribers = {};
};

Channel.all        = {};
Channel.publisher  = null;
Channel.subscriber = null;

Channel.create = function(name) {
  if (!this.all[name]) {
    this.all[name] = new Channel(name);
    this.subscriber.subscribe(name);
  }

  return this.all[name];
};

Channel.destroy = function(name) {
  delete this.all[name];
  this.subscriber.unsubscribe(name);
};

Channel.prototype = {
  name:        null,
  subscribers: null,

  publish: function(message) {
    Channel.publisher.publish(this.name, message);
  },

  subscribe: function(subscriber) {
    this.subscribers[subscriber] = true;
  },

  unsubscribe: function(subscriber) {
    delete this.subscribers[subscriber];

    if (!Object.keys(this.subscribers).length) {
      Channel.destroy(this.name);
    }
  }

};

exports.channel = Channel;

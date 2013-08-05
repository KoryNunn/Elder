var interact = require('interact-js'),
    requestAnimationFrame = window.requestAnimationFrame,
    frameTime = 100;

function Elder(element, settings){
    if(!element){
        return;
    }

    for(var key in settings){
        if(settings.hasOwnProperty(key)){
            this[key] = settings[key];
        }
    }
    
    this.element = element;
    element._elder = this;
    this.position = {
        y:0,
        x:0
    };
    this.velocity = {
        y:0,
        x:0
    };
    this.outOfBounds = {
        y:0,
        x:0
    };
    this._events = [];
}

Elder.prototype.friction = 3; // pix per sec friction

Elder.prototype.animate = function(time){
    this.element.style['-webkit-transition'] = '-webkit-transform ' + time / 1000 + 's ' + 'linear';
    return this;
};

var lastFrameCall;

function moveTo(elder, position, callback, synchronous){
    elder.position.x = position.x;
    elder.position.y = position.y;

    checkBounds(elder);

    var updatePosition = function(timeStamp){
        elder.element.style['-webkit-transform'] = 'translate3d(' + elder.position.x + 'px,' + elder.position.y + 'px,0)';
        if(callback){
            callback();
        }
    };

    cancelAnimationFrame(lastFrameCall);

    synchronous ? updatePosition() : (lastFrameCall = requestAnimationFrame(updatePosition));
}



Elder.prototype.scrollTo = function(position, callback){
    var elder = this;
    this.velocity.x = 0;
    this.velocity.y = 0;

    moveTo(this, position, function(){
        if(callback){
            callback();
        }

        elder.trigger({
            type: 'scroll'
        });
    });
    
    return this;
};

function checkBounds(elder){
    elder.outOfBounds.y = 0;
    elder.outOfBounds.x = 0;

    if(elder.position.y > 0){
        elder.outOfBounds.y = elder.position.y;
    }else if(elder.position.y < 0 - (elder.element.scrollHeight - elder.element.parentNode.clientHeight)){
        elder.outOfBounds.y = (elder.element.scrollHeight - elder.element.parentNode.clientHeight) + elder.position.y;
    }

    if(elder.position.x > 0){
        elder.outOfBounds.x = elder.position.x;
    }else if(elder.position.x < 0 - (elder.element.scrollWidth - elder.element.parentNode.clientWidth)){
        elder.outOfBounds.x = (elder.element.scrollWidth - elder.element.parentNode.clientWidth) + elder.position.x;
    }
}

Elder.prototype.warpTo = function(position, callback, synchronous){
    if(this.tweenToPosition){
        this.tweenToPosition.x -= this.position.x - position.x;
        this.tweenToPosition.y -= this.position.y - position.y;
    }
    moveTo(this, position, callback, synchronous);

    return this;
};

Elder.prototype.warpBy = function(position, callback, synchronous){
    this.warpTo({
        x: this.position.x + position.x,
        y: this.position.y + position.y
    }, callback, synchronous);

    return this;
};

function clearVelocity(elder){
    elder.velocity.x = elder.velocity.y = 0;
}

Elder.prototype.scrollBy = function(position, callback){
    var elder = this,
        now = new Date(),
        timeDifference = (now - this.lastUpdate) || 1;

    this.scrollTo({
        x: this.position.x + position.x,
        y: this.position.y + position.y
    }, callback);


    this.velocity.x = position.x * (16 / timeDifference);
    this.velocity.y = position.y * (16 / timeDifference);
    
    this.lastUpdate = now;

    return this;
};

Elder.prototype.beginUpdate = function(){
    this.held = true;
    return this;
};

function animateTo(elder, position, callback){
    clearVelocity(elder);
    elder.tweenToPosition = position;
    var tweenTo = function(){
            if(!elder.tweenToPosition){
                return;
            }
            if(Math.abs(elder.position.x - elder.tweenToPosition.x) < 0.1){
                elder.position.x = elder.tweenToPosition.x;
            }
            if(Math.abs(elder.position.y - elder.tweenToPosition.y) < 0.1){
                elder.position.y = elder.tweenToPosition.y;
            }

            if(elder.position.x === elder.tweenToPosition.x && elder.position.y === elder.tweenToPosition.y){
                elder.tweenToPosition = null;
                if(callback){
                    callback();
                }

                elder.trigger({
                    type: 'settle'
                });
                return;
            }

            elder.position.x -= (elder.position.x - elder.tweenToPosition.x) * 0.1;
            elder.position.y -= (elder.position.y - elder.tweenToPosition.y) * 0.1;
            
            moveTo(
                elder, 
                {
                    x: elder.position.x,
                    y: elder.position.y
                },
                function(){
                    if(elder.held){
                        return;
                    }
                    elder.trigger({
                        type: 'scroll'
                    });
                    tweenTo();
                }
            );
        };

    tweenTo();
}

Elder.prototype.animateTo = function(position){
    animateTo(this, position);
};

Elder.prototype.deceleration = function(velocity){
    velocity.x *= 0.95;
    velocity.y *= 0.95;
};

Elder.prototype.endUpdate = function(){
    var elder = this;

    if(!this.held){
        return;
    }

    if(new Date() - this.lastUpdate > 50){            
        clearVelocity(elder);
    }

    this.held = false;

    if(elder.outOfBounds.x || elder.outOfBounds.y){
        elder.trigger({
            type: 'overscroll',
            which: [elder.outOfBounds.x && (elder.outOfBounds.x > 0 ? 'right' : 'left'), elder.outOfBounds.y && (elder.outOfBounds.y > 0 ? 'top' : 'bottom')].join(' '),
            distance: {
                x: Math.abs(elder.outOfBounds.x),
                y: Math.abs(elder.outOfBounds.y)
            }
        });

        var settleLocation = {};

        settleLocation.y = elder.element.parentNode.clientHeight > elder.element.clientHeight ?
            0:
            elder.position.y - elder.outOfBounds.y;


        settleLocation.x = elder.element.parentNode.clientWidth > elder.element.clientWidth ?
            0:
            elder.position.x - elder.outOfBounds.x;


        animateTo(elder, settleLocation);

        elder.outOfBounds.x = 0;
        elder.outOfBounds.y = 0;

        return;

    }

    var  momentumScroll = function(){
            var totalVelocity = Math.sqrt(Math.pow(elder.velocity.x,2) + Math.pow(elder.velocity.y,2));

            if(elder.outOfBounds.x){
                elder.position.x -= elder.outOfBounds.x;
                elder.velocity.x = 0;
            }

            if(elder.outOfBounds.y){
                elder.position.y -= elder.outOfBounds.y;
                elder.velocity.y = 0;                    
            }

            moveTo(
                elder, 
                {
                    x: elder.position.x += elder.velocity.x,
                    y: elder.position.y += elder.velocity.y
                },
                function(){
                    elder.trigger({
                        type: 'scroll'
                    });
                    if(elder.held || totalVelocity <= 0.1){
                        if(!elder.held){
                            elder.trigger({
                                type: 'settle'
                            });
                        }
                        return;                            
                    }

                    elder.deceleration(elder.velocity);

                    momentumScroll();
                }
            );
        };

    momentumScroll(100);

    return this;
};

Elder.prototype.trigger = function(event){
    event.target = this;
    if(this._events[event.type]){
        for(var i = 0; i < this._events[event.type].length; i++){
            this._events[event.type][i](event);
        }
    }
    return this;
};

Elder.prototype.on = function(type, callback){
    if(!this._events[type]){
        this._events[type] = [];
    }
    this._events[type].push(callback);
    return this;
};

module.exports = Elder;
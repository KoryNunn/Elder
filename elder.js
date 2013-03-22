// requestAnimationFrame poly https://gist.github.com/paulirish/1579671
;(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
;(function(){
    var requestAnimationFrame = window.requestAnimationFrame;
    
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
        this._events = [];
    };

    Elder.prototype.momentum = 1;

    Elder.prototype.animate = function(time, ease){
        this.element.style['-webkit-transition'] = time ? '-webkit-transform ' + time / 1000 + 's ' + (ease === false ? 'linear' : 'ease-out') : 'none';
        return this;
    };

    Elder.prototype.scrollTo = function(position, wasMomentumScroll){
        var elder = this;
        this.beforeScrollPosition = {
            x: this.position.x,
            y: this.position.y
        };
        this.position = position;
        requestAnimationFrame(function(timestamp){
            elder.element.style['-webkit-transform'] = 'translate3d(' + position.x + 'px,' + position.y + 'px,0)';
        });
        if(!wasMomentumScroll){
            this.trigger({
                type: 'scroll',
                position: position,
                beforeScrollPosition: this.beforeScrollPosition
            });
        }
        return this;
    };

    Elder.prototype.scrollBy = function(position){
        var ellapsedTime = new Date() - this.lastUpdateTime || 1;

        this.position.x += position.x;
        this.position.y += position.y;
        this.velocity.x = (this.velocity.x + (position.x / ellapsedTime * 2))/3;
        this.velocity.y = (this.velocity.y + (position.y / ellapsedTime * 2))/3;
        this.scrollTo(this.position);
        this.lastUpdateTime = new Date();
        return this;
    };

    Elder.prototype.beginUpdate = function(){
        this.animate(false);
        return this;
    };

    Elder.prototype.endUpdate = function(){
        var elder = this;

        if(Math.abs(this.velocity).x > 0.5 || Math.abs(this.velocity.y) > 0.5){
            var animateTime = Math.min(Math.max(Math.max(Math.abs(this.velocity.x), Math.abs(this.velocity.y)) * 50 * this.momentum, 100),800);
            this.animate(animateTime);

            this.position.x += this.velocity.x * 50 * this.momentum;
            this.position.y += this.velocity.y * 50 * this.momentum;

            this.velocity = {x:0,y:0};

            this.scrollTo(this.position, true);
        }

        var overscrolled,
            settlePosition = {
                x: this.position.x,
                t: this.position.y
            };

        if(this.position.y > 0){
            overscrolled = true;
            this.trigger({
                type: 'overscroll',
                which:'top',
                distance: this.position.y
            });
            settlePosition.y = 0;
        }
        if(this.position.y < 0 - (this.element.scrollHeight - this.element.parentNode.clientHeight)){
            overscrolled = true;
            this.trigger({
                type: 'overscroll',
                which:'bottom',
                distance: Math.abs((this.element.scrollHeight - this.element.parentNode.clientHeight) + this.position.y)
            });
            settlePosition.y = -(this.element.scrollHeight - this.element.parentNode.clientHeight);
        }

        if(this.position.x > 0){
            overscrolled = true;
            this.trigger({
                type: 'overscroll',
                which:'left',
                distance: this.position.x
            });
            settlePosition.x = 0;
        }
        if(this.position.x < 0 - (this.element.scrollWidth - this.element.parentNode.clientWidth)){
            overscrolled = true;
            this.trigger({
                type: 'overscroll',
                which:'right',
                distance: Math.abs((this.element.scrollWidth - this.element.parentNode.clientWidth) + this.position.x)
            });
            settlePosition.x = -(this.element.scrollWidth - this.element.parentNode.clientWidth);
        }

        if(overscrolled){
            this.scrollTo(settlePosition);
        }


        return this;
    };

    Elder.prototype.trigger = function(event){
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

    window.Elder = Elder;

})();
(function(){
    
    function Elder(element){
        if(!element){
            return;
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
    }

    Elder.prototype.animate = function(time, ease){
        this.element.style['-webkit-transition'] = time ? '-webkit-transform ' + time / 1000 + 's ' + (ease === false ? 'linear' : 'ease-out') : 'none';
        return this;
    };

    Elder.prototype.scrollTo = function(position){
        var elder = this;
        this.position = position;
        webkitRequestAnimationFrame(function(timestamp){
            elder.element.style['-webkit-transform'] = 'translate3d(' + position.x + 'px,' + position.y + 'px,0)';
        });
        this.trigger({
            type: 'scroll',
            position: position
        });
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
        var animateTime = Math.max(Math.max(Math.abs(this.velocity.x), Math.abs(this.velocity.y)) * 50, 200);
        this.animate(animateTime);

        this.position.x += this.velocity.x * 100;
        this.position.y += this.velocity.y * 100;

        this.scrollTo(this.position);

        if(this.position.y > 0){
            this.trigger({
                type: 'overscroll',
                which:'top',
                distance: this.position.y
            });
            this.position.y = 0;
        }
        if(this.position.y < 0 - (this.element.scrollHeight - this.element.parentNode.clientHeight)){
            this.trigger({
                type: 'overscroll',
                which:'bottom',
                distance: Math.abs((this.element.scrollHeight - this.element.parentNode.clientHeight) + this.position.y)
            });
            this.position.y = -(this.element.scrollHeight - this.element.parentNode.clientHeight);
        }

        if(this.position.x > 0){
            this.trigger({
                type: 'overscroll',
                which:'left',
                distance: this.position.x
            });
            this.position.x = 0;
        }
        if(this.position.x < 0 - (this.element.scrollWidth - this.element.parentNode.clientWidth)){
            this.trigger({
                type: 'overscroll',
                which:'right',
                distance: Math.abs((this.element.scrollWidth - this.element.parentNode.clientWidth) + this.position.x)
            });
            this.position.x = -(this.element.scrollWidth - this.element.parentNode.clientWidth);
        }

        this.scrollTo(this.position);
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
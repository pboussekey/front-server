
angular.module('EVENTS')
    .factory('events_service',['$q',function($q){

        var manager = function(){
            this.listeners = {};
            this.uid = 0;
        };

        manager.prototype.default_priority = 50;

        manager.prototype.on = function( evt, callback, context, priority ){
            if( !this.listeners[evt] ){
                this.listeners[evt] = [];
            }
            this.uid ++;
            this.listeners[evt].push({fn:callback, ctx:context, p: priority !== undefined ? priority : this.default_priority, uid:this.uid});
            return this.uid;
        };

        manager.prototype.off = function( event, uidOrFn ){
            if( !event && !uidOrFn ){
                this.listeners = {};
            }else{
                if( event && this.listeners[event] ){
                    if( !uidOrFn ){
                        delete( this.listeners[event] );
                    }else{
                        var index;

                        if( this.listeners[event].some(function(l, i){
                            if( l.uid === uidOrFn || l.fn === uidOrFn ){
                                index = i;
                                return true;
                            }
                        }) ){
                            this.listeners[event].splice( index, 1);
                        }
                    }
                }else{
                    var evt, index;
                    if( Object.keys( this.listeners ).some(function( e ){
                        return this.listeners[e].some(function(l, i){
                            if( l.uid === uidOrFn || l.fn === uidOrFn ){
                                evt = e;
                                index = i;
                                return true;
                            }
                        });
                    }.bind(this)) ){
                        this.listeners[evt].splice( index, 1);
                    }
                }
            }
        };

        manager.prototype.process = function(){

            var deferred = $q.defer(),
                event = arguments[0],
                queue = {},
                eventObject = { type: event, datas: Array.from(arguments).slice(1) },
                length = this.listeners[event]?this.listeners[event].length:0;

            if( typeof event === 'string' && length ){
                // BUILD PRIORITY QUEUE OBJECT.
                this.listeners[event].forEach(function( listener ){
                    if( !queue[ listener.p ] )
                        queue[ listener.p ] = [];

                    queue[ listener.p ].push( listener );
                });

                var promise = undefined;
                var processPriority = function( priority ){
                    var l = queue[priority].length,
                        d = $q.defer(),
                        stepresolver = function(){
                            l--;
                            if( !l ){ d.resolve(); }
                        };

                    queue[priority].forEach(function( listener ){
                        var stepPromise = listener.fn.bind(listener.ctx)( eventObject );
                        if( stepPromise )
                            stepPromise.finally(stepresolver);
                        else
                            stepresolver();
                    });

                    return d.promise;
                };

                Object.keys( queue ).sort(function(a,b){ return a-b; }).forEach(function(k){
                    if( promise ){
                        promise = promise.then( processPriority.bind(null,k) );
                    }else{
                        promise = processPriority(k);
                    }
                });

                promise.then( function(){ deferred.resolve(); });
            }else{
                deferred.resolve();
            }

            return deferred.promise;
        };

        return new manager();
    }]);

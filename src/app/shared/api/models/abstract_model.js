
angular.module('API')
    .factory('abstract_model_service',['api_service','$q','service_garbage','storage',
        function( api_service, $q, service_garbage, storage ){

            function smodel( config ){
                Object.assign( this, config );

                this.list = {};
                this._req_aborters = [];

                this.cached = JSON.parse( storage.getItem(this.cache_list_name) || '[]');
                if( this._emptyOnRefresh ){
                    this.clear();
                }

                service_garbage.declare( this.clear.bind(this) );
            };

            smodel.prototype._emptyOnRefresh = true;

            // CLEAR MODEL SERVICE
            smodel.prototype.clear = function(){
                this.list = {};

                // ABORT REQUESTS
                this._req_aborters.forEach(function(a){ a.resolve(); });
                this._req_aborters = [];

                // CLEAR CACHED MODELS
                this.cached.forEach(function( uid ){
                    storage.removeItem( this.cache_model_prefix+uid );
                }.bind(this));

                // CLEAR LIST OF CACHED ITEMS
                this.cached = [];
                storage.removeItem( this.cache_list_name );
            };

            smodel.prototype.outdated_timeout = 1000 * 60 * 5;

            // CHECK IF A UPDATED DATE IS OUTDATED
            smodel.prototype._isOutDated = function( date, delay ){
                return Date.now() - (new Date(date)).getTime() > delay;
            };

            // BUILD GET PARAMS
            smodel.prototype._buildGetParams = function( ids ){
                return { id: ids };
            };

            // GET MODEL FROM CACHE
            smodel.prototype._getFromCache = function( uid ){
                this.list[uid] = JSON.parse( storage.getItem( this.cache_model_prefix + uid ) );
                return this.list[uid];
            };

            smodel.prototype._format = function( d ){ return d; };

            smodel.prototype._setModel = function( datum, _index ){
                var index = _index+'';

                if( !this.list[index] ){
                    this.list[index] = {};
                }

                this.list[index].datum = datum === null ? null : this._format( datum );
                this.list[index].updated_date = Date.now();

                delete( this.list[index].promise );

                var cacheIndex = this.cached.indexOf(index);

                if( cacheIndex === -1 && datum !== null ){
                    if( this.cached.length === this.cache_size ){
                        var uid = this.cached.pop();
                        storage.removeItem( this.cache_model_prefix + uid );
                    }

                    this.cached.unshift(index);
                    storage.setItem( this.cache_list_name, JSON.stringify(this.cached) );
                }else if( cacheIndex !== -1 && datum === null ){
                    this._deleteModelCache(index);
                }

                // SET CACHE
                this._updateModelCache(index);
            };

            smodel.prototype._updateModelCache = function( index ){
                storage.setItem( this.cache_model_prefix+index, JSON.stringify({
                    updated_date: this.list[index].updated_date,
                    datum: this.list[index].datum
                }));
            };

            smodel.prototype._deleteModelCache = function( _index ){
                var index = _index+'';
                storage.removeItem( this.cache_model_prefix+index );

                var cdx = this.cached.indexOf(index);
                if( cdx !== -1 ){
                    this.cached.splice( cdx, 1 );
                    storage.setItem( this.cache_list_name, JSON.stringify(this.cached) );
                }
            };

            smodel.prototype._outdateModel = function( uid ){
                var model = this._getModel(uid);
                if( model ){
                    model.updated_date = 0;
                    this._updateModelCache( uid );
                }
            };

            smodel.prototype._getModel = function( _uid ){
                var uid = _uid+'', model = this.list[uid];

                if( !model && this.cached.indexOf(uid+'') !== -1 ){
                    model = this._getFromCache( uid );
                }

                return model;
            };

            smodel.prototype._deleteModel = function( index ){
                if( this.list[index] ){
                    delete( this.list[index] );
                    this._deleteModelCache(index);
                }
            };
            
            smodel.prototype._deletePromise = function( index ){
                if( this.list[index] ){
                    if( this.list[index].datum ){
                        delete(this.list[index].promise);
                    }else{
                        delete(this.list[index]);
                    }                    
                }                
            };

            smodel.prototype.queue_timeout = 50;

            // TO DO => Timeout management & Maybe separate forced & unforced queue...
            smodel.prototype.queue = function( uids, force, timeout ){
                if( !this.queued ){
                    this.queued = {
                        deferred: $q.defer(),
                        ids: {}
                    };

                    uids.forEach(function(k){ this.queued.ids[k]=null; }.bind(this));

                    setTimeout(function(){
                        this.get( Object.keys(this.queued.ids), force )
                            .then(this.queued.deferred.resolve, this.queued.deferred.reject);
                        delete( this.queued );
                    }.bind(this), timeout || this.queue_timeout );
                }else{
                    uids.forEach(function(k){ this.queued.ids[k]=null; }.bind(this));
                }

                return this.queued.deferred.promise;
            };

            smodel.prototype.get = function( uids, force, timeout ){

                var deferred = $q.defer(),
                    ids = uids.concat(),
                    //outdateds = [],
                    promises = [],
                    count = -1,
                    failed = false,
                    resolve = function(){
                        count++;
                        if( count === promises.length ){
                            if( !failed ){
                                deferred.resolve();
                            }else{
                                deferred.reject();
                            }
                        }
                    }, fail = function(){
                        failed = true;
                        resolve();
                    };

                //if( !force ){
                    // CHECK WICH MODEL HAS TO BE REQUESTED
                    uids.forEach(function( uid ){
                        var model = this._getModel( uid );
                        // IF MODEL DATUM EXITS && NOT OUTDATED
                        if( !force && model && model.datum &&
                            !this._isOutDated( model.updated_date, timeout || this.outdated_timeout ) ){
                            ids.splice( ids.indexOf(uid), 1 );
                        }
                        // IF MODEL IS ALREADY REQUESTED & DOESNT EXIST => DONT REQUEST MODEL & WAIT MODEL RECEPTION TO RESOLVE.
                        else if( model && model.promise ){
                            if( promises.indexOf( model.promise ) === -1 ){
                                promises.push( model.promise );
                                model.promise.then( resolve, fail );
                            }
                            ids.splice( ids.indexOf(uid), 1 );
                        }
                    }.bind(this));
                //}

                // IF THERE IS STILL IDS TO REQUEST
                if( ids.length ){
                    var methodDeferred = $q.defer();
                    // CREATE & SET MODEL PROMISE
                    ids.forEach(function( uid ){
                        if( !this.list[uid] ){
                            this.list[uid] = {};
                        }
                        this.list[uid].promise = methodDeferred.promise;
                    }.bind(this));

                    // CREATE REQUEST ABORTER.
                    var a = $q.defer();
                    this._req_aborters.push( a );

                    // REQUEST MODELS
                    api_service.queue( this._method_get, this._buildGetParams(ids), a ).then(function( d ){
                        // DELETE REQUEST ABORTER.
                        this._req_aborters.splice( this._req_aborters.indexOf(a) );

                        ids.forEach(function( k ){
                            if( d[k] ){
                                this._setModel( d[k], k);
                            }else{
                                this._deleteModel( k );
                            }
                        }.bind(this));

                        methodDeferred.resolve();
                    }.bind(this), function(){
                        this._req_aborters.splice( this._req_aborters.indexOf(a) );

                        ids.forEach(function( k ){
                            this._deletePromise( k );
                        }.bind(this));

                        methodDeferred.reject( arguments );
                    }.bind(this));

                    methodDeferred.promise.then(resolve, fail);
                }else{
                    resolve();
                }

                // IF SOME MODELS ARE OUTDATED => LAUNCH SIDED REQUEST TO UPDATE THEM.
                /*if( outdateds.length ){
                    var updQ = $q.defer();
                    // CREATE & SET MODEL PROMISE
                    outdateds.forEach(function( uid ){
                        this.list[uid].promise = updQ.promise;
                    }.bind(this));

                    // CREATE REQUEST ABORTER.
                    var b = $q.defer();
                    this._req_aborters.push( b );

                    api_service.queue( this._method_get, this._buildGetParams(outdateds) ).then(function( d ){
                        // DELETE REQUEST ABORTER.
                        this._req_aborters.splice( this._req_aborters.indexOf(b) );

                        Object.keys(d).forEach(function( k ){
                            this._setModel( d[k], k);
                        }.bind(this));

                        updQ.resolve();
                    }.bind(this), function(){
                        this._req_aborters.splice( this._req_aborters.indexOf(b) );

                        outdateds.forEach(function( k ){
                            this._deleteModel( k );
                        }.bind(this));

                        updQ.reject();
                    }.bind(this));
                }*/

                return deferred.promise;
            };

            return smodel;
        }
    ]);

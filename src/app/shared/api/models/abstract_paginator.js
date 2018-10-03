
angular.module('API')
    .factory('abstract_paginator_model',['api_service','$q','service_garbage','storage',
        function( api_service, $q, service_garbage, storage ){

            function paginator( config, undeclare ){
                Object.assign( this, config);

                if( this._emptyOnRefresh ){
                    this.clear();
                }

                var buffer = JSON.parse( storage.getItem(this.name) || '[]' );
                buffer.forEach(function( elt ){ delete( elt.$$hashKey ); });

                this.list = buffer;
                this.initIndexes();

                if( !undeclare ){
                    service_garbage.declare( this.clear.bind(this) );
                }
            };

            //paginator.prototype._order_filter = { created_date:'ASC' };
            //paginator.prototype._column_filter: { created_date:'<'},
            paginator.prototype._default_params = {};
            paginator.prototype._start_filter = 'id';
            paginator.prototype._idx_name = 'id';
            paginator.prototype.page_number = 15;
            paginator.prototype.outdated_timeout = 1000*60*5; // 5mn
            paginator.prototype._emptyOnRefresh = true;

            paginator.prototype.clear = function(){
                storage.removeItem( this.name );
                this.list = [];
                this.indexes = [];
            };

            paginator.prototype.initIndexes = function(){
                this.indexes = [];

                if( this.list.length ){
                    this.list.forEach(function( datum ){
                        this.indexes.push(datum[this._idx_name]);
                    }.bind(this));
                }
            };

            paginator.prototype.isOutDated = function(){
                return this.lastupdate !== undefined ? Date.now() - this.lastupdate > this.outdated_timeout: true;
            };

            paginator.prototype.get = function( forceRefresh ){
                var p = this.loading;
                if( !this.loading ){
                    var deferred = $q.defer();
                    p = deferred.promise;

                    if( !this.list.length ){
                        this.loading = p;

                        api_service.queue( this._method_get, this._buildGetParams() ).then(function(d){
                            var r = this.formatResult(d);
                            this._prependDatas( r );
                            deferred.resolve( r );
                            this.loading = undefined;
                            this.lastupdate = Date.now();
                        }.bind(this), function(){
                            deferred.reject();
                            this.loading = undefined;
                        }.bind(this));

                    }else if( this.isOutDated() || forceRefresh ){
                        this.loading = p;

                        api_service.queue( this._method_get, this._buildRefreshParams() ).then(function(d){
                            var r = this.formatResult(d);
                            this._prependDatas( r );
                            deferred.resolve( r );
                            this.loading = undefined;
                            this.lastupdate = Date.now();
                        }.bind(this), function(){
                            deferred.reject();
                            this.loading = undefined;
                        }.bind(this) );

                    }else{
                        deferred.resolve();
                    }
                }

                return p;
            };

            paginator.prototype.outdate = function(){
                this.lastupdate = 0;
            };

            paginator.prototype.unset = function( id ){
                var idx = this.indexes.indexOf(id);
                if( idx !== -1 ){
                    this.indexes.splice(idx, 1);
                    this.list.splice(idx, 1);
                    this.updateCache();
                }
            };

            paginator.prototype._getStartRefresh = function(){
                return this._start_filter.split('.')
                    .reduce(function( start, key ){ return start[key]; }, this.list[0]);
            };

            paginator.prototype._getStartNext = function(){
                return this._start_filter.split('.')
                    .reduce(function( start, key ){ return start[key]; }, this.list[this.list.length-1]);
            };

            paginator.prototype._buildGetParams = function(){
                return angular.merge({}, this._default_params, {
                    filter:{
                        p: 1,
                        n: this.page_number,
                        o: this._order_filter
                    }
                });
            };

            paginator.prototype._buildNextParams = function(){
                return angular.merge({}, this._default_params, {
                    filter:{
                        s: this.list.length ? this._getStartNext(): undefined,
                        o: this._order_filter,
                        c: this.list.length ? this._column_filter: undefined,
                        n: this.page_number
                    }
                });
            };

            paginator.prototype._buildRefreshParams = function(){
                var key_column_filter = Object.keys(this._column_filter)[0],
                    column_filter = {};

                column_filter[key_column_filter] = this._column_filter[key_column_filter]==='>'?'<':'>';

                return angular.merge({}, this._default_params, {
                    filter:{
                        s: this._getStartRefresh(),
                        o: this._order_filter,
                        c: column_filter
                    }
                });
            };

            paginator.prototype._prependDatas = function( d ){
                var idx, i=d.length-1;

                for(;i>=0;i--){
                    idx = this.indexes.indexOf( d[i][this._idx_name] );

                    if( idx !== -1 ){
                        this.indexes.splice( idx, 1 );
                        this.list.splice( idx, 1 );
                    }

                    this.indexes.unshift( d[i][this._idx_name] );
                    this.list.unshift( d[i] );
                }

                this.updateCache();
            };

            paginator.prototype._appendDatas = function( d ){
                var count = this.list.length, idx, i=0, length=d.length;

                for(;i<length;i++){
                    idx = this.indexes.indexOf( d[i][this._idx_name] );

                    if( idx !== -1 ){
                        this.indexes.splice( idx, 1 );
                        this.list.splice( idx, 1 );
                    }

                    this.indexes.push( d[i][this._idx_name] );
                    this.list.push( d[i] );
                }

                /*Array.prototype.push.apply( this.list, d );
                d.forEach(function(datum){
                    this.indexes.push( datum[this._idx_name] );
                }.bind(this));*/

                if( count < this.cache_size ){
                    this.updateCache();
                }
            };

            paginator.prototype.next = function(){
                if( !this.nexting ){
                    var deferred = $q.defer();
                    this.nexting = deferred.promise;

                    api_service.queue( this._method_get, this._buildNextParams() ).then(function(d){
                        var r = this.formatResult( d );
                        this._appendDatas( r );
                        this.nexting = undefined;
                        deferred.resolve( r );
                    }.bind(this), function(){
                        this.nexting = undefined;
                        deferred.reject();
                    }.bind(this));
                }
                return this.nexting;
            };

            paginator.prototype.updateCache = function(){
                if( this.cache_size ){
                    var cachedDatas = this.list.slice(0, this.cache_size );
                    storage.setItem(this.name, JSON.stringify( cachedDatas ) );
                }
            };

            paginator.prototype.formatResult = function( d ){
                return d;
            };

            return paginator;
        }
    ]);


angular.module('API')
    .factory('abstract_search_service',['api_service','$q','service_garbage','storage',
        function( api_service, $q, service_garbage, storage ){

            function search_service( config ){

                this._list = [];
                this._previous = "";
                this._filter = { n : 10, p : 1 };
                this._count = 0;
                this.max_count = 0;
                this._ended = false;
                Object.assign( this, config );
                service_garbage.declare( this.clear.bind(this) );
            };


            // CLEAR MODEL SERVICE
            search_service.prototype.clear = function(){

                this.list = [];
                this._previous = null;
                this._count = 0;
                this.max_count = 0;
                this.searching = false;
                this._ended = false;

                // ABORT REQUESTS
                if(this._deferred){
                   this._deferred.reject();
                   this._deferred = null;
                }
            };

            function resolvePromise(r){
                if(this._model){
                    this._model.queue(r.list);
                }
                this.list = this._filter.p > 1 ? this.list.concat(r.list) : r.list;
                this.max_count = Math.max(this.max_count, r.count);
                this.count = r.count;
                this._deferred = null;
                this.searching = false;
                this._ended = this.list.length >= this.count;
            }

            // BUILD GET PARAMS
            search_service.prototype.search = function( search, refresh ){
                if(search !== this._previous || refresh){
                    this._filter.p = 0;
                    this._ended = false;
                    if(this._deferred){
                       this._deferred.reject();
                       this._deferred = null;
                    }
                }
                if(!this._deferred && !this._ended){
                    this._filter.p++;
                    if(null !== search){
                        this._previous = search;
                    }
                    else{
                        search = this._previous;
                    }
                    var deferred = $q.defer();
                    this._deferred = deferred;
                    this.searching = true;
                    api_service.queue( this._method_get, this._buildSearchParams(search, this._filter)).then(function( r ){
                        deferred.resolve(r);
                    });
                    deferred.promise
                      .then(resolvePromise.bind(this))
                      .catch(angular.noop);
                }

            };


            // BUILD SEARCH PARAMS
            search_service.prototype._buildSearchParams = function( search, filter ){
                return { search: search, filter : this.filter };
            };



            return search_service;
        }
    ]);

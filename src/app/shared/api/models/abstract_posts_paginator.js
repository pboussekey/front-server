
angular.module('API')
    .factory('abstract_posts_paginator',['abstract_paginator_model','post_model','events_service',
        function( abstract_paginator_model, post_model, events_service ){

            function posts_paginator( config ){
                abstract_paginator_model.call(this, config );
                events_service.on('post.hidden', this.onPostHidden.bind(this) );
            }

            Object.assign( posts_paginator.prototype, abstract_paginator_model.prototype);

            posts_paginator.prototype.checkAndGetDatas = function( post_ids, refresh ){
                var paginator = this,
                    promise = !refresh ? post_model.queue( post_ids ): post_model.get( post_ids, true );

                return promise.then(function(){
                    post_ids.forEach(function( pid ){
                        // DELETE POST ID FROM PAGINATOR IF THEY DON'T EXIST ANYMORE...
                        if( !post_model.list[pid] || !post_model.list[pid].datum ){
                            paginator.unset( pid );
                        }
                    });
                    return post_ids;
                });
            };

            posts_paginator.prototype.get = function ( forceRefresh ){
                return abstract_paginator_model.prototype.get.call( this, forceRefresh ).then(function(d){
                    return this.checkAndGetDatas( this.indexes, forceRefresh )
                        .then(function(){ return d; });
                }.bind(this));
            };

            posts_paginator.prototype.refresh = function(){
                return abstract_paginator_model.prototype.get.call( this, true ).then(function(d){
                    if( d.length ){
                        var idx = this.indexes.indexOf( d[d.length-1].id );
                        if( idx !== -1 ){
                            return this.checkAndGetDatas( this.indexes.slice(0,idx+1), true );
                        }
                    }
                }.bind(this));
            };

            posts_paginator.prototype.next = function(){
                return abstract_paginator_model.prototype.next.call( this ).then(function(d){
                    if( d.length ){
                        var idx = this.indexes.indexOf( d[0].id );
                        if( idx !== -1 ){
                            return this.checkAndGetDatas( this.indexes.slice(idx) );
                        }
                    }
                }.bind(this));
            };

            posts_paginator.prototype.unset = function( id ){
                abstract_paginator_model.prototype.unset.call( this, id );
                this.total--;
            };

            posts_paginator.prototype.formatResult = function ( d ){
                // UPDATE TOTAL POSTS COUNT
                this.total = d.count;
                return d.list;
            };

            posts_paginator.prototype.onPostHidden = function( data ){
                var post_id = 0+data.datas[0];
                this.unset( post_id );
            };

            return posts_paginator;
        }
    ]);

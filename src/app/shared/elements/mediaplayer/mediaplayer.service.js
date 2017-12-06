angular.module('elements').service('mediaplayer_service', [
    'events_service','filters_functions',
    function( events_service, filters_functions ){
        
        
        
        var service = {
            
            reference: undefined,
            muted: undefined,
            
            sources:[],
            captions:[],
            
            play: function( media ){
                if( media && media.sources && media.sources.length ){
                    
                    if( !service.sources.length && service.sources.length != media.sources.length || 
                        media.sources         )
                    
                    
                    
                    service.load( media );
                }
                
                service.reference.play();
                service.playing = true;
            },
            pause: function(){
                service.playing = false;
                service.reference.pause();
                events_service.process('media.paused');
            },
            mute: function(){
                service.muted = service.reference.muted = true;                
                events_service.process('media.muted');
            },
            unmute: function(){
                service.muted = service.reference.muted = false;
                events_service.process('media.unmuted');
            },
            
            seek: function( percent ){
                if( service.reference.duration ){
                    service.reference.currentTime = service.reference.duration * percent / 100;
                }
            },
            
            setVolume: function( percent ){
                    service.unmute();
                    
                    service.reference.volume = percent / 100;     
                    
                    if( !service.animationRequested ){
                        service.volumeAnimationRequested = true;
                        
                        window.requestAnimationFrame(function(){
                            events_service.process('media.volumeChanged', percent/100 );
                            service.volumeAnimationRequested = false;
                        });                        
                    }            
            },
            
            listen: function(){                
                service.reference.addEventListener('pause', function(){
                    if( service.playing ){
                        service.pause();
                    }
                });
                
                service.reference.addEventListener('ended', function(){
                    service.pause();
                });
                
                service.reference.addEventListener('timeupdate', function(){
                    if( !service.progressAnimationRequested && service.reference.duration ){
                        service.progressAnimationRequested = true;
                            
                        window.requestAnimationFrame(function(){
                            var time = getTimer(),
                                percent = (Math.round( 1000 * service.reference.currentTime / service.reference.duration )/ 10);

                            events_service.process('media.progress', percent, time );
                        });
                    } 
                });
            }
            
        };
        
        
        function getTimer(){
            return filters_functions.formatMediaTime( service.reference.currentTime||0 )
                +' / '+filters_functions.formatMediaTime( service.reference.duration );
        }
        
        return service;        
    }]
);
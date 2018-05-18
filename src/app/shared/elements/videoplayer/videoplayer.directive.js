angular.module('elements').directive('videoplayer', ['filters_functions','fs_api',
    function( filters_functions, fs_api ){
        return {
            scope:{
                doc: '=?doc',
                sources: '=?sources',
                captions: '=?captions',
                options: '=?opt',
                title: '=?name',
                ratio: '=?ratio',
                autoplay : '='
            },
            resrict:'E',
            templateUrl:'app/shared/elements/videoplayer/videoplayer.html',
            link: function( scope, element ) {
                if( scope.doc ){
                    var media = filters_functions.formatDocToMedia( scope.doc );
                    
                    scope.sources = media.sources;
                    scope.captions = media.captions;
                    scope.title = media.title;
                }
                
                scope.options = scope.options||{};
                scope.fullScreenAvailable = fs_api.is_available;
                
                var video,        
                    container = element[0].querySelector('.videoplayer'),            
                    progressBar = element[0].querySelector('.vp-progress'),
                    percentBar = element[0].querySelector('.vp-progression'), 
                    animationRequested = false, soundRequested = false,
                    timer = element[0].querySelector('.vp-timer'),
                    soundBar = element[0].querySelector('.vp-soundbar'),
                    soundLvl = element[0].querySelector('.vp-soundlvl');
            
                if( scope.fullScreenAvailable ){
                    container.addEventListener( fs_api.fullscreenchange, onFullScreenChange );
                }

                // BUILD AUDIO ELEMENT.
                initVideo();
                
                // BUILD PLAYER UI
                scope.playerid = scope.options.id || 'vp-id-'+Date.now()+(Math.random()+'').replace('.','');
                timer.innerText = getTimer();
                
                // DISPLAY RATIO
                scope.getRatioPercent = function(){
                    return (scope.ratio? 100/scope.ratio : 56.25)+'%';
                };
                
                // ACTIONS.                
                scope.togglePlay = function(){
                    scope.playing ? pause() : play();
                };
                
                scope.toggleSound = function(){
                    scope.muted ? unmute(): mute();
                };

                scope.toggleFullScreen = function(){
                    scope.fullscreen ? reduce(): enlarge();
                }
                
                scope.setVolume = function( level ){
                    unmute();
                    
                    scope.level = level;
                    video.volume = level / 100;
                };
                                
                scope.turnOffCaptions = function(){
                    disableCaptions();
                    
                    scope.hasActiveCaptions = false;
                    scope.transcriptOn = false;
                };
                
                scope.setCaptions = function( index ){
                    if( video.textTracks[index] ){
                        // TURN OFF ALL CAPTIONS
                        disableCaptions();
                        
                        // ENABLE SELECTED TRACK
                        var track = video.textTracks[index];
                        track.mode = "showing";                        
                        track.addEventListener('cuechange', onCueChange );
                        scope.hasActiveCaptions = true;
                        scope.cues = track.cues;
                    }
                };
                
                scope.toggleTranscript = function(){
                    scope.transcriptOn = !scope.transcriptOn;
                };
                
                scope.toggleCaptions = function(){
                    if( scope.hasActiveCaptions ){
                        scope.turnOffCaptions();
                        scope.transcriptOn = false;
                    }else{
                        scope.setCaptions(0);
                    }
                };
                
                scope.isActiveCue = function( cue ){
                    if( scope.activeCues && scope.activeCues.length ){
                        return Array.prototype.some.call( scope.activeCues, function( ac ){
                            return ac === cue;
                        });
                    }
                };
                
                function disableCaptions(){
                    if( video.textTracks.length ){
                        Array.prototype.forEach.call(video.textTracks, function(textTrack){
                            textTrack.mode = 'disabled';
                            textTrack.removeEventListener('cuechange', onCueChange );
                        });
                    }
                }
                
                function onCueChange( e ){
                    scope.activeCues = e.target.activeCues;
                    scope.$evalAsync();
                }
                
                function initVideo(){
                    var oldVideo = element[0].querySelector('video');
                    
                    if( oldVideo ){
                        element[0].removeChild( oldVideo );
                    }
                    
                    video = document.createElement('video');
                    video.preload = scope.options.preload || 'none';
                    video.crossOrigin="anonymous";                    

                    if( scope.sources && scope.sources.length ){            
                        scope.sources.forEach(addSource);
                    }

                    if( scope.captions && scope.captions.length ){
                        scope.captions.forEach(addCaption);
                    }
                    
                    element[0].querySelector('.vp-container').appendChild( video );
                    
                    listen();
                }                
                
                function addCaption( caption, index ){
                    var textTrack = document.createElement('track');
                    
                    textTrack.setAttribute('src', caption.url);
                    textTrack.setAttribute('kind', caption.kind || 'subtitles');
                    textTrack.setAttribute('srclang', caption.lang || 'en');
                    textTrack.setAttribute('label', caption.label || ('Captions '+index) );
                    
                    if( caption.enabled ){
                        textTrack.setAttribute('default', true);
                    }

                    video.appendChild(textTrack);
                    
                    if( caption.enabled ){
                        scope.setCaptions(index);
                    }
                }
                
                function addSource( src ){
                    var source = document.createElement('source');
                    source.setAttribute('src', src.url);

                    if( src.type ){
                        source.setAttribute('type',src.type);
                    }

                    video.appendChild(source);
                }
                
                function mute(){
                    scope.muted = video.muted = true;
                    
                    soundLvl.style.width = '0%';                        
                    soundBar.setAttribute('aria-valuenow','0' );
                    soundBar.setAttribute('aria-valuetext','0%' );
                }
                
                function unmute(){
                    scope.muted = video.muted = false;
                    soundLvl.style.width = video.volume*100 +'%';                 
                    soundBar.setAttribute('aria-valuenow',Math.round(video.volume*100) );
                    soundBar.setAttribute('aria-valuetext',Math.round(video.volume*100)+'%' );
                }
                
                function pause(){
                    scope.playing = false;
                    video.pause();
                }
                
                function play(){
                    // PAUSE OTHERS MEDIAS.
                    var medias = document.querySelectorAll('audio, video'),
                        i = 0, length = medias.length;
                        
                    for(;i<length;i++){
                        if( medias[i] !== video ){
                            medias[i].pause();
                        }
                    }
                    // THEN PLAY
                    scope.playing = true;
                    video.play();
                }
                
                function getTimer(){
                    return filters_functions.formatMediaTime( video.currentTime||0 )
                        +' / '+filters_functions.formatMediaTime( video.duration );
                }
                
                function onSeekTouch( evt ){
                    evt.stopPropagation();
                        
                    var rect = progressBar.getBoundingClientRect();                        
                    var x = evt.touches.length ? evt.touches[0].pageX: evt.pageX ;

                    if( x !== undefined ){
                        seek( Math.min(Math.max(0, 100 *( x-rect.left)/rect.width ),100) );
                    }          
                }
                
                function keyBoardSeek( evt ){                    
                    if( evt.keyCode === 38 || evt.keyCode === 39 ){
                        evt.preventDefault();
                        
                        var percent = 100 * video.currentTime / video.duration;
                        seek( Math.min(Math.max(0, percent+1 ),100) );
                        
                    }else if( evt.keyCode === 40 || evt.keyCode === 37 ){
                        evt.preventDefault();
                        
                        var percent = 100 * video.currentTime / video.duration;
                        seek( Math.min(Math.max(0, percent-1 ),100) );
                    }
                }
                
                function startSeekMouse(){                    
                    document.addEventListener('mousemove', onSeekMouse);
                    document.addEventListener('mouseup', stopSeekMouse);
                }
                
                function onSeekMouse( evt ){                    
                    var rect = progressBar.getBoundingClientRect();                        
                    var x = evt.pageX ;

                    if( x !== undefined ){
                        seek( Math.min(Math.max(0, 100 *( x-rect.left)/rect.width ),100) );
                    }
                }
                
                function stopSeekMouse( evt ){
                    document.removeEventListener('mousemove', onSeekMouse);
                    document.removeEventListener('mouseup', stopSeekMouse);
                    
                    onSeekMouse(evt);
                }
                
                function seek( percent ){
                    if( video.duration ){
                        video.currentTime = video.duration * percent / 100;                        
                    }
                }
                
                // SOUND LVL
                function onSoundTouch( evt ){
                    evt.stopPropagation();
                        
                    var rect = soundBar.getBoundingClientRect();                        
                    var x = evt.touches.length ? evt.touches[0].pageX: evt.pageX ;

                    if( x !== undefined ){
                        setVolume( Math.min(Math.max(0, 100 *( x-rect.left)/rect.width ),100) );
                    }          
                }
                
                function keyBoardSound( evt ){                    
                    if( evt.keyCode === 38 || evt.keyCode === 39 ){
                        evt.preventDefault();
                        var percent = 100 * video.volume;
                        setVolume( Math.min(Math.max(0, percent+5 ),100) );                        
                    }else if( evt.keyCode === 40 || evt.keyCode === 37 ){
                        evt.preventDefault();                        
                        var percent = 100 * video.volume;
                        setVolume( Math.min(Math.max(0, percent-5 ),100) );
                    }
                }
                
                function startSoundMouse(){                    
                    document.addEventListener('mousemove', onSoundMouse);
                    document.addEventListener('mouseup', stopSoundMouse);
                }
                
                function onSoundMouse( evt ){                    
                    var rect = soundBar.getBoundingClientRect();                        
                    var x = evt.pageX ;

                    if( x !== undefined ){
                        setVolume( Math.min(Math.max(0, 100 *( x-rect.left)/rect.width ),100) );
                    }
                }
                
                function stopSoundMouse( evt ){
                    document.removeEventListener('mousemove', onSoundMouse);
                    document.removeEventListener('mouseup', stopSoundMouse);                    
                    onSoundMouse(evt);
                }
                
                function setVolume( percent ){
                    unmute();
                    video.volume = percent / 100;                        
     
                    if( !soundRequested ){
                        soundRequested = true;
                        window.requestAnimationFrame(function(){
                            scope.$evalAsync();
                            soundLvl.style.width = video.volume*100 +'%';                        
                            soundBar.setAttribute('aria-valuenow',Math.round(video.volume*100) );
                            soundBar.setAttribute('aria-valuetext',Math.round(video.volume*100)+'%' );
                            soundRequested = false;
                        });
                    }
                }
                
                
                function listen(){
                    // ON PAUSE - MAKE SURE THAT SCOPE IS UPDATED.
                    video.addEventListener('pause', function(){
                        if( scope.playing ){
                            scope.playing = false;                            
                        }
                        scope.$evalAsync();
                    });
                    
                    video.addEventListener('ended',function(){
                        pause();
                    });
                    
                    video.addEventListener('click', function(){
                        scope.togglePlay();
                    });
                    
                    // LATER MAYBE...
                    /*audio.addEventListener('progress', function(){                        
                        if( audio.duration && audio.buffered ){
                            
                        }
                    });*/
                    
                    video.addEventListener('timeupdate', function(){                        
                        if( !animationRequested && video.duration ){
                            animationRequested = true;
                            
                            window.requestAnimationFrame(function(){
                                var time = getTimer(),
                                    percent = (Math.round( 1000 * video.currentTime / video.duration )/ 10);
                                
                                animationRequested = false;        
                                percentBar.style.width = percent + '%';                                
                                progressBar.setAttribute('aria-valuenow',percent );
                                progressBar.setAttribute('aria-valuetext', time );
                                timer.innerText = time;                                
                            });
                        }
                    });
                    
                    progressBar.addEventListener('touchstart', onSeekTouch);
                    progressBar.addEventListener('touchmove', onSeekTouch);
                    progressBar.addEventListener('touchend', onSeekTouch);
                    progressBar.addEventListener('touchcancel', onSeekTouch);
                    
                    progressBar.addEventListener('mousedown', startSeekMouse );
                    progressBar.addEventListener('keydown', keyBoardSeek );
                    
                    
                    soundBar.addEventListener('touchstart', onSoundTouch);
                    soundBar.addEventListener('touchmove', onSoundTouch);
                    soundBar.addEventListener('touchend', onSoundTouch);
                    soundBar.addEventListener('touchcancel', onSoundTouch);
                    
                    soundBar.addEventListener('mousedown', startSoundMouse );
                    soundBar.addEventListener('keydown', keyBoardSound );
                    
                    if(scope.autoplay === true){
                        video.play();
                    }
                }

                function enlarge(){
                    container[fs_api.requestFullscreen]();
                }

                function reduce(){
                    document[fs_api.exitFullscreen]();
                }

                function onFullScreenChange(){
                    scope.fullscreen = !!document[fs_api.fullscreenElement];                       
                    scope.$evalAsync();
                }
                
            }
        };
    }
]);
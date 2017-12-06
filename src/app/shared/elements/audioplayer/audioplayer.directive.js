angular.module('elements').directive('audioplayer', ['filters_functions',
    function( filters_functions ){
        return {
            scope:{
                doc: '=?doc',
                sources: '=?sources',
                captions: '=?captions',
                options: '=?opt',
                title: '=?name'
            },
            resrict:'E',
            templateUrl:'app/shared/elements/audioplayer/audioplayer.html',
            link: function( scope, element ) {
                if( scope.doc ){
                    var media = filters_functions.formatDocToMedia( scope.doc );
                    
                    scope.sources = media.sources;
                    scope.captions = media.captions;
                    scope.title = media.title;
                }
                
                scope.options = scope.options||{};
                
                var audio, 
                    uiBarLength = 5 + Math.random()*90,
                    uiBarDir = Math.round(Math.random()) ? 1: -1, i=0,
                    
                    progressBar = element[0].querySelector('.ap-progress'),
                    percentBar = element[0].querySelector('.ap-background'), 
                    animationRequested = false, soundRequested = false,
                    timer = element[0].querySelector('.ap-timer'),
                    soundBar = element[0].querySelector('.ap-soundbar'),
                    soundLvl = element[0].querySelector('.ap-soundlvl');
            
                // BUILD AUDIO ELEMENT.
                initAudio();
                
                // BUILD PLAYER UI
                scope.playerid = scope.options.id || 'ap-id-'+Date.now()+(Math.random()+'').replace('.','');
                scope.bars = Array( scope.options.uiBarNumber || 200 );
                timer.innerText = getTimer();
                
                for(;i<scope.bars.length;i++){
                    uiBarLength = Math.max( Math.min( uiBarLength + uiBarDir * ( Math.random()*40 - 10), 95), 10);                    
                    uiBarDir = Math.round(Math.random()) ? 1: -1;
                    
                    scope.bars[i] = Math.round(uiBarLength);
                }
                
                scope.getBarStyle = function(){                    
                    uiBarLength = Math.max( Math.min( uiBarLength + uiBarDir * ( Math.random()*40 - 10), 95), 10);                    
                    uiBarDir = Math.round(Math.random()) ? 1: -1;
                    
                    return (uiBarLength+'').slice(0,4)+'%';
                };
                
                // ACTIONS.                
                scope.togglePlay = function(){
                    scope.playing ? pause() : play();
                };
                
                scope.toggleSound = function(){
                    scope.muted ? unmute(): mute();
                };
                
                scope.setVolume = function( level ){
                    unmute();
                    
                    scope.level = level;
                    audio.volume = level / 100;
                };
                                
                scope.turnOffCaptions = function(){
                    disableCaptions();
                    
                    scope.hasActiveCaptions = false;
                    scope.transcriptOn = false;
                };
                
                scope.setCaptions = function( index ){
                    if( audio.textTracks[index] ){
                        // TURN OFF ALL CAPTIONS
                        disableCaptions();
                        
                        // ENABLE SELECTED TRACK
                        var track = audio.textTracks[index];
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
                    if( audio.textTracks.length ){
                        Array.prototype.forEach.call(audio.textTracks, function(textTrack){
                            textTrack.mode = 'disabled';
                            textTrack.removeEventListener('cuechange', onCueChange );
                        });
                    }
                }
                
                function onCueChange( e ){
                    scope.activeCues = e.target.activeCues;
                    scope.$evalAsync();
                }
                
                function initAudio(){
                    var oldAudio = element[0].querySelector('audio');
                    
                    if( oldAudio ){
                        element[0].removeChild( oldAudio );
                    }
                    
                    audio = document.createElement('audio');
                    audio.preload = scope.options.preload || 'none';
                    audio.crossOrigin="anonymous";
                    audio._audioplayer_pause = pause;

                    if( scope.sources && scope.sources.length ){                    
                        scope.sources.forEach(addSource);                    
                    }

                    if( scope.captions && scope.captions.length ){
                        scope.captions.forEach(addCaption);
                    }
                    
                    element[0].appendChild( audio );
                    
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

                    audio.appendChild(textTrack);
                    
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

                    audio.appendChild(source);
                }
                
                function mute(){
                    scope.muted = audio.muted = true;
                    
                    soundLvl.style.width = '0%';                        
                    soundBar.setAttribute('aria-valuenow','0' );
                    soundBar.setAttribute('aria-valuetext','0%' );
                }
                
                function unmute(){
                    scope.muted = audio.muted = false;
                    soundLvl.style.width = audio.volume*100 +'%';                 
                    soundBar.setAttribute('aria-valuenow',Math.round(audio.volume*100) );
                    soundBar.setAttribute('aria-valuetext',Math.round(audio.volume*100)+'%' );
                }
                
                function pause(){
                    scope.playing = false;
                    audio.pause();
                }
                
                function play(){
                    // PAUSE OTHERS MEDIAS.
                    var medias = document.querySelectorAll('audio, video'),
                        i = 0, length = medias.length;
                        
                    for(;i<length;i++){
                        if( medias[i] !== audio ){
                            medias[i].pause();
                        }
                    }
                    // THEN PLAY
                    scope.playing = true;
                    audio.play();
                }
                
                function getTimer(){
                    return filters_functions.formatMediaTime( audio.currentTime||0 )
                        +' / '+filters_functions.formatMediaTime( audio.duration );
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
                        
                        var percent = 100 * audio.currentTime / audio.duration;
                        seek( Math.min(Math.max(0, percent+1 ),100) );
                        
                    }else if( evt.keyCode === 40 || evt.keyCode === 37 ){
                        evt.preventDefault();
                        
                        var percent = 100 * audio.currentTime / audio.duration;
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
                    if( audio.duration ){
                        audio.currentTime = audio.duration * percent / 100;                        
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
                        var percent = 100 * audio.volume;
                        setVolume( Math.min(Math.max(0, percent+5 ),100) );                        
                    }else if( evt.keyCode === 40 || evt.keyCode === 37 ){
                        evt.preventDefault();                        
                        var percent = 100 * audio.volume;
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
                    audio.volume = percent / 100;                        
     
                    if( !soundRequested ){
                        soundRequested = true;
                        window.requestAnimationFrame(function(){
                            scope.$evalAsync();
                            soundLvl.style.width = audio.volume*100 +'%';                        
                            soundBar.setAttribute('aria-valuenow',Math.round(audio.volume*100) );
                            soundBar.setAttribute('aria-valuetext',Math.round(audio.volume*100)+'%' );
                            soundRequested = false;
                        });
                    }
                }
                
                
                function listen(){
                    // ON PAUSE - MAKE SURE THAT SCOPE IS UPDATED.
                    audio.addEventListener('pause', function(){
                        if( scope.playing ){
                            scope.playing = false;
                            scope.$evalAsync();
                        }
                    });
                    
                    audio.addEventListener('ended',function(){
                        pause();
                    });
                    
                    // LATER MAYBE...
                    /*audio.addEventListener('progress', function(){                        
                        if( audio.duration && audio.buffered ){
                            
                        }
                    });*/
                    
                    audio.addEventListener('timeupdate', function(){                        
                        if( !animationRequested && audio.duration ){
                            animationRequested = true;
                            
                            window.requestAnimationFrame(function(){
                                var time = getTimer(),
                                    percent = (Math.round( 1000 * audio.currentTime / audio.duration )/ 10);
                                
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
                    
                }
                
            }
        };
    }
]);
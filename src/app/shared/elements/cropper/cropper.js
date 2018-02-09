angular.module('elements')
    .directive('cropper',['$q', '$parse',function($q,$parse){
        return {
            scope: {
                ratio: '=',
                crop: '=',
                load: '=',
                onload: '=',
                onerror: '=',
                file: '=',
                margin: '=',
                label:'=',
                describedby:'=',
                rotate : '=',
                zoomIn : '=',
                zoomOut : '='
            },
            restrict: 'A',
            link: function( scope, element, attr ){

                // DEFINE VARIABLES
                var el = element[0],
                    bounds = el.querySelector('.bounds'),
                    i = el.querySelector('img'),
                    margin = scope.margin !== undefined ? scope.margin : 20,
                    rect, w, h,
                    bh, bw, bl, bt,
                    bgi, imgRatio,
                    pcx, pcy;

                function build(){
                    rect = el.getBoundingClientRect();
                    w = rect.width;
                    h = rect.height;

                    if( scope.ratio >= 1 ){
                        bw = w - 2*margin;
                        bh = bw / scope.ratio;
                        bl = margin;
                        bt = (h - bh)/2;
                    }else{
                        bh = h - 2*margin;
                        bw = bh * scope.ratio;
                        bt = margin;
                        bl = (w - bw)/2;
                    }

                    // BOUNDS CENTER COORDINATES
                    pcx = bl + bw/2;
                    pcy = bt + bh/2;

                    bounds.style.width = bw + 'px';
                    bounds.style.height = bh + 'px';
                    bounds.style.borderWidth = bt+'px '+bl+'px '+bt+'px '+bl+'px';

                    bgi = {
                        w: undefined,
                        h: undefined,
                        mw: undefined,
                        mh: undefined,
                        l: undefined,
                        t: undefined,
                        ml: bl,
                        mt: bt
                    };

                    if( i.src && i.naturalWidth ){
                        buildImageBounds();
                    }
                }

                function buildImageBounds(){
                    imgRatio = i.naturalWidth / i.naturalHeight;

                    if( imgRatio > scope.ratio ){
                        bgi.h = bgi.mh = bh;
                        bgi.w = bgi.mw = bh * imgRatio;
                        bgi.t = bgi.mt;
                        bgi.l = bl + ( bw - bgi.w )/2;
                    }else{
                        bgi.w = bgi.mw = bw;
                        bgi.h = bgi.mh = bw / imgRatio;
                        bgi.l = bgi.ml;
                        bgi.t = bt + ( bh - bgi.h )/2;
                    }
                    setBGStyle();
                }

                // BUILD
                build();

                // ACCESSIBILITY
                if( scope.label ){
                    el.setAttribute('aria-label', scope.label);
                }
                if( scope.describedby ){
                    el.setAttribute('aria-describedby', scope.describedby );
                }

                // CREATE CANVAS
                var cvs = document.createElement('canvas');

                // LOAD IMAGE
                i.onload = function(){
                    buildImageBounds();

                    if( scope.onload ){
                        scope.onload();
                    }

                    URL.revokeObjectURL(i.src);
                };

                if(scope.onerror){
                    i.onerror = scope.onerror;
                }

                var isMultiTouch = false,
                    startMT = undefined,
                    start = undefined,
                    last = undefined,
                    zoomD = 100;

                var touch_capable = 'ontouchstart' in window;
                    /*|| window.DocumentTouch && document instanceof window.DocumentTouch ||
                    navigator.maxTouchPoints > 0 ||
                    window.navigator.msMaxTouchPoints > 0;*/

                // KEYBOARD MANAGEMENT
                if(!attr.tabindex){
                    el.setAttribute('tabindex','0');
                }

                el.addEventListener('keydown',function(e){
                    var validCodes = [37,38,39,40, 107, 109 ];

                    if( validCodes.indexOf(e.keyCode) !== -1 ){
                        e.preventDefault();
                        var mx=0, my=0;

                        if( e.keyCode === 37 ){
                            // MOVE IMAGE LEFT
                            mx = 20;

                        }else if( e.keyCode === 38 ){
                            // MOVE IMG TOP
                            my = 20;

                        }else if( e.keyCode === 39 ){
                            // MOVE IMG RIGHT
                            mx = -20;

                        }else if( e.keyCode === 40 ){
                            // MOVE IMG BOTTOM
                            my = -20;
                        }else if( e.keyCode === 107 ){
                            // ZOOM IN
                            zoomD+=10;
                            calculateZoom( {distance:100, bgiw: bw}, zoomD );

                        }else if( e.keyCode === 109 ){
                            // ZOOM OUT
                            if( zoomD > 100 ){
                                zoomD-=10;
                            }
                            calculateZoom( {distance:100, bgiw: bw}, zoomD );
                        }

                        calculatePosition( mx, my );
                        setBGStyle();
                    }
                });

                // MOUSE MANAGEMENT
                el.addEventListener('mousedown', handleMouseStart );
                el.addEventListener('wheel',handleWheel);

                function handleMouseStart(e){

                    last = start = [{x:e.screenX, y:e.screenY}];

                    document.body.classList.add('cropper-no-select');
                    document.addEventListener('mousemove', handleMouseMove );
                    document.addEventListener('mouseup', handleMouseUp );
                }

                function handleMouseUp( e){
                    document.removeEventListener('mousemove', handleMouseMove );
                    document.removeEventListener('mouseup', handleMouseUp );
                    document.body.classList.remove('cropper-no-select');

                    start = undefined;
                    last = undefined;
                }

                function handleMouseMove( e ){
                    var touch = [{x:e.screenX, y:e.screenY}];

                    if( last ){
                        var mx, my;

                        mx = touch[0].x - last[0].x;
                        my = touch[0].y - last[0].y;

                        calculatePosition( mx, my );
                    }

                    setBGStyle();
                    last = touch;
                }

                function handleWheel( e ){
                    e.preventDefault();

                    if( e.deltaY < 0 ){
                        zoomD+=10;
                    }else{
                        zoomD-=10;
                    }

                    if( zoomD < 100 ){
                        zoomD = 100;
                    }

                    start = last = [{x:e.screenX, y:e.screenY}];

                    calculateZoom( {distance:100, bgiw: bw}, zoomD );
                    handleMouseMove(e);
                }

                // Bind touch event if they are supported.
                if( touch_capable ){
                    // TOUCH MANAGEMENT
                    el.addEventListener('touchstart', handleStart, false);
                    el.addEventListener('touchmove', handleMove, false);
                    el.addEventListener('touchcancel', clear, false);
                    el.addEventListener('touchend', clear, false);
                    el.addEventListener('touchleave', clear, false);

                    function clear( e ){
                        isMultiTouch = false;
                        startMT = undefined;
                        start = undefined;
                        last = undefined;
                    }

                    function handleStart( e ){
                        start = [{x:e.touches[0].screenX, y:e.touches[0].screenY}];
                        isMultiTouch = false;

                        if( e.touches.length > 1 ){
                            start.push({x:e.touches[1].screenX, y:e.touches[1].screenY});

                            isMultiTouch = true;
                            startMT = {
                                distance: Math.sqrt( Math.pow(start[0].x - start[1].x, 2) + Math.pow(start[0].y - start[1].y, 2) ),
                                bgiw: bgi.w,
                                bgih: bgi.h
                            };
                        }
                        last = start;
                    }

                    function handleMove( e ){
                        var touch = [{x:e.touches[0].screenX, y:e.touches[0].screenY}];

                        if( e.touches.length > 1 ){
                            touch.push({x:e.touches[1].screenX, y:e.touches[1].screenY});

                            if( isMultiTouch ){
                                var distance = Math.sqrt( Math.pow(touch[0].x - touch[1].x, 2) + Math.pow(touch[0].y - touch[1].y, 2) );
                                calculateZoom( startMT, distance );
                            }else if( !isMultiTouch ){
                                startMT = {
                                    distance: Math.sqrt( Math.pow(touch[0].x - touch[1].x, 2) + Math.pow(touch[0].y - touch[1].y, 2) ),
                                    bgiw: bgi.w,
                                    bgih: bgi.h
                                };
                            }

                            isMultiTouch = true;
                        }else{
                            isMultiTouch = false;
                            startMT = undefined;
                        }

                        if( last ){
                            var mx, my;

                            mx = touch[0].x - last[0].x;
                            my = touch[0].y - last[0].y;

                            if( last.length > 1 && touch.length > 1 ){
                                mx = mx/2 + (touch[1].x - last[1].x)/2;
                                my = my/2 + (touch[1].y - last[1].y)/2;
                            }
                            calculatePosition( mx, my );
                        }

                        setBGStyle();
                        last = touch;
                    }
                }

                // BACKGROUND STYLE FUNCTIONS
                function setBGStyle(){
                    i.style.left = bgi.l+'px';
                    i.style.top = bgi.t+'px';
                    i.style.width = bgi.w+'px';
                    i.style.height = bgi.h+'px';
                }

                function calculateZoom( start, current ){
                    var percent = current / start.distance,
                        fw = start.bgiw * percent,
                        fh = fw / imgRatio;

                    var fx = pcx - ( pcx - bgi.l )*( fw/bgi.w),
                        fy = pcy - ( pcy -bgi.t )*( fw/bgi.w);

                    if( fw >= bgi.mw && fh >= bgi.mh ){
                        bgi.h = fh;
                        bgi.w = fw;
                        setPosition( fx, fy);
                    }else{
                        bgi.h = bgi.mh;
                        bgi.w = bgi.mw;
                    }
                }

                function calculatePosition( mx, my ){
                    var fx = bgi.l + mx,
                        fy = bgi.t + my;

                    setPosition( fx, fy);
                }

                function setPosition( fx, fy ){
                    if( fx > bgi.ml ){
                        fx = bgi.ml;
                    }else if( fx + bgi.w < bl+bw ){
                        fx = bl+bw - bgi.w;
                    }

                    if( fy > bgi.mt ){
                        fy = bgi.mt;
                    }else if( fy + bgi.h < bt+bh ){
                        fy = bt+bh - bgi.h;
                    }

                    bgi.l = fx;
                    bgi.t = fy;
                }

                // ROTATE IMAGE
                function rotateImage( degree ){
                    var canvas = document.createElement('canvas'),
                        context = canvas.getContext('2d');

                    if( degree%180 ){
                        canvas.width = i.naturalHeight;
                        canvas.height = i.naturalWidth;
                    }else{
                        canvas.height = i.naturalHeight;
                        canvas.width = i.naturalWidth;
                    }

                    context.translate( canvas.width/2, canvas.height/2);
                    context.rotate( degree * Math.PI/180 );

                    context.drawImage( i, -i.naturalWidth/2, -i.naturalHeight/2);

                    canvas.toBlob(function(blob){
                        i.src = URL.createObjectURL(blob);
                    });
                }

                // FUNCTION CROP
                function crop(){
                    var deferred = $q.defer();

                    if( i.src ){
                        var ctx = cvs.getContext('2d'),
                            r = i.naturalWidth / bgi.w,
                            vx = Math.round( ( bl - bgi.l )*r ),
                            vy = Math.round( ( bt - bgi.t )*r ),
                            vw = Math.min( Math.round( bw*r ), i.naturalWidth-vx ),
                            vh = Math.min( Math.round( bw*r/scope.ratio ), i.naturalHeight-vy );

                        var fw = vw, fh = vh;
                        if( vw <= vh && vh > 1080 ){
                            fh = 1080;
                            fw = Math.round( vw * fh / vh );
                        }else if( vw >= vh && vw > 1080 ){
                            fw = 1080;
                            fh = Math.round( vh * fw / vw );
                        }

                        cvs.width = fw;
                        cvs.height = fh;

                        ctx.drawImage( i, vx, vy, vw, vh, 0, 0, fw, fh);

                        cvs.toBlob( function(blob){
                            deferred.resolve( blob );
                        });
                    }else{
                        deferred.reject();
                    }
                    return deferred.promise;
                }

                // SET SCOPE CROP FUNCTION
                scope.crop = crop;
                scope.load = function( imgSrc, crossorigin, rebuild ){
                    console.log("CROPPER LOADING", imgSrc);
                    if( rebuild ){
                        build();
                    }
                    if( crossorigin ){
                        i.crossOrigin = crossorigin;
                    }else{
                        delete( i.crossOrigin );
                    }
                    if(imgSrc){
                        i.src = imgSrc;
                        //rotateImage(0);
                    }
                    else{
                        delete(i.src);
                    }
                };

                if($parse(attr.rotate).assign){
                    scope.rotate = function(){
                        rotateImage( 90 );
                        zoomD = 100;
                    };
                }
                if($parse(attr.zoomIn).assign){
                    scope.zoomIn = function(){
                        zoomD += 10;
                        calculateZoom( {distance:100, bgiw: bw}, zoomD );
                        calculatePosition( 0, 0 );
                        setBGStyle();
                    };
                }
                if($parse(attr.zoomOut).assign){
                    scope.zoomOut = function(){
                        zoomD -= 10;
                        if( zoomD < 100 ){
                            zoomD = 100;
                        }
                        calculateZoom( {distance:100, bgiw: bw}, zoomD );
                        calculatePosition( 0, 0 );
                        setBGStyle();
                    };
                }

                window.addEventListener("resize", build);

                scope.$on('$destroy', function(){
                    window.removeEventListener('resize', build);
                });
            },
            template:'<img><div class="bounds"></div>'
        };
    }]);

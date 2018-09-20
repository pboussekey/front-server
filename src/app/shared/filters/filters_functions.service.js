angular.module('filters')
    .factory('filters_functions',['$filter', 'session', 'user_model', '$state',
        function( $filter, session, user_model, $state){
            var s = 1000, m = s*60, h = m*60, D=h*24, M = h*24*30, Y = h*24*365, functions;

            functions = {
                usertag: function(user, you, reverse) {
                    if( user ){
                        return (user.firstname + user.lastname).toLowerCase();
                    }
                },
                username: function(user, you, reverse) {
                    if( user ){
                       return you && session.id === user.id ? 'You' : ((user.firstname && (reverse ? (user.lastname+' '+user.firstname) : (user.firstname+' '+user.lastname))) || user.email);

                    }
                },
                usernameshort: function(user, you) {
                    if( user ){
                        return you && session.id === user.id ? 'You' : (user.firstname ?(user.firstname.slice(0,1)+'. '+user.lastname) : user.email);
                    }
                },
                userletter: function(user) {
                    if( user && !user.avatar ){
                        return ( (user.firstname&&(user.firstname+' '+user.lastname)) || user.email )[0].toUpperCase();
                    }
                },
                userinitial: function(user) {
                    var names = [];
                    if(!user){
                        return "";
                    }
                    else{
                        if( user.firstname ){
                            names.push(user.firstname);
                        }
                        if( user.lastname ){
                            names.push( user.lastname );
                        }
                        if( user.email ){
                            names.push( user.email );
                        }
                    }
                    return (names[0][0] + (names.length > 1 ? names[1][0] : ".")).toUpperCase();
                },
                graduation : function(user){
                    if(user.graduation_year ){
                        return  "'" + user.graduation_year.toString().slice(2);
                    }
                },
                pageletter: function(page) {
                    return page ?  page.title[0].toUpperCase() : "";
                },
                sinceVerbose: function(date){
                    if( date ){
                        var diff = Date.now() - (new Date(date)).getTime(), n;

                        if( diff > Y ){
                            n = Math.floor( diff/Y );
                            return n + 'year' + (n>1?'s':'')+' ago';
                        }
                        else if( diff > M ){
                            console.log("since", diff, M, diff/M, Math.floor(diff/M));
                            n = Math.floor(diff/M);
                            return n +' month' + (n>1?'s':'')+' ago';
                        }
                        else if( diff > D ){
                            n = Math.floor(diff/D);
                            return Math.floor(diff/D) +' day'+ (n>1?'s':'')+' ago';
                        }
                        else if( diff > h ){
                            n = Math.floor(diff/h);
                            return Math.floor(diff/h) +' hour'+ (n>1?'s':'')+' ago';
                        }
                        else if( diff > m ){
                            n = Math.floor(diff/m);
                            return Math.floor(diff/m) +' minute'+ (n>1?'s':'')+' ago';
                        }
                        else if( diff > s ){
                            n = Math.floor(diff/s);
                            return Math.floor(diff/s) +' second'+ (n>1?'s':'')+' ago';
                        }else{
                            return 'now';
                        }
                    }
                    return undefined;
                },
                since: function(date, ago) {
                    var r = undefined;
                    var d = new Date(date);
                    var n  = new Date();
                    if( date ){
                        var diff = Date.now() - d.getTime();
                        if( diff > M ){
                            if(n.getYear() === d.getYear()){
                                return $filter('date')(date, 'MMM dd');
                            }
                            else{
                                return $filter('date')(date, 'MMM yyyy');
                            }
                        }
                        else if( diff > D ){
                            r =Math.floor(diff/D) +' d';
                        }
                        else if( diff > h ){
                            r =Math.floor(diff/h) +' h';
                        }
                        else if( diff > m ){
                            r = Math.floor(diff/m) +' mn';
                        }
                        else if( diff > s){
                            r =Math.floor(diff/s) +' s';
                        }else{
                            r ='now';
                        }
                        if(ago && r !== 'now'){
                            r += ' ago';
                        }
                    }
                    return r;
                },
                timerSince: function(date) {
                    if( date ){
                        var diff = Date.now() - (new Date(date)).getTime();
                        var hours = Math.floor(diff / h);
                        var minutes = Math.floor(diff/m) % 60;
                        var seconds = Math.floor(diff/s) % 60;

                        return (hours  ? hours + ":" : "") + (minutes ? ("0" + minutes + ":").slice(-3) : "00:") + (seconds ? ("0" + seconds).slice(-2) : "00")
                    }
                    return undefined;
                },
                year: function( date ){
                    return date? $filter('date')(date, 'yyyy'): undefined;
                },
                month: function( date ){
                    return date? $filter('date')(date, 'MMM'): undefined;
                },
                day: function( date ){
                    return date? $filter('date')(date, 'dd'): undefined;
                },
                hour: function( date ){
                    return date? $filter('date')(date, 'hh:mm'): undefined;
                },
                dateWithHour: function( date ){
                    return date? $filter('date')(date, CONFIG.date_format): undefined;
                },
                dateWithoutHour: function( date ){
                    if( !(date instanceof Date) && date ){
                        date = new Date(date);
                    }
                    return date? $filter('date')(date, 'MM-dd-yyyy'): undefined;
                },
                textDate: function( date ){
                    if( !(date instanceof Date) && date ){
                        date = new Date(date);
                    }
                    return date? $filter('date')(date, 'mediumDate'): undefined;
                },
                dateWithoutDay: function( date ){
                    return date? $filter('date')(date, 'MM-yyyy'): undefined;
                },
                dateLabel : function(date){
                    return date ? (date.getFullYear() +'-'+ ('0' + (date.getMonth() + 1)).substr(-2)+'-' + ('0' + date.getDate()).substr(-2)) : undefined;
                },
                extrapole: function(){
                    if( arguments[0] ){
                        var args = Array.prototype.slice.call(arguments, 1),
                            text = arguments[0];

                        args.forEach(function( value, index ){
                            text = text.replace( new RegExp('#'+(index+1),'g'), value );
                        });

                        return text;
                    }
                },
                dmsLink: function(token, size, ext) {
                    if( token ){
                        var resize = '';
                        if( size && size.length ){
                            resize = '-'+ parseInt( window.devicePixelRatio * size[0] )
                                + (size[1]||'') + parseInt( size[2]? window.devicePixelRatio * size[2]:'' );
                        }
                        return token.indexOf('img/')!==-1?token:window.location.protocol + CONFIG.dms.base_url+CONFIG.dms.paths.datas+'/'+token+resize+(ext||'');
                    }
                    return undefined;
                },
                dmsBgUrl: function(token, size, ext) {
                    if( token ){
                        if( token.indexOf('http')!==-1 || token.indexOf('img/')!==-1 || token.indexOf('blob:')!==-1 ){
                            return {'background-image':'url("'+token+'")'};
                        }

                        var resize = '';
                        if( size && size.length ){
                            /*if( sizes[size[0]] ){
                                size[0] = sizes[size[0]]();
                            }
                            if( sizes[size[2]] ){
                                size[2] = sizes[size[2]]();
                            }*/

                            resize = '-'+parseInt( window.devicePixelRatio * size[0] )
                                + (size[1]||'') + parseInt( size[2]? window.devicePixelRatio * size[2]:'' );
                        }
                        return {'background-image':'url("'+ CONFIG.dms.base_url+CONFIG.dms.paths.datas+'/'+token+resize+(ext||'')+'")'};
                    }
                    return undefined;
                },
                limit: function( txt, length ){
                    length = length || 50;
                    return txt ? txt.substring(0, length) + (txt.length > length ? "..." : "") : "";
                },
                mediasources: function( doc ){
                    return [{url: functions.dmsLink(doc.token) }];
                },
                formatDocToMedia: function( doc ){

                    var media = {
                        sources: [{url: functions.dmsLink(doc.token)}],
                        /*captions: [
                            {
                                url:functions.dmsLink('27cc0248b6583f4783caaeece5e20076bd3b854c'),
                                kind: 'subtitles',
                                srclang: 'en',
                                label: 'Test text track',
                                default: true
                            },
                            {
                                url:functions.dmsLink('27cc0248b6583f4783caaeece5e20076bd3b854c'),
                                kind: 'subtitles',
                                srclang: 'fr',
                                label: 'French text track',
                                default: false
                            }
                        ],*/
                        title: doc.name
                    };

                    return media;
                },
                formatMediaTime: function( seconds ){
                    if( !Number.isNaN(parseInt(seconds)) ){
                        var hs = 60*60, hours, minutes;
                        seconds = Math.floor(seconds);

                        hours = Math.floor( seconds / hs );
                        seconds = seconds - hours*hs;
                        minutes = Math.floor( seconds / 60 );
                        seconds = seconds - minutes*60;

                        return (hours? ('00'+hours).slice(-2)+':':'')+('00'+minutes).slice(-2)+':'+('00'+seconds).slice(-2);
                    }else{
                        return ' - ';
                    }
                },
                address: function( address ){
                    if(!address){
                        return "";
                    }
                    if(address.full_address){
                        return address.full_address;
                    }

                    var ar_address_start = [
                        address.street_no,
                        address.street_type,
                        address.street_name
                    ]
                    var ar_address_end = [
                        address.city && address.city.name ? address.city.name : null,
                        address.division && address.division.name ? address.division.name : null,
                        address.country && address.country.short_name ? address.country.short_name : null,

                    ];

                    return (ar_address_start.filter(function(elem){
                        return !!elem;
                    }).join(" ") + ' ' + ar_address_end.filter(function(elem){
                        return !!elem;
                    }).join(", ")).trim();
                },
                stripTags: function( text ){
                    return text ? text.replace(/(<([^>]+)>)/ig,'') : "";
                },
                plural: function(haystack, count, needle ){
                    return haystack ? haystack.replace((needle || "%s%"), count === true || count > 1 ? "s" : "") : "";
                },
                titlecase: function(text ){
                    return text ? text.slice(0,1).toUpperCase() + text.slice(1) : "";
                },
                usermention : function(text){
                    var buffer = text;
                    var mentionregex = new RegExp(/@{user:(\d+)}/gm);
                    var mentions = {};
                    var mention = mentionregex.exec(buffer);
                    while(mention){
                        mentions[mention[1]] = mention[0];
                        mention = mentionregex.exec(text);
                    }
                    if(Object.keys(mentions).length){
                        Object.keys(mentions).forEach(function(id){
                            if(user_model.list[id].datum){
                                var mentionregex = new RegExp(mentions[id],'g');
                                var link = $state.href("lms.profile", { id : id});
                                buffer = buffer.replace(mentionregex, '<a target="_blank" href="' + link + '" class="mention">@' + functions.usertag(user_model.list[id].datum)+'</a>');
                            }
                        });
                    }
                    return buffer;
                }
            };
            return functions;
        }
    ]);

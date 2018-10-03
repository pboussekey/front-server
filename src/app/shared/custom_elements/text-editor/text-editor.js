angular.module('customElements')
    .directive('textEditor',['$parse', 'upload_service', 'filters_functions', 'websocket', 'session','user_model',
        function($parse, upload_service, filters_functions, websocket, session, user_model ){



            return {
                scope: {
                    model : '=textEditor',
                    gethtml : '=',
                    gettext : '=',
                    options : "=",
                    sethtml : '=',
                    onchange: '=?',
                    inserthtml: '=?',
                    inserttext: '=?',
                    deletetext: '=?',
                    ontextpaste: '=?',
                    whitelist: '=?',
                    room: '=?',
                    toolbar: '=?',
                    mentions : "=",
                    placeholder : "@",
                    focus : "=?",
                    clear : "=?",
                    bindings : "=?"
                },
                transclude : true,
                template : '<div class="text-editor"></div><input type="file" accept="image/*" class="for_screen_reader" fileselect="uploadImage">',
                restrict: 'A',
                link: function( scope, element, attr ){


                    scope.whitelist = ["MENTION"];

                    function cleanMatcher(node, delta){
                        if(scope.whitelist && scope.whitelist.some(function(tag){  return tag === node.tagName; })){
                            return delta;
                        }
                        var plaintext = node.textContent;
                        delta.ops = [{ insert : plaintext }];

                        if( node.tagName === 'A' ){
                            delta.ops[0].attributes = {
                                link: node.getAttribute('href')
                            };
                        }

                        return delta;
                    }

                    scope.uploadImage = function(files){
                        var upl = upload_service.upload('token',files[0]);
                        upl.promise.then(function(r){
                           editor.insertEmbed(editor.getSelection(), 'image', filters_functions.dmsLink(r.token), Quill.sources.USER);
                        });
                    };
                    if(!scope.toolbar && scope.toolbar !== false){
                        scope.toolbar = {
                            container : scope.options || ['bold', 'italic', 'underline', 'link', { 'list': 'bullet' }],
                            handlers: {
                                'image' : function(){
                                    element[0].querySelector('input[type="file"]').click();
                                }
                            }
                        };
                    }
                    var options = {
                        //debug: 'info',
                        modules: {
                            toolbar: scope.toolbar,
                            clipboard:{
                                matchVisual: false
                            },

                        },
                        placeholder : scope.placeholder,
                        theme: 'snow'
                    };
                    if(scope.mentions){
                        options.modules.twicmention = scope.mentions;
                    }
                    if(scope.bindings){
                        options.modules.keyboard = {
                            bindings : scope.bindings
                        };
                    }
                    var editor = new Quill(element[0].querySelector(".text-editor"), options);

                    // --- INIT EDITOR ---
                    // ADD DESTROY HANDLER
                    scope.$on('$destroy', function(){ editor.off('text-change', onchange ); });

                    function onchange(delta, old, source){
                        if( scope.onchange ){
                            scope.onchange(delta, old, source);
                        }
                    }
                    // ADD CHANGE LISTENER
                    editor.on('text-change', onchange );

                    // DEFINE METHOD 'GET' IN SCOPE.
                    if($parse(attr.gethtml).assign){
                        scope.gethtml = function(){ return element[0].querySelector(".ql-editor").innerHTML; };
                    }
                    if($parse(attr.gettext).assign){
                        scope.gettext = editor.getText.bind(editor);
                    }
                    if($parse(attr.inserthtml).assign){
                        scope.inserthtml = editor.clipboard.dangerouslyPasteHTML.bind(editor.clipboard);
                    }
                    if($parse(attr.deletetext).assign){
                        scope.deletetext = editor.deleteText.bind(editor);
                    }

                    // IF IT'S A COLLABORATIVE EDITOR
                    /*if( scope.room ){
                        websocket.get().then(function(socket){
                            Y({
                                db: {
                                    name: 'memory'
                                },
                                connector: {
                                    name: 'twic',//'twic',
                                    room: scope.room,
                                    socket: socket
                                },
                                share: {
                                    richtext: 'Richtext'
                                }
                            }).then(function( yInstance ){
                                console.log('yjsInstance', yInstance );

                                yInstance.share.richtext.bindQuill( editor );
                                var pairs = [], colors = ['#468499', '#dd5757','#7fb3fa','#142842','#33cccc','#3d1d49','#a25016'], lastSelection;

                                // SET MODEL IN EDITOR IF USER IS ALONE.
                                if( !Object.keys(yInstance.connector.connections).length && scope.model ){
                                    editor.clipboard.dangerouslyPasteHTML(scope.model, 'user');
                                }

                                // ADD CLIPBOARD MATCHER
                                editor.clipboard.addMatcher(Node.ELEMENT_NODE, cleanMatcher);

                                //--- CURSOR MANAGEMENT ---//
                                // SELECTION EVENT HANDLER
                                function onSelectionReceived( data ){
                                    if( !pairs[data.user_id] ){
                                        pairs[data.user_id] = colors.splice(0,1)[0];
                                        colors.push( pairs[data.user_id] );
                                    }

                                    editor.getModule('cursors').setCursor( data.id, data.range, data.user_name, pairs[data.user_id] );
                                }

                                function onPeerDiscover( data ){
                                    socket.emit('yjs_selection', {
                                        room: scope.room,
                                        user_id: session.id,
                                        user_name: filters_functions.username( user_model.list[session.id].datum ),
                                        range: lastSelection,
                                        to: data.peer_id
                                    });
                                }

                                function onPeerLeave( data ){
                                    editor.getModule('cursors').removeCursor( data.peer_id );
                                }

                                // ON SELECTION -> BROADCAST YOUR SELECTION INFOS.
                                editor.on('selection-change', function(range, oldRange, source) {
                                    if (range){
                                        lastSelection = range;
                                        socket.emit('yjs_selection', {
                                            room: scope.room,
                                            user_id: session.id,
                                            user_name: filters_functions.username( user_model.list[session.id].datum ),
                                            range: range
                                        });
                                    }
                                });
                                // LISTEN EVENTS
                                socket.on('yjs_'+scope.room+'_selection', onSelectionReceived );
                                socket.on('yjs_'+scope.room+'_newpeer', onPeerDiscover );
                                socket.on('yjs_'+scope.room+'_oldpeer', onPeerLeave );

                                scope.$on('$destroy', function(){
                                    // UNBIND SELECTION EVENTS
                                    socket.off('yjs_'+scope.room+'_selection', onSelectionReceived );
                                    socket.off('yjs_'+scope.room+'_newpeer', onPeerDiscover );
                                    socket.off('yjs_'+scope.room+'_oldpeer', onPeerLeave );

                                    yInstance.disconnect();
                                    return yInstance.destroy();
                                        //.then(
                                        //    function(){ console.log('yInstance destroyed');},
                                        //    function(){ console.log('yInstance not destroyed', arguments); });
                                });

                            }, function(){
                                // ERROR ON YJS INSTANCE CREATION
                            });
                        });
                    }else{*/
                        if(scope.model){
                            editor.clipboard.dangerouslyPasteHTML(scope.model, 'silent');
                            var buffer = editor.getText();
                            var mentionregex = new RegExp(/@{user:(\d+)}/gm);
                            var mentions = {};
                            var mention = mentionregex.exec(buffer);
                            while(mention){
                                mentions[mention[1]] = mention[0];
                                mention = mentionregex.exec(buffer);
                            }
                            var offset = 0;
                            if(Object.keys(mentions).length){
                                user_model.queue(Object.keys(mentions)).then(function(){
                                    Object.keys(mentions).forEach(function(id){
                                        var index = buffer.indexOf(mentions[id]);
                                        console.log(buffer, "/", mentions[id], "/", index);
                                        while(index !== -1){
                                            var mentionregex = new RegExp(mentions[id],'g');
                                            editor.deleteText(index + offset, mentions[id].length);
                                            buffer = buffer.replace(mentions[id],  Array(mentions[id].length + 1).join("_"));
                                            var mention = {
                                                'id' : mentions[id],
                                                'label' : "@" + filters_functions.usertag(user_model.list[id].datum)
                                            };
                                            var delta = (index + offset) ? [{ retain : index + offset }] : [];
                                            delta.push(
                                                {
                                                    insert : mentions[id],
                                                    attributes : {
                                                        mention : mention
                                                    }
                                                },
                                                {
                                                    insert : " "
                                                }
                                            );
                                            editor.updateContents(delta);
                                            index = buffer.indexOf(mentions[id]);
                                            offset++;
                                        }
                                    });
                                });
                            }
                        }

                        // ADD CHANGE LISTENER
                        editor.on('text-change', onchange );
                        if(scope.ontextpaste){
                            editor.clipboard.addMatcher(Node.TEXT_NODE, scope.ontextpaste);
                        }

                        // ADD CLIPBOARD MATCHER
                        editor.clipboard.addMatcher(Node.ELEMENT_NODE, cleanMatcher);

                        if($parse(attr.sethtml).assign){
                            scope.sethtml = function( html ){
                                var rmd = editor.clipboard.matchers.some(function(matcher, index){
                                    if( matcher[1] === cleanMatcher ){
                                        editor.clipboard.matchers.splice(index,1);
                                        return true;
                                    }
                                });

                                if( html ){
                                    editor.clipboard.dangerouslyPasteHTML(html, 'user');
                                }

                                if( rmd ){
                                    editor.clipboard.addMatcher(Node.ELEMENT_NODE, cleanMatcher);
                                }
                            };
                        }

                        if($parse(attr.focus).assign){
                            scope.focus = function(){
                                editor.focus();
                            };
                        }
                        if($parse(attr.clear).assign){
                            scope.clear = function(){
                                editor.deleteText(0, editor.getText().length);
                            };
                        }
                        if($parse(attr.inserttext).assign){
                            scope.inserttext = function(text, index){
                                if(!Number.isInteger(index)){
                                    var selection = editor.getSelection();
                                    if(selection){
                                        index = selection.index;
                                    }
                                }
                                if(Number.isInteger(index)){
                                    editor.insertText(index, text);
                                }
                            };
                        }

                    //}
                }
            };
        }]);

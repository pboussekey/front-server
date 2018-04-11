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
                    toolbar: '=',
                    test : "="
                },
                transclude : true,
                template : '<div class="text-editor"></div><input type="file" accept="image/*" class="for_screen_reader" fileselect="uploadImage">',
                restrict: 'A',
                link: function( scope, element, attr ){
                    
                    var Delta = Quill.import('delta');
                    const Inline = Quill.import('blots/inline');

                    class MentionBlot extends Inline {
                      static create(data) {  
                        var node = super.create();
                        node.innerText = data.id;
                        if(data.label.indexOf('@') !== 0){
                            data.label = '@' + data.label;
                        }
                        node.dataset.label = data.label;
                        node.dataset.id = data.id;
                        
                        return node;
                      }
                       
                      static value(domNode) {
                        return {
                          id: domNode.dataset.id,
                          label: domNode.dataset.label,
                        };
                      }
                        static formats(node) {
                            return { 
                                id: node.getAttribute('data-id'),
                                label: node.getAttribute('data-label') 
                            };
                        }
                        
                         static update(mutations, context){
                             console.log("UPDATE", mutations, context);
                         }
                    }

                    MentionBlot.blotName = 'mention';
                    MentionBlot.tagName = 'mention';
                    MentionBlot.className = 'mention';

                    Quill.register(MentionBlot);

                    class Mention {
                        constructor(quill, options) {
                          this.quill = quill;
                          this.options = options;
                          this.openAt = null;
                          this.endAt = null;
                          this.at = [];
                          this.container = document.querySelector(options.container);
                          quill.on('text-change', this.onChange.bind(this));
                        }

                        onChange(delta){
                            if(this.openAt === null){
                                if(delta.ops.some(function(change){
                                    return change.insert === '@';
                                })){
                                    var index = delta.ops.map(function(){
                                        return delta.ops[0].retain;
                                    })[0] || 0;
                                    var content = this.quill.getContents().ops[0].insert;
                                    if(content.indexOf(' @', index - 1) === (index -1) || content.indexOf('@', index) === 0){
                                        this.openAt = index ;
                                        this.searchAt(delta);
                                    }
                                }
                            }
                            else  if(delta.ops.some(function(change){
                                    return change.insert === ' ';
                            }) && this.at.length === 1){
                              this.addAt(this.at[0]);
                            }
                            else {
                                this.searchAt(delta);
                            }
                        }
                        
                        searchAt(delta){
                            this.endAt = delta.ops.map(function(){
                                return delta.ops[0].retain;
                            })[0]|| 0;
                            if(this.endAt < this.openAt){
                                this.openAt = null;
                                this.at = []; 
                                return;
                            }
                            var content = this.quill.getContents().ops[0].insert;
                            var search =  this.openAt === this.endAt - 1 ? "" : content.substr(this.openAt + 1, this.endAt - 1);
                            var r = this.options.callback(search);
                            
                            if(r.then){
                                r.then(function(list){
                                    this.renderList(list);
                                }.bind(this));
                            }
                            else{
                                this.renderList(r);
                            }
                        };

                        addAt (mention){
                            this.container.innerHTML = '';
                            this.openAt = null;
                            this.endAt = null;
                            this.at = [];
                            this.quill.updateContents(new Delta()     
                                .retain(Math.max(0,this.openAt - 1))
                                .delete(this.endAt + 1 - this.openAt)               
                            );
                            this.quill.insertEmbed(this.openAt, 'mention', mention, Quill.sources.API);
                        };

                        renderList(list){
                            this.at = list;
                            this.container.innerHTML = '';
                            list.forEach(function(mention){ 
                                var button = document.createElement('button');
                                button.className = 'ql-mention-list-item';
                                button.onclick = function(){ 
                                    this.addAt(mention);
                                }.bind(this);
                                if(mention.image){
                                    var image = new Image();
                                    image.src = mention.image;
                                    button.appendChild(image);
                                }
                                button.innerHTML += mention.text || ('@' + mention.label);
                                this.container.appendChild(button);
                            }.bind(this));

                        } 
                      

                      }

                    Quill.register('modules/twicmention', Mention);
                    
                    
                    scope.whitelist = [Mention];
                    if(scope.whitelist){
                        scope.whitelist.forEach(function(tag){
                            Quill.register(tag, true);
                        });
                    }
                    function cleanMatcher(node, delta){
                        if(scope.whitelist && scope.whitelist.some(function(tag){  return tag.tagName.toUpperCase() === node.tagName; })){
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
                    if(scope.toolbar === undefined){
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
                            cursors:true,
                            toolbar: scope.toolbar,
                            clipboard:{
                                matchVisual: false
                            },
                            twicmention : {
                                container : "#at",
                                callback : scope.test
                            }
                        },
                        theme: 'snow'
                    };
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
                    if($parse(attr.inserttext).assign){
                        scope.inserttext = editor.insertText.bind(editor);
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
                            editor.clipboard.dangerouslyPasteHTML(scope.model, 'user');
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
                        
                  

                        
                    //}
                }
            };
        }]);

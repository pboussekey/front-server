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
                        if(data.id){
                            node.innerText = data.id;
                            node.dataset.id = data.id;
                        }
                        else{
                            node.innerText = "@";
                        }
                        if(data.label){
                            if(data.label.indexOf('@') !== 0){
                                data.label = '@' + data.label;
                            }
                            node.dataset.label = data.label;
                            node.dataset.text = data.text || data.label;
                        }
                        return node;
                      }
                      
                      static value(domNode) {
                        return {
                          id: domNode.dataset.id,
                          label: domNode.dataset.label,
                          text: domNode.dataset.text || domNode.dataset.label
                        };
                      }
                        static formats(node) {
                            return { 
                                id: node.getAttribute('data-id'),
                                label: node.getAttribute('data-label') ,
                                text: node.getAttribute('data-text') || node.getAttribute('data-label') 
                            };
                        }
                        
                    }

                    MentionBlot.blotName = 'mention';
                    MentionBlot.tagName = 'mention';
                    MentionBlot.className = 'editing';

                    Quill.register(MentionBlot);

                    class Mention {
                        constructor(quill, options) {
                          this.quill = quill;
                          this.options = options;
                          this.openAt = null;
                          this.endAt = null;
                          this.at = [];
                          this.mentions = [];
                          this.container = document.querySelector(options.container);
                          quill.on('text-change', this.onChange.bind(this));
                        }
                        
                        

                        onChange(delta, _ , source){
                            console.log("ON CHANGE", source);
                            if(source !== 'user'){
                                return;
                            }
                            var index = delta.ops.map(function(){
                                return delta.ops[0].retain;
                            })[0] || 0;
                            var leaf = this.quill.getLeaf(index);
                            var mention = null;
                            if(leaf[0] && leaf[0].parent && leaf[0].parent.domNode.tagName === 'MENTION'){
                                console.log(leaf[0].parent);
                                mention = leaf[0].parent.domNode;
                            }
                            console.log(mention, index);
                            if(mention && (mention.innerText.indexOf('@') === -1 || delta.ops.some(function(change){
                                    return change.insert === ' ';
                                }))){
                                if(!this.at.length || mention.innerText.indexOf('@') === -1){
                                    console.log('REPLACE MENTION BY TEXT BLOT');
                                    var text = mention.innerText;
                                    mention.innerText = "";
                                    this.quill.insertText(index - text.length + 1,text, Quill.sources.API);
                                    this.container.innerHTML = '';
                                    this.quill.setSelection(index + text.length);
                                }
                                else if(this.at.length === 1){
                                    console.log('VALIDATE MENTION');
                                    mention.innerText = this.at[0].id;
                                    mention.setAttribute('data-id',this.at[0].id);
                                    mention.setAttribute('data-label', '@' + this.at[0].label);
                                    mention.setAttribute('data-text',this.at[0].text || this.at[0].label);
                                    mention.classList.remove('editing');
                                    this.container.innerHTML = '';
                                    this.quill.setSelection(Math.min(this.quill.getLength(), index + mention.innerText.length));
                                }
                            }
                            else if(mention){
                                if(mention.classList.contains('editing')){
                                    console.log('SEARCH');
                                    this.searchAt(mention.innerText.substring(1));
                                }
                                else if(mention.innerText !== mention.getAttribute('data-id')){
                                    console.log('DELETE MENTION');
                                    mention.innerText = "";
                                }
                            }
                            else if(!mention && delta.ops.some(function(change){
                                    return change.insert === '@';
                                })){
                                console.log('CREATE MENTION');
                                this.addMention(index);
                                this.searchAt();
                            }
                            else{
                                console.log('EMPTY AT LIST');
                                this.container.innerHTML = '';
                            }
                        }
                        
                        searchAt(search){
                            var r = this.options.callback(search);
                            if(r.then){
                                r.then(function(list){
                                    this.fillList(list);
                                }.bind(this));
                            }
                            else{
                                this.fillList(r);
                            }
                        };

                        addMention (index){
                            this.quill.updateContents(new Delta()     
                                .retain(index)
                                .delete(1)               
                            );
                            var mention = {
                                id : "",
                                label : "",
                                text : ""
                            };
                            this.mentions.push(mention);
                            this.quill.insertText(index," ", Quill.sources.API);
                            this.quill.insertEmbed(index, 'mention', mention, Quill.sources.API);
                            this.quill.setSelection(index + 1);
                        };

                        fillList(list){
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
                                else{
                                   var at = document.createElement('div');
                                   at.classList.add('at');
                                   at.innerText = '@';
                                   button.appendChild(at);
                                }
                                button.innerHTML += (mention.text || mention.label);
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

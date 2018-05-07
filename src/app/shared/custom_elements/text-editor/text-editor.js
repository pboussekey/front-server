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
                            if(data === true){
                                node.classList.add('hide');
                            }
                            if(data.id){
                                node.dataset.id = data.id;
                            }
                            if(data.label){
                                if(data.label.indexOf('@') !== 0){
                                    data.label = '@' + data.label;
                                }
                                node.dataset.label = data.label;
                                node.dataset.text = data.text || data.label;

                            }
                            if(!node.innerText){
                                node.innerText = "@";
                            }
                            return node;
                        }
                        
                        isInvalid(){
                            return (!this.domNode.classList.contains('editing') 
                                  &&  this.domNode.getAttribute('data-id') !==  this.domNode.innerText)
                             ||
                             (this.domNode.classList.contains('editing') 
                                  && this.domNode.innerText.indexOf('@') !== 0
                             )
                             ||
                             (this.domNode.classList.contains('hide'));
                        }
                    
                       optimize(){
                            if(this.isInvalid()){
                                setTimeout(function(){
                                   this.remove();
                                }.bind(this));
                            }
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
                            this.container = document.querySelector(options.container);
                            quill.on('text-change', this.onChange.bind(this));
                            quill.on('blur', function(){
                                this.container.innerHTML = '';
                            }.bind(this));
                        }
                        

                        onChange(delta, _ , source){
                            console.log("ON CHANGE", delta, source);
                            var index = Math.max(0,delta.ops.reduce(function(index, ops){
                                return index + (ops.retain || 0) - (ops.delete || 0);
                            },0));
                            var leaf = this.quill.getLeaf(index);
                            var mention = null;
                            if(leaf[0] && leaf[0].parent && leaf[0].parent.domNode.tagName === 'MENTION'){
                                mention = leaf[0].parent;
                            }
                            if(source !== 'user'){
                                return;
                            }
                            if(mention){
                                this.searchAt(mention, mention.domNode.innerText.substring(1).trim());
                            }
                            else if(!mention && delta.ops.some(function(change){
                                    return change.insert === '@';
                                })){
                                var mention = this.addMention(index);
                                this.searchAt(mention, "");
                            }
                            else{
                                this.container.innerHTML = '';
                            }
                        }
                        
                        searchAt(mention, search){
                            var r = this.options.callback(search);
                            if(r.then){
                                r.then(function(list){
                                    this.processList(mention, list, search);
                                }.bind(this));
                            }
                            else{
                                this.processList(mention, r, search);
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
                            this.quill.insertText(index," ", Quill.sources.API);
                            this.quill.insertEmbed(index, 'mention', mention, Quill.sources.API);
                            mention = (this.quill.getLeaf(index)[0].next || this.quill.getLeaf(index)[0].parent);
                            this.quill.setSelection(index + 1);
                            return mention;
                        };
                        validateMention(mention, element){
                            var oldLength = mention.domNode.innerText.length;
                            console.log("VALIDATE MENTION", mention, element);
                            mention.insertAt(0, element.id);
                            mention.deleteAt(element.id.length, oldLength);
                            mention.domNode.setAttribute('data-id',element.id);
                            mention.domNode.setAttribute('data-label', '@' + element.label);
                            mention.domNode.setAttribute('data-text',element.text || element.label);
                            mention.domNode.classList.remove('editing');
                            this.container.innerHTML = '';
                            setTimeout(function(){
                                this.quill.focus();
                                this.quill.setSelection(mention.offset() + mention.domNode.innerText.length + 1);
                            }.bind(this), 0);
                        };
                        stripMention(mention){
                            var text = mention.domNode.innerText || "";
                            var index = mention.offset();
                            mention.deleteAt(0, mention.domNode.innerText.length);
                            this.quill.insertText(index,text, Quill.sources.API);
                            this.container.innerHTML = '';
                            setTimeout(function(){
                                   this.quill.focus();
                                   this.quill.setSelection(index + text.length);
                            }.bind(this), 0);
                        };

                        processList(mention, list){
                            this.container.innerHTML = '';
                            if(mention.domNode.innerText.slice(-1) === ' '){
                                if(!list.length){
                                    this.at = [];
                                    this.stripMention(mention);
                                    return;
                                }
                                if(list.length === 1){
                                    this.at = [];
                                    this.validateMention(mention, list[0]);
                                    return;
                                }
                            }
                           
                            this.at = list;
                            list.forEach(function(element){ 
                                var button = document.createElement('button');
                                button.className = 'ql-mention-list-item';
                                button.onclick = function(){ 
                                    this.validateMention(mention, element);
                                }.bind(this);
                                if(element.image){
                                    var image = new Image();
                                    image.src = element.image;
                                    button.appendChild(image);
                                }
                                else{
                                   var at = document.createElement('div');
                                   at.classList.add('at');
                                   at.innerText = '@';
                                   button.appendChild(at);
                                }
                                button.innerHTML += (element.text || element.label);
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

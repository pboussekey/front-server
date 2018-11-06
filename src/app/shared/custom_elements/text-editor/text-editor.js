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
                            else{
                              editor.insertText(0, text);

                            }
                        };
                    }

                }
            };
        }]);

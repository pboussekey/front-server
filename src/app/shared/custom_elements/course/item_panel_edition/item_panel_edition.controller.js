angular.module('customElements').controller('item_panel_edition_controller',
    ['$scope','items_model','post_model','library_model','panel_service','$translate','items_childs_model',
    'notifier_service','courseConfiguration','modal_service','upload_service','api_service','pum_model','item_users_model',
    'quiz_model', '$q','urlmetas_service','docslider_service','item_groups_model','page_model',
    function( $scope, items_model, post_model, library_model, panel_service, $translate, items_childs_model,
        notifier_service, courseConfiguration, modal_service, upload_service, api_service, pum_model, item_users_model,
        quiz_model, $q, urlmetas_service, docslider_service, item_groups_model, page_model ){

        var ctrl = this;

        // --- DEFINING OPTIONS --- //
        var urlRgx = new RegExp(/(https?:\/\/[^ ]+)/g),
            createParams = {},
            focusable_selector = "a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex], [contenteditable]";

        ctrl.loading = true;
        ctrl.steps = { typeSelection:1, edition:2 };
        ctrl.available_states = courseConfiguration.available_states;
        ctrl.participants_types = courseConfiguration.participants_types;
        ctrl.itemTypes = courseConfiguration.typeOptions;
        ctrl.textOptions = [ { size: [ 'small', false, 'large' ]}, 'bold', 'italic', 'underline', 'link', { 'list': 'bullet' }, 'image',{'align':''},{'align':'center'},{'align':'right'}];
        ctrl.postAttachmentDropZone = { checkdrag: checkPostAttachmentDrag, ondrop: onPostAttachmentDrop };
        ctrl.itemFileDropZone = { checkdrag: checkItemFileDrag, ondrop: onItemFileDrop };
        ctrl.groupDropzone = { checkdrag: checkGroupZoneDrag, ondrop: onGroupZoneDrop, onchange: function( event, data ){} };
        ctrl.availableAtdDropzone = { checkdrag: checkAvailableAtdDrag, ondrop: onAvailableAtdDrop, onchange: function( event, data ){} };

        // Used to block saving if upload is not done.
        ctrl.uploading = 0;

        // EXPOSE METHODS
        ctrl.nextStep = function( type ){
            var page_id = createParams.page_id;

            ctrl.step = ctrl.steps.edition;
            ctrl.editedItem.type = type;
            ctrl.uploading = 0;

            if( ctrl.hasSpecific('post') ){
                ctrl.editedPost = {
                    attachments:[]
                };
            }

            if( ctrl.hasSpecific('members') ){
                ctrl.editedItem.participants = ctrl.participants_types.all;
                ctrl.attendees = {};
                ctrl.loaded_attendees = [];
                pum_model.list[page_id].datum.forEach(function(userId){
                    ctrl.attendees[userId] = {selected:false, id: userId};
                });

                ctrl.loadNextAttendees();
            }

            if( ctrl.hasSpecific('groups') ){
                ctrl.editedItem.participants = ctrl.participants_types.group;
                ctrl.availableAttendees = pum_model.list[page_id].datum.concat();
                ctrl.groups = {};
            }

            if( ctrl.hasSpecific('quiz') ){
                ctrl.quiz_questions = [];
            }

            if( ctrl.hasSpecific('file') ){
                ctrl.editedLink = {};
            }

            setHeadLabel();
        };

        ctrl.backStep = function(){
            ctrl.editedItem = {
                title:'',
                text: null,
                description:'',
                is_available: ctrl.available_states.available_on_date
            };

            ctrl.isUpdated = false;
            ctrl.editedFile = undefined;
            ctrl.editedPost = undefined;
            ctrl.editedLink = undefined;

            ctrl.availableAttendees = undefined;
            ctrl.groups = undefined;
            ctrl.quiz_questions = undefined;

            ctrl.optionsDisplayed = false;
            ctrl.step = ctrl.steps.typeSelection;
        };

        ctrl.setQuizPoints = function(){
            var points = 0;
            ctrl.quiz_questions.forEach(function( q ){
                points += q.point || 0;
            });

            ctrl.editedItem.points = points;
            ctrl.isUpdated = true;
            $scope.$evalAsync();
        };

        ctrl.addQuizQuestion = function(){
            var question = { displayed:true };
            ctrl.quiz_questions.push(question);

            if( ctrl.editedItem.quiz_id ){
                ctrl.created_questions.push(question);
            }

            ctrl.isUpdated = true;
        };

        ctrl.deleteQuizQuestion = function( question, $event ){
            var qdx = ctrl.quiz_questions.indexOf( question );
            if( qdx !== -1 ){
                if( question.answers.length || question.point || question.text ){
                    modal_service.open({
                        reference: $event.target,
                        label: 'Delete this question',
                        template:'app/shared/elements/modal/cancel_modal.html',
                        is_alert: true,
                        scope: {
                            cancel: function(){
                                modal_service.close();
                                rm();
                            }
                        }
                    });
                }else{
                    rm();
                }
            }

            function rm(){
                ctrl.quiz_questions.splice( qdx, 1 );

                if( ctrl.editedItem.quiz_id ){
                    if( question.id ){
                        ctrl.removed_questions.push(question.id);
                    }else{
                        ctrl.created_questions.splice( ctrl.created_questions.indexOf(question),1 );
                    }
                }
                ctrl.setQuizPoints();
                ctrl.isUpdated = true;
            }
        };

        ctrl.setUpdated = function(){
            ctrl.isUpdated = true;
        };
        // Cancel action
        ctrl.cancel = function( $event ){
            if( ctrl.editedItem.id ){
                ctrl.backToPreviousPanel();
            }else{
                ctrl.close();
            }
        };
        // Close panel
        ctrl.close = function( $event ){
            panel_service.launchClose();
        };
        // Back to previous panel
        ctrl.backToPreviousPanel = function( force ){
            if( $scope.back ){
                $scope.back( force );
            }else if( force ){
                panel_service.close();
            }else{
                ctrl.close();
            }
        };
        // Open document slider
        ctrl.openSlider = function( $event, document ){
           docslider_service.open({ docs : [document]},'', $event.target, 0);
           $event.preventDefault();
        };
        // On paste on post content
        ctrl.onPostContentPaste = function( e ){
            var text = e.clipboardData.getData('text/plain'),
                matches = urlRgx.exec( text );

            urlRgx.lastIndex = 0;

            if( matches && ( !ctrl.editedPost.link || ctrl.editedPost.link && matches[0] !== ctrl.editedPost.link ) ){
                ctrl.loadingLink = true;

                urlmetas_service.get( matches[0] ).then(function(meta){
                    if( meta.title || meta.description || meta.picture ){
                        ctrl.editedPost.link = matches[0];
                        ctrl.editedPost.link_title = meta.title || matches[0];
                        ctrl.editedPost.link_desc = meta.description;
                        ctrl.editedPost.picture = meta.picture;
                        ctrl.isUpdated = true;
                    }
                    ctrl.loadingLink = false;
                },function(){ ctrl.loadingLink = false; });
            }
        };

        ctrl.checkFileLink = function(){
            if( !ctrl.checkingLink ){
                var text = ctrl.editedLink.link,
                    matches = urlRgx.exec( text );

                urlRgx.lastIndex = 0;
                ctrl.isUpdated = true;

                if( matches ){
                    ctrl.checkingLink = true;

                    urlmetas_service.get( matches[0] ).then(function(meta){
                        ctrl.checkingLink = false;

                        if( meta.title || meta.description || meta.picture ){
                            ctrl.editedLink.link = matches[0];
                            ctrl.editedLink.link_title = meta.title || matches[0];
                            ctrl.editedLink.link_desc = meta.description;
                            ctrl.editedLink.picture = meta.picture;
                            ctrl.isUpdated = true;
                        }

                        $scope.$evalAsync();

                        if( ctrl.queueCheckLink ){
                            ctrl.queueCheckLink = false;
                            ctrl.checkFileLink();
                        }
                    },function(){
                        ctrl.checkingLink = false;
                        if( ctrl.queueCheckLink ){
                            ctrl.queueCheckLink = false;
                            ctrl.checkFileLink();
                        }
                        $scope.$evalAsync();
                    });
                }
            }else{
                ctrl.queueCheckLink = true;
            }
        };

        ctrl.removeFileLink = function(){
            ctrl.editedItem.old_library_id = ctrl.editedItem.library_id || ctrl.editedItem.old_library_id;
            ctrl.editedItem.library_id = null;

            ctrl.editedLink = {};
            ctrl.checkingLink = false;
            urlRgx.lastIndex = 0;
            ctrl.isUpdated = true;
        };

        ctrl.removeLink = function(){
            ctrl.editedPost.link = '';
            ctrl.editedPost.link_title = '';
            ctrl.editedPost.link_desc = '';
            ctrl.editedPost.picture = '';
            ctrl.isUpdated = true;
        };
        // Remove attachment
        ctrl.removeAttachment = function( attachment ){
            var idx = ctrl.editedPost.attachments.indexOf( attachment );
            if( idx !== -1 ){
                ctrl.editedPost.attachments.splice( idx, 1);
                ctrl.isUpdated = true;
            }
        };
        // Add attachments
        ctrl.addAttachments = function( files ){
            if( files && files.length ){

                Array.prototype.forEach.call(files,function( file ){
                    var upload = upload_service.upload('token', file, file.name),
                        attachment = {
                            progression: 0,
                            file: file,
                            upload: upload,
                            name: file.name,
                            type: file.type
                        };

                    attachment.promise = upload.promise.then(function(d){
                        attachment.token = d.token;
                        delete( attachment.promise );
                        delete( attachment.upload );
                    },function(){
                        attachment.upload_error = true;
                        delete( attachment.promise );
                        delete( attachment.upload );
                        throw 'Error: file not uploaded';
                    },function( evt ){
                        attachment.progression = Math.round(1000 * evt.loaded / evt.total) / 10;
                    });

                    ctrl.editedPost.attachments.push(attachment);
                    ctrl.isUpdated = true;
                });

                $scope.$evalAsync();
            }
        };
        // On file select callback
        ctrl.onItemFileSelect = function( files ){
            ctrl.addFile( files[0] );
        };
        // Remove item file
        ctrl.removeItemFile = function(){
            ctrl.editedItem.old_library_id = ctrl.editedItem.library_id || ctrl.editedItem.old_library_id;
            ctrl.editedItem.library_id = null;
            ctrl.editedFile = undefined;
            ctrl.isUpdated = true;
        };

        ctrl.addFile = function( file ){
            var upload = upload_service.upload('token', file, file.name);

            if( !ctrl.editedFile ){
                ctrl.editedFile = {};
            }

            ctrl.editedFile.progression = 0;
            ctrl.editedFile.file = file;
            ctrl.editedFile.upload = upload;
            ctrl.editedFile.name = file.name;
            ctrl.editedFile.type = file.type;

            ctrl.editedFile.promise = upload.promise.then(function(d){
                ctrl.editedFile.token = d.token;
                delete(ctrl.editedFile.promise);
                delete(ctrl.editedFile.upload);
            },function(){
                ctrl.editedFile.upload_error = true;
                delete(ctrl.editedFile.promise);
                delete(ctrl.editedFile.upload);
                throw 'File not uploaded';
            },function( evt ){
                ctrl.editedFile.progression = Math.round(1000 * evt.loaded / evt.total) / 10;
            });

            if( !ctrl.editedItem.title ){
                ctrl.editedItem.title = file.name;
            }

            ctrl.isUpdated = true;
            $scope.$evalAsync();
        };

        ctrl.createAndClose = function(){
            return ctrl.create().then(function(){
                panel_service.close();
            });
        }

        // CREATE
        ctrl.create = function(){
            if( !ctrl.requesting ){
                var deferred = $q.defer();

                ctrl.requesting = deferred.promise;

                if( ctrl.getItemText ){
                    ctrl.editedItem.text = ctrl.getItemText();
                }

                var createStep = 1;
                if( ctrl.editedFile ){
                    createStep++;

                    if( ctrl.editedFile.promise ){
                        ctrl.editedFile.promise.then( addToLibrary, function(){ createItem(false); });
                    }else{
                        addToLibrary();
                    }

                    function addToLibrary(){
                        library_model.add( ctrl.editedFile.name, undefined, ctrl.editedFile.token, ctrl.editedFile.type, true )
                            .then(function(libraryId){
                                ctrl.editedItem.library_id = libraryId;
                                createItem();
                            },function(){
                                createItem( false );

                                $translate('item_panel.error_file_save').then(function( translation ){
                                    notifier_service.add({
                                        type:'error',
                                        title: translation
                                    });
                                });
                            });
                    }
                }

                if( ctrl.editedLink && ctrl.editedLink.link ){
                    createStep++;
                    library_model.add( ctrl.editedLink.link_title||ctrl.editedLink.link, ctrl.editedLink.link,
                        undefined, 'link', true, JSON.stringify({link_desc:ctrl.editedLink.link_desc,picture:ctrl.editedLink.picture}) )
                        .then(function(libraryId){
                            ctrl.editedItem.library_id = libraryId;
                            createItem();
                        }, function(){
                            createItem( false );

                            $translate('item_panel.error_link_save').then(function( translation ){
                                notifier_service.add({
                                    type:'message',
                                    message: translation
                                });
                            });
                        });
                }

                createItem();

                function createItem( err ){
                    if( err ){
                        ctrl.requesting = true;
                        return;
                    }

                    createStep--;
                    if( !createStep ){
                        items_model.create(Object.assign(ctrl.editedItem, createParams)).then(function( itemID ){

                            var createdStep=1;

                            if( ctrl.editedPost ){
                                createdStep++;

                                var addPostStep = 1,
                                    post = Object.assign({item_id:itemID,t_page_id:createParams.page_id, page_id:createParams.page_id},ctrl.editedPost);

                                post.content = (post.content||'').trim();

                                // SET ATTACHMENTS DATAS
                                if( ctrl.editedPost.attachments.length ){
                                    post.docs = [];
                                    ctrl.editedPost.attachments.forEach(function( a ){
                                        if( a.promise ){
                                            addPostStep++;
                                            a.promise.then(function(){
                                                post.docs.push({token:a.token,name:a.name,type:a.type});
                                                addPost();
                                            }, function(){
                                                createItem(false);
                                            });
                                        }else{
                                            post.docs.push({token:a.token,name:a.name,type:a.type});
                                        }
                                    });
                                }

                                addPost();

                                function addPost(){
                                    addPostStep--;
                                    if( !addPostStep ){
                                        post_model.add( post ).then(itemCreated);
                                    }
                                }
                            }
                            if( ctrl.editedItem.participants === ctrl.participants_types.user ){
                                createdStep++;

                                var toAdd = [];
                                Object.keys(ctrl.attendees).forEach(function(key){
                                    if( ctrl.attendees[key].selected ){
                                        toAdd.push( ctrl.attendees[key].id );
                                    }
                                });

                                item_users_model.addUsers( itemID, toAdd ).then(itemCreated);
                            }
                            if( ctrl.hasSpecific('quiz') ){
                                createdStep++;
                                quiz_model.create( itemID, ctrl.quiz_questions).then(itemCreated);
                            }

                            if( ctrl.hasSpecific('groups') && Object.keys(ctrl.groups).length ){
                                createdStep++;

                                var grpNames = [];
                                Object.keys(ctrl.groups).forEach(function(id){ grpNames.push(ctrl.groups[id].name); });

                                item_groups_model.add( itemID, grpNames ).then(function( grpIds ){
                                    var promise;
                                    Object.keys(ctrl.groups).forEach(function(id, idx){
                                        promise = item_users_model.addUsers( itemID, ctrl.groups[id].users, grpIds[idx] );
                                    });
                                    promise.then(itemCreated);
                                });
                            }

                            itemCreated();

                            function itemCreated(){
                                createdStep--;
                                if( !createdStep ){
                                    items_childs_model.get([createParams.parent_id],true).then(function(){

                                        ctrl.requesting = false;
                                        deferred.resolve();

                                        $translate('ntf.element_created').then(function( translation ){
                                            notifier_service.add({
                                                type:'message',
                                                message: translation
                                            });
                                        });
                                    });
                                }
                            }
                        },function(){
                            // ERROR DURING ITEM CREATION
                            $translate('item_panel.error_item_save').then(function( translation ){
                                notifier_service.add({
                                    type:'message',
                                    message: translation
                                });
                            });
                            deferred.reject();
                            ctrl.requesting = false;
                        });
                    }
                }
            }

            return ctrl.requesting;
        };

        ctrl.updateAndClose = function( must_notify ){
            return ctrl.update( must_notify ).then(function(){
                ctrl.backToPreviousPanel( true );
                //panel_service.close();
            });
        };

        // UPDATE
        ctrl.update = function( must_notify ){
            if( !ctrl.requesting ){
                var deferred = $q.defer(),
                    updatingNotification = {
                        type: 'message',
                        title: 'Updating...',
                        time: 0
                    };

                ctrl.requesting = deferred.promise;
                notifier_service.add( updatingNotification );

                if( ctrl.getItemText ){
                    ctrl.editedItem.text = ctrl.getItemText();
                }

                var updStep = 1;
                if( ctrl.editedFile && !ctrl.editedFile.id ){
                    updStep++;

                    if( ctrl.editedFile.promise ){
                        ctrl.editedFile.promise.then( updateLibrary, onError );
                    }else{
                        updateLibrary();
                    }

                    function updateLibrary(){
                        if( ctrl.editedItem.old_library_id ){
                            library_model.update( ctrl.editedItem.old_library_id, ctrl.editedFile.name, '', ctrl.editedFile.token, ctrl.editedFile.type, '' )
                                .then(function(libraryId){
                                    ctrl.editedItem.library_id = libraryId;
                                    updateItem();
                                }, onError);
                        }else {
                            library_model.add( ctrl.editedFile.name, undefined, ctrl.editedFile.token, ctrl.editedFile.type, true )
                                .then(function(libraryId){
                                    ctrl.editedItem.library_id = libraryId;
                                    updateItem();
                                }, onError);
                        }
                    }
                }

                if( ctrl.editedLink && ctrl.editedLink.link && !ctrl.editedLink.id ){
                    updStep++;

                    if( ctrl.editedItem.old_library_id ){
                        library_model.update( ctrl.editedItem.old_library_id, ctrl.editedLink.link_title||ctrl.editedLink.link,
                            ctrl.editedLink.link, '', 'link', JSON.stringify({link_desc:ctrl.editedLink.link_desc,picture:ctrl.editedLink.picture}) )
                            .then(function(libraryId){
                                ctrl.editedItem.library_id = libraryId;
                                updateItem();
                            });
                    }else {
                        library_model.add( ctrl.editedLink.link_title||ctrl.editedLink.link, ctrl.editedLink.link,
                            undefined, 'link', true, JSON.stringify({link_desc:ctrl.editedLink.link_desc,picture:ctrl.editedLink.picture}) )
                            .then(function(libraryId){
                                ctrl.editedItem.library_id = libraryId;
                                updateItem();
                            });
                    }
                }

                if( ctrl.editedPost ){
                    updStep++;

                    var updatePostStep = 1,
                        post = Object.assign({item_id:ctrl.editedItem.id,t_page_id:createParams.page_id},ctrl.editedPost);

                    post.content = post.content.trim();

                    // SET ATTACHMENTS DATAS
                    if( ctrl.editedPost.attachments.length ){
                        post.docs = [];
                        ctrl.editedPost.attachments.forEach(function( a ){
                            if( a.promise ){
                                updatePostStep++;
                                a.promise.then(function(){
                                    post.docs.push({token:a.token,name:a.name,type:a.type});
                                    updatePost();
                                }, onError);
                            }else{
                                post.docs.push({token:a.token,name:a.name,type:a.type});
                            }
                        });
                    }

                    updatePost();

                    function updatePost(){
                        updatePostStep--;
                        if( !updatePostStep ){
                            post_model.add( post ).then(function( postId ){
                                ctrl.editedItem.post_id = parseInt(postId);
                                updateItem();
                            });
                        }
                    }
                }

                if( ctrl.editedItem.quiz_id ){
                    updStep++;
                    ctrl.updateQuiz().then(updateItem, onError);
                }

                if( ctrl.hasSpecific('groups') ){
                    var toRemove = [];

                    item_users_model.list[ctrl.editedItem.id].datum.forEach(function(item_user){
                        if( ctrl.availableAttendees.indexOf(item_user.user_id) !== -1 ){
                            toRemove.push( item_user.user_id );
                        }
                    });

                    if( toRemove.length ){
                        updStep++;
                        item_users_model.removeUsers( ctrl.editedItem.id, toRemove ).then(updateItem, onError);
                    }
                    if( ctrl.deletedGroups.length ){
                        updStep++;
                        item_groups_model.remove( ctrl.editedItem.id, ctrl.deletedGroups ).then(updateItem, onError);
                    }
                    if( Object.keys(ctrl.groups).length ){

                        var groupToCreate = Object.keys(ctrl.groups).reduce(function( arr, id ){
                            if( ctrl.groups[id].create ){
                                arr.push( ctrl.groups[id].name );
                            }
                            return arr;
                        },[]);

                        if( groupToCreate.length ){
                            updStep++;
                            item_groups_model.add( ctrl.editedItem.id, groupToCreate ).then(function(ids){
                                var i = 0;
                                Object.keys(ctrl.groups).forEach(function( id ){
                                    if( ctrl.groups[id].users ){
                                        updStep++;
                                        item_users_model.addUsers( ctrl.editedItem.id, ctrl.groups[id].users, ctrl.groups[id].create?ids[i++]:id, ctrl.groups[id].name )
                                        .then(updateItem).then(item_groups_model.get([ctrl.editedItem.id], true));
                                    }else if( ctrl.groups[id].create ){
                                        i++;
                                    }
                                });
                                updateItem();
                            });
                        }else{
                            Object.keys(ctrl.groups).forEach(function( id ){
                                updStep++;
                                item_users_model.addUsers( ctrl.editedItem.id, ctrl.groups[id].users, id, ctrl.groups[id].name  )
                                    .then(updateItem, onError).then(item_groups_model.get([ctrl.editedItem.id], true));
                            });
                        }
                    }
                }

                if( ctrl.editedItem.participants === ctrl.participants_types.user ){
                    var toAdd = [], toRemove = [];

                    Object.keys(ctrl.attendees).forEach(function(key){
                        if( ctrl.attendees[key].selected ){
                            toAdd.push( ctrl.attendees[key].id );
                        }
                    });

                    item_users_model.list[ctrl.editedItem.id].datum.forEach(function(item_user){
                        if( toAdd.indexOf(item_user.user_id) === -1 ){
                            toRemove.push( item_user.user_id );
                        }
                    });

                    if( toAdd.length ){
                        updStep++;
                        item_users_model.addUsers( ctrl.editedItem.id, toAdd ).then(updateItem, onError);
                    }

                    if( toRemove.length ){
                        updStep++;
                        item_users_model.removeUsers( ctrl.editedItem.id, toRemove ).then(updateItem, onError);
                    }
                }

                updateItem();

                function updateItem(){
                    updStep--;
                    if( !updStep ){
                        items_model.update(ctrl.editedItem, must_notify).then(function(){
                            ctrl.requesting = false;
                            deferred.resolve();
                            notifier_service.remove( updatingNotification );

                            $translate('ntf.element_updated').then(function( translation ){
                                notifier_service.add({
                                    type:'message',
                                    message: translation
                                });
                            });
                        },function(){
                            notifier_service.add( updatingNotification );
                            deferred.reject();
                            ctrl.requesting = false;
                        });
                    }
                }

                function onError(){
                    ctrl.requesting = false;
                    notifier_service.remove( updatingNotification );
                    notifier_service.add({
                        type:'message',
                        title:'An error occured while updating.'
                    })
                }
            }

            return ctrl.requesting;
        };

        ctrl.updateQuiz = function(){

            var deferred = $q.defer(),
                steps = 1,
                updatedQuestions = [],
                removedAnswers = [],
                createdAnswers = [],
                updatedAnswers = [];

            ctrl.quiz_questions.forEach(function( question ){
                if( question.id && ctrl.removed_questions.indexOf(question.id) === -1 ){
                    updatedQuestions.push(question);

                    if( question.answers.removeds ){
                        Array.prototype.push.apply( removedAnswers, question.answers.removeds );
                    }
                    if( question.answers.createds ){
                        Array.prototype.push.apply( createdAnswers, question.answers.createds );
                    }

                    question.answers.forEach( function(answer){
                        if( answer.id ){
                            updatedAnswers.push(answer);
                        }
                    });

                }
            });

            if( ctrl.removed_questions.length ){
                steps++;
                quiz_model.removeQuestions( ctrl.removed_questions ).then( updated );
            }
            if( ctrl.created_questions.length ){
                steps++;
                quiz_model.addQuestions( ctrl.editedItem.quiz_id, ctrl.created_questions ).then( updated );
            }
            if( updatedQuestions.length ){
                steps++;
                quiz_model.updateQuestions( updatedQuestions ).then( updated );
            }
            if( createdAnswers.length ){
                steps++;
                quiz_model.addAnswers( createdAnswers ).then( updated );
            }
            if( removedAnswers.length ){
                steps++;
                quiz_model.removeAnswers( removedAnswers ).then( updated );
            }
            if( updatedAnswers.length ){
                steps++;
                quiz_model.updateAnswers( updatedAnswers ).then( updated );
            }

            function updated(){
                steps--;
                if( !steps ){
                    quiz_model._outdateModel( ctrl.editedItem.quiz_id );
                    deferred.resolve();
                }
            }

            updated();
            return deferred.promise;
        };

        ctrl.delete = function( $event ){
            modal_service.open({
                reference: $event.target,
                label: 'Delete this element',
                template:'app/shared/custom_elements/course/item_panel_edition/delete_modal.html',
                is_alert: true,
                scope: {
                    cancel: function(){
                        modal_service.close();
                        deleteItem();
                    }
                }
            });
        };

        ctrl.loadNextAttendees = function(){
            if( !ctrl.lna_flag ){
                var l = ctrl.loaded_attendees.length,
                    keys = Object.keys(ctrl.attendees),
                    tl = keys.length,
                    min = Math.min(tl, l+10);

                if( l < tl ){
                    for(;l < min ; l++){
                        ctrl.loaded_attendees.push( ctrl.attendees[keys[l]] );
                    }
                }

                ctrl.lna_flag= true;
                setTimeout(function(){
                    ctrl.lna_flag= false;
                }, 500);
            }
        };

        ctrl.hasSpecific = function( name ){
            return ctrl.editedItem.type && ctrl.itemTypes[ctrl.editedItem.type].specific.indexOf( name ) !== -1;
        };

        ctrl.isOptional = function( name ){
            return ctrl.editedItem.type && ctrl.itemTypes[ctrl.editedItem.type].optional.indexOf( name ) !== -1;
        };

        ctrl.hasOptions = function(){
            return ctrl.editedItem.type && ctrl.itemTypes[ctrl.editedItem.type].optional && ctrl.itemTypes[ctrl.editedItem.type].optional.length;
        };

        ctrl.toggleOptions = function(){
            ctrl.optionsDisplayed = !ctrl.optionsDisplayed;
        };

        ctrl.getAvailableLabel = function(){
            if( ctrl.editedItem.is_available === ctrl.available_states.available ){
                return 'item.available';
            }else if( ctrl.editedItem.is_available === ctrl.available_states.not_available ){
                return 'item.not_available';
            }else if( ctrl.editedItem.is_available === ctrl.available_states.available_on_date ){
                return 'item.available_on_date';
            }
        };

        ctrl.fillGroups = function(){
            while( ctrl.availableAttendees.length ){
                fill();
            }

            function fill(){
                var lowest, idx = Math.round(Math.random()*(ctrl.availableAttendees.length-1));

                Object.keys(ctrl.groups).forEach(function(key){
                    if( !lowest || lowest.users.length > ctrl.groups[key].users.length ){
                        lowest = ctrl.groups[key];
                    }
                });

                lowest.users.push( ctrl.availableAttendees.splice( idx ,1)[0] );
                ctrl.isUpdated = true;
            }
        };

        ctrl.cantFill = function(){
            return !Object.keys(ctrl.groups).length || !ctrl.availableAttendees.length;
        };

        ctrl.createGroup = function(){
            var temp_id = 'NEW#'+Date.now();
            ctrl.groups[temp_id] = {
                id: temp_id,
                name: 'GROUP '+(Object.keys(ctrl.groups).length+1),
                users: [],
                create: true
            };

            ctrl.isUpdated = true;
        };

        ctrl.deleteGroup = function( grp ){
            if( grp.users.length ){
                grp.users.forEach(function(userId){
                    ctrl.availableAttendees.unshift(userId);
                });
            }
            if( !grp.create ){
                ctrl.deletedGroups.push(grp.id)
            }
            delete( ctrl.groups[grp.id] );
            ctrl.isUpdated = true;
        };

        ctrl.removeFromGroup = function( groupId, userId ){
            ctrl.groups[groupId].users.splice(ctrl.groups[groupId].users.indexOf(userId),1);
            ctrl.availableAttendees.push( userId );
            ctrl.isUpdated = true;
        };
        ctrl.canNotify = function(){
            return ctrl.editedItem.id && ctrl.editedItem.page_id
                && page_model.list[ctrl.editedItem.page_id].datum
                && page_model.list[ctrl.editedItem.page_id].datum.is_published
                && canNTF( ctrl.editedItem.id );
        };

        // --- SETTING SCOPE REFERENCES --- //
        $scope.onClose = onClose;
        $scope.onChange = load;

        // LOADING COMPONENT.
        load();

        // --- FUNCTIONS --- //
        // Load & configure component datas
        function load( id, parent_id, course_id ){
            var id = id || $scope.itemId;

            createParams.parent_id = parent_id || $scope.parentId;
            createParams.page_id = course_id || $scope.courseId;

            // LOADING
            ctrl.loading = true;
            // RESET CONTROLLER'S VARIABLES.
            ctrl.optionsDisplayed = false;
            ctrl.isUpdated = false;
            ctrl.attendees = undefined;
            ctrl.loaded_attendees = undefined;
            ctrl.availableAttendees = undefined;
            ctrl.getItemText = undefined;
            ctrl.editedLink = undefined;
            ctrl.editedPost = undefined;
            ctrl.editedFile = undefined;
            ctrl.editedItem = {title:'',description:'',text: null};

            if( id ){
                ctrl.step = ctrl.steps.edition;
                loadItemData( id );
            }else{
                ctrl.step = ctrl.steps.typeSelection;
                ctrl.loading = false;
            }
        }
        // Load item data
        function loadItemData( id ){
            items_model.get([id]).then(function(){
                var loadStep = 1,
                    course_id = items_model.list[id].datum.page_id;

                // Set edited item data
                Object.keys( items_model.list[id].datum ).forEach(function(k){
                    ctrl.editedItem[k] = items_model.list[id].datum[k];
                });
                // If this item has post data
                if( ctrl.hasSpecific('post') ){
                    ctrl.editedPost = {
                        attachments:[]
                    };
                    // Load post data if post exists
                    if( ctrl.editedItem.post_id ){
                        loadStep++;
                        loadItemPostData().then(loaded);
                    }
                }
                // If this item has library data
                if( ctrl.hasSpecific('file') ){
                    ctrl.editedLink = {};
                    // Load library data if document exists
                    if( ctrl.editedItem.library_id ){
                        loadStep++;
                        loadItemLibraryData().then(loaded);
                    }
                }
                // If this item has quiz data
                if( ctrl.hasSpecific('quiz') ){
                    ctrl.quiz_questions = [];
                    ctrl.created_questions = [];
                    ctrl.removed_questions = [];
                    // Load quiz data if quiz exists
                    if( items_model.list[id].datum.quiz_id ){
                        loadStep++;
                        loadItemQuizData().then(loaded);
                    }
                }
                // If this item can be done by selected members
                if( ctrl.hasSpecific('members') ){
                    ctrl.attendees = {};
                    ctrl.loaded_attendees = [];
                    // Set attendees.
                    pum_model.list[course_id].datum.forEach(function(userId){
                        ctrl.attendees[userId] = {selected:false, id: userId};
                    });
                    // Load existing item members.
                    loadStep++;
                    item_users_model.get([id]).then(function(){
                        item_users_model.list[id].datum.forEach(function(itemUser){
                            ctrl.attendees[itemUser.user_id].selected = true;
                        });
                        ctrl.loadNextAttendees();
                        loaded();
                    });
                }
                // If this item can be done by groups
                if( ctrl.hasSpecific('groups') ){
                    console.log("ATTENDEES", pum_model.list[course_id]);
                    ctrl.availableAttendees = pum_model.list[course_id].datum.concat();
                    ctrl.groups = {};
                    ctrl.deletedGroups = [];

                    var gstep = 2;
                    function initGroups(){
                        gstep--;
                        if( !gstep ){
                            item_groups_model.list[id].datum.forEach(function( grp ){
                                ctrl.groups[ grp.id ] = {
                                    id: grp.id,
                                    name: grp.name,
                                    users: []
                                };
                            });

                            item_users_model.list[id].datum.forEach(function(item_user){
                                var idx = ctrl.availableAttendees.indexOf(item_user.user_id);
                                if( idx !== -1 && item_user.group && item_user.group.id ){
                                    ctrl.availableAttendees.splice(idx,1);
                                    ctrl.groups[item_user.group.id].users.push(item_user.user_id);
                                }
                            });

                            loaded();
                        }
                    }

                    loadStep++;
                    item_groups_model.get([id]).then(initGroups);
                    item_users_model.get([id]).then(initGroups);
                }

                loaded();

                function loaded(){
                    loadStep--;
                    if( !loadStep ){
                        setHeadLabel();
                        ctrl.loading = false;
                    }
                }
            });
        }
        // Load item post & populate editing post model.
        function loadItemPostData(){
            return post_model.get([ctrl.editedItem.post_id]).then(function(){
                var p = post_model.list[ctrl.editedItem.post_id].datum;

                ctrl.editedPost = {
                    id: p.id,
                    content: p.content,
                    link: p.link,
                    link_title: p.link_title,
                    link_desc: p.link_desc,
                    picture: p.picture,
                    attachments: p.docs ? p.docs.concat(p.images||[], p.audios||[], p.videos||[]):[]
                };
            });
        }
        // Load item document & populate editing document model.
        function loadItemLibraryData(){
            return library_model.get([ctrl.editedItem.library_id]).then(function(){
                if( library_model.list[ctrl.editedItem.library_id].datum.type === 'link' ){

                    ctrl.editedLink.id = ctrl.editedItem.library_id;
                    ctrl.editedLink.link_title = library_model.list[ctrl.editedItem.library_id].datum.name;
                    ctrl.editedLink.link = library_model.list[ctrl.editedItem.library_id].datum.link;

                    try{
                        var properties = JSON.parse( library_model.list[ctrl.editedItem.library_id].datum.text );
                        if( properties ){
                            ctrl.editedLink.link_desc = properties.link_desc;
                            ctrl.editedLink.picture = properties.picture;
                        }
                    }catch(e){}
                }else{
                    ctrl.editedFile = {};
                    Object.keys( library_model.list[ctrl.editedItem.library_id].datum ).forEach(function(k){
                        ctrl.editedFile[k] = library_model.list[ctrl.editedItem.library_id].datum[k];
                    });
                }
            });
        }
        // Load item quiz & populate editing quiz/questions/answers models.
        function loadItemQuizData(){
            var qid = ctrl.editedItem.quiz_id;
            return quiz_model.get([qid]).then(function(){
                if( quiz_model.list[qid].datum.quiz_question ){
                    quiz_model.list[qid].datum.quiz_question.forEach(function(question){

                        var q = Object.assign({hash:question.id}, question);
                        delete( q.quiz_answer );
                        q.answers = [];

                        if( question.quiz_answer && question.quiz_answer.length ){
                            question.quiz_answer.forEach(function(answer){
                                q.answers.push(Object.assign({hash:answer.id},answer));
                            });
                        }

                        ctrl.quiz_questions.push(q);
                    });
                }
            });
        }
        // Function to be binded on container scope... Executed before panel closing.
        function onClose(){
            if( ctrl.isUpdated ){
                var deferred = $q.defer();

                modal_service.open({
                    reference: document.activeElement,
                    label: 'Leave this element ?',
                    template:'app/shared/custom_elements/course/item_panel_edition/confirm_modal.html',
                    is_alert: true,
                    scope: {
                        desc: 'All changes will be canceled',
                        cancel: function(){
                            modal_service.close();
                            deferred.reject();
                        },
                        confirm: function(){
                            modal_service.close();
                            deferred.resolve();
                        },
                        savequit: function(){
                            if( ctrl.editedItem.id ){
                                ctrl.update().then(function(){
                                    modal_service.close();
                                    deferred.resolve();
                                });
                            }else{
                                ctrl.create().then(function(){
                                    modal_service.close();
                                    deferred.resolve();
                                });
                            }
                        }
                    }
                });

                return deferred.promise;
            }else{
                return $q.resolve();
            }
        }
        // Check if drag data is correct on post attachments dropzone.
        function checkPostAttachmentDrag( event ){
            if( event && event.dataTransfer && event.dataTransfer.items
                && event.dataTransfer.items.length ){

                var i = 0,l=event.dataTransfer.items.length, valid = true;
                for(;i<l;i++){
                    valid = valid && event.dataTransfer.items[i].kind === 'file';
                }

                return valid;
            }
            return false;
        }
        // On drop on post attachments dropzone.
        function onPostAttachmentDrop( event ){
            ctrl.addAttachments( event.dataTransfer.files );
        }
        // Check if drag data is correct on item file dropzone.
        function checkItemFileDrag( event ){
            return event && event.dataTransfer && event.dataTransfer.items
                && event.dataTransfer.items.length
                && event.dataTransfer.items[0].kind === 'file';
        }
        // On drop on item file dropzone.
        function onItemFileDrop( event ){
            ctrl.addFile( event.dataTransfer.files[0] );
        }
        // Check if data is correct on group dropzone.
        function checkGroupZoneDrag( event ){
            if( event && event.dataTransfer && event.dataTransfer.items
                && event.dataTransfer.items.length ){
                return event.dataTransfer.items[0].type === 'atd';
            }
            return false;
        }
        // On drop on group dropzone.
        function onGroupZoneDrop( event ){
           if( event.target ){
               var atd = JSON.parse( event.dataTransfer.getData('atd') ),
                   groupId = event.target.getAttribute('data-group-id');

               if( groupId && ctrl.groups[groupId] ){

                   if( atd.grp ){
                       ctrl.groups[atd.grp].users.splice(ctrl.groups[atd.grp].users.indexOf(atd.id),1);
                   }else{
                       ctrl.availableAttendees.splice(ctrl.availableAttendees.indexOf(atd.id),1);
                   }

                   ctrl.groups[groupId].users.push(atd.id);
                   ctrl.isUpdated = true;
               }
           }
       }
       // Check available attendees drag data.
       function checkAvailableAtdDrag( event ){
           if( event && event.dataTransfer && event.dataTransfer.items
               && event.dataTransfer.items.length ){
               return event.dataTransfer.items[0].type === 'atd';
           }
           return false;
       }
        // On drop on available attendees dropzone.
        function onAvailableAtdDrop( event ){
            if( event.dataTransfer ){
                var atd = JSON.parse( event.dataTransfer.getData('atd') );
                if( atd.grp ){
                    ctrl.groups[atd.grp].users.splice(ctrl.groups[atd.grp].users.indexOf(atd.id),1);
                    ctrl.availableAttendees.push( atd.id );
                    ctrl.isUpdated = true;
                }
            }
        }
        // Return true if item update can be notified
        function canNTF( id ){
            return items_model.list[id] && items_model.list[id].datum && items_model.list[id].datum.is_published
                && ( !items_model.list[id].datum.parent_id || canNTF(items_model.list[id].datum.parent_id) );
        }
        // Set component header depending on creating/editing
        function setHeadLabel(){
            ctrl.headlabel = ctrl.itemTypes[ctrl.editedItem.type][ctrl.editedItem.id?'update':'create'];
        }
        // Delete item
        function deleteItem(){
            items_model.remove( ctrl.editedItem.id ).then(function(){
                panel_service.close();
                $translate('ntf.element_deleted').then(function( translation ){
                    notifier_service.add({
                        type:'message',
                        message: translation
                    });
                });
            });
        }
    }
]);

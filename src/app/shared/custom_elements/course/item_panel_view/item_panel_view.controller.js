angular.module('customElements').controller('item_panel_view_controller',
    ['$scope','items_model','page_model','library_model','$translate','$q','users_status','statuses', 'notifier_service',
    'tracker_service','modal_service','upload_service','item_user_model','submission_docs_model','session','puadmin_model',
    'item_submission_model', 'docslider_service','social_service','user_model','websocket','$state',
    function( $scope, items_model, page_model, library_model,  $translate, $q, users_status, statuses, notifier_service,
        tracker, modal_service, upload_service,  item_user_model, submission_docs_model, session, puadmin_model,
        item_submission_model, docslider_service, social_service, user_model, websocket, $state ){

        var ctrl = this;
        ctrl.loading = true;
        ctrl.isApp = (navigator.userAgent.indexOf('twicapp') !== -1);

        // --- DEFINING OPTIONS --- //
        var types = {
            //SCT: {icon:'i-section',label:'', },
            //FLD: {icon:'i-folder',label:'page.folder'},
            //LC: {icon:'i-camera',label:'item_types.liveclass', has_item_user: false, has_attachment: false},
            A: {icon:'i-assignment',label:'item_types.assignment', has_item_user: true, has_attachment: true},
            GA: {icon:'i-assignment',label:'item_types.group_assignment', has_item_user: true, has_attachment: true},
            QUIZ: {icon:'i-quiz',label:'item_types.quiz', has_item_user: false, has_attachment: false},
            PG: {icon:'i-page',label:'item_types.page', has_item_user: false, has_attachment: false},
            DISC: {icon:'i-groups',label:'item_types.discussion', has_item_user: false, has_attachment: false},
            MEDIA: {icon:'i-media',label:'item_types.media', has_item_user: false, has_attachment: false}
        };

        var availableStates = { available: 1, not_available: 2, available_on_date: 3};

        ctrl.textOptions = [ { size: [ 'small', false, 'large' ]}, 'bold', 'italic', 'underline', 'link', { 'list': 'bullet' }, 'image',{'align':''},{'align':'center'},{'align':'right'}];
        ctrl.dropZoneOptions = { checkdrag: checkDragAuthorization, ondrop: onDrop};

        // --- EXPOSING SERVICES & DATAS --- //
        ctrl.users = user_model.list;
        ctrl.pages = page_model.list;
        ctrl.session = session;
        ctrl.view = 'view';

        // --- EXPOSING METHODS --- //
        // Change view
        ctrl.setView = function( view, label ){
            ctrl.editor_label = label;
            ctrl.view = view;
        };
        // Open conversation
        ctrl.openChat = function( user_ids ){
            social_service.openConversation( undefined, angular.copy(user_ids) );
        };
        // Open document slider
        ctrl.openSlider = function( $event, document ){
            docslider_service.open({ docs : [ document || ctrl.document.datum]},'', $event.target, 0);
            $event.preventDefault();
        };
        // Return icon class depending on item 'type'.
        ctrl.itemIconClass = function(){ return types[ ctrl.item.datum.type ].icon; };
        // Return label depending on item 'type'.
        ctrl.getTypeLabel = function(){ return types[ ctrl.item.datum.type ].label; };
        // Tell if this kind of item can be submit.
        ctrl.canSubmit = function(){ return types[ ctrl.item.datum.type ].has_item_user; };
        // Disable submission button
        ctrl.isSubmitDisabled = function(){
            return !ctrl.attachments || !ctrl.attachments.length || !ctrl.attachments.every(function(atc){ return atc.id; });
        };
        // Tell if item submission can contain attachments.
        ctrl.hasAttachment = function(){ return types[ ctrl.item.datum.type ].has_attachment; };
        // Remove a submission attachment.
        ctrl.removeAttachment = removeAttachment;
        // Add a submission attachment
        ctrl.addAttachments = addAttachments;
        // Submit assignment
        ctrl.submitAssignment = function( $eventn ){
            if( !ctrl.isAdmin && !ctrl.isSubmitted ){
                item_submission_model.submit( ctrl.item.datum.id ).then(function(){
                    ctrl.isSubmitted = true;
                });
            }
        };
        ctrl.unsubmitAssignment = function( $eventn ){
            if( !ctrl.isAdmin && ctrl.isSubmitted ){
                item_submission_model.unsubmit( ctrl.item.datum.id ).then(function(){
                    ctrl.isSubmitted = false;
                });
            }
        };
        // Submit quiz
        ctrl.submitQuiz = function( $event ){
            if( !ctrl.isAdmin && !ctrl.isSubmitted ){
                modal_service.open({
                    reference: $event.target,
                    label: 'Submit Quiz',
                    template:'app/shared/elements/modal/cancel_modal.html',
                    is_alert: true,
                    scope: {
                        desc: 'If you submit, you will not be able to continue or edit this quiz anymore.',
                        cancel: function(){
                            item_submission_model.submit( ctrl.item.datum.id ).then(function(){
                                ctrl.isSubmitted = true;
                            });
                            modal_service.close();
                        }
                    }
                });
            }
        };
        // OPEN RICH TEXT EDITOR
        ctrl.openRTE = function( atc ){
            if( atc ){
                ctrl.editedDoc = Object.assign({},atc);
                if( ctrl.item.datum.type === 'GA' ){
                    ctrl.editedDoc.room = 'room_'+atc.id;
                }
                ctrl.setView('edition', 'submission.update_document' );
            }else{
                ctrl.editedDoc = {};
                ctrl.setView('edition', 'submission.create_document' );
            }
        };

        ctrl.updateDoc = function(){
            var atc = ctrl.editedDoc;
            atc.text = ctrl.getDocText();
            library_model.update( atc.id, atc.name, undefined, undefined, atc.type, atc.text )
                .then(function(){

                    ctrl.attachments.some(function( doc ){
                        if( doc.id === atc.id ){
                            doc.text = atc.text;
                            doc.name = atc.name;
                            return true;
                        }
                    });

                    if( ctrl.socket &&  ctrl.submission.datum.users && ctrl.submission.datum.users.length ){
                        ctrl.socket.emit('submission.update_document', {
                            item_id:ctrl.item.datum.id,
                            users:ctrl.submission.datum.users,
                            library_id: atc.id
                        });
                    }

                    ctrl.setView('view');
                });
        };

        ctrl.createDoc = function(){
            if( !ctrl.creating_doc_flag && !ctrl.isAdmin ){
                ctrl.creating_doc_flag = true;

                var atc = { name:'New document', type:'text', text:'' };
                library_model.add( atc.name, undefined, undefined, atc.type, undefined, atc.text ).then(function(id){
                    atc.id = id;
                    submission_docs_model.add( id, ctrl.item.datum.id, session.id ).then(function(){
                        ctrl.attachments.unshift( atc );
                        ctrl.creating_doc_flag = false;
                    });
                },function(){
                    ctrl.creating_doc_flag = false;
                });
            }
        };

        // --- SUBSCRIBE TO EVENTS --- //
        // Get websocket & listen to submission & document changes.
        websocket.get().then(function(socket){
            ctrl.socket = socket;
            socket.on('submission.changed', onSubmissionChanged );
            socket.on('submission.update_document', onDocumentUpdated );
        });
        // Listen to component scope destruction to clear events subscriptions.
        $scope.$on('$destroy',function(){
            if( ctrl.socket ){
                ctrl.socket.off('submission.changed', onSubmissionChanged );
                ctrl.socket.off('submission.update_document', onDocumentUpdated );
            }
            if( ctrl.watchUsersID ){
                users_status.unwatch( ctrl.watchUsersID );
            }
        });

        // --- SETTING SCOPE REFERENCES --- //
        $scope.onClose = onClose;
        $scope.onChange = load;

        // LOADING COMPONENT.
        load();

        // --- FUNCTIONS BELOW --- //

        function load( id ){

            var id = id || $scope.itemId,
                openStep = 1;

            ctrl.view = 'view';
            ctrl.item = undefined;
            ctrl.loading = true;
            ctrl.adminView = $scope.adminView;
            ctrl.isAdmin = puadmin_model.list[items_model.list[id].datum.page_id].datum.indexOf( session.id ) !== -1 || !!session.roles[1];

            ctrl.haveToConfirm = false;
            ctrl.document = undefined;

            if( ctrl.watchUsersID ){
                users_status.unwatch( ctrl.watchUsersID );
                ctrl.watchUsersID = undefined;
            }

            if( items_model.list[id].datum.parent_id ){
                openStep++;
                items_model.get([items_model.list[id].datum.parent_id]).then(loaded);
            }

            if( items_model.list[id].datum.library_id ){
                openStep++;
                tracker.register([{
                   event:'document.open',
                   date:(new Date()).toISOString(),
                   object:{id:items_model.list[id].datum.library_id}
                }]);
                library_model.get([items_model.list[id].datum.library_id]).then(function(){
                    ctrl.document = library_model.list[items_model.list[id].datum.library_id];

                    if( ctrl.document.datum.type === 'link' ){
                        try{
                            var properties = JSON.parse(ctrl.document.datum.text);
                            ctrl.document.datum.link_desc = properties.link_desc;
                            ctrl.document.datum.picture = properties.picture;
                        }catch(e){}
                    }

                    loaded();
                });
            }

            openStep++;
            ctrl.idx_sub = 0;
            item_submission_model.get([id], true).then(function(){

                ctrl.isGraderDisplayed = items_model.list[id].datum.is_grade_published;
                ctrl.isSubmitted = item_submission_model.list[id] && !!item_submission_model.list[id].datum.submit_date;

                ctrl.submission = item_submission_model.list[id];
                console.log(ctrl.submission);
                if(ctrl.submission && ctrl.submission.datum && ctrl.submission.datum.users && ctrl.submission.datum.users.length){
                    openStep++;
                    user_model.queue(ctrl.submission.datum.users).then(function(){
                        var organizations = ctrl.submission.datum.users.map(function(uid){
                           return user_model.list[uid].datum;
                        }).filter(function(u){
                            return u.organization_id !== null
                        }).map(function(u){
                            return u.organization_id;
                        });
                        page_model.queue(organizations).then(loaded);
                    });
                }

                if( types[items_model.list[id].datum.type].has_attachment ){
                    ctrl.attachments = [];

                    submission_docs_model.get([id]).then(function(){
                        if( submission_docs_model.list[id] && submission_docs_model.list[id].datum
                            && submission_docs_model.list[id].datum.length ){

                            library_model.get(submission_docs_model.list[id].datum).then(function(){
                                submission_docs_model.list[id].datum.forEach(function(library_id){
                                    ctrl.attachments.push(Object.assign({},library_model.list[library_id].datum));
                                });
                                loaded();
                            });

                        }else{
                            loaded();
                        }
                    });
                }else{
                    loaded();
                }
            });

            loaded();

            function loaded(){
                openStep--;
                if( !openStep ){
                    ctrl.isAvailable = isItemAvailable(id) || ctrl.adminView;
                    ctrl.loading = false;
                    ctrl.item = items_model.list[id];
                    // If it's a group assignment -> watch its users...
                    if( ctrl.item.datum.type === 'GA' && ctrl.submission && ctrl.submission.datum && ctrl.submission.users ){
                        ctrl.watchUsersID = users_status.watch( ctrl.submission.datum.users );
                    }
                }
            }
        }

        function onClose(){
            if( ctrl.haveToConfirm ){
                var deferred = $q.defer();

                modal_service.open({
                    reference: $event? $event.target : document.activeElement,
                    label: 'Close this panel ?',
                    template:'app/shared/custom_elements/course/item_panel_container/confirm_modal.template.html',
                    is_alert: true,
                    scope: {
                        desc: 'Unsaved changes will be lost',
                        confirm: function(){
                            deferred.resolve();
                            modal_service.close();
                        },
                        cancel: function(){
                            deferred.reject();
                            modal_service.close();
                        }
                    }
                });

                return $q.promise;
            }else{
                return $q.resolve();
            }
        }

        function isItemAvailable( id ){
            var parent = items_model.list[id].datum.parent_id;
            return items_model.list[id] && items_model.list[id].datum
                && ( items_model.list[id].datum.is_available === availableStates.available
                    || items_model.list[id].datum.type === 'SCT'
                    || items_model.list[id].datum.is_grade_published
                    || ( items_model.list[id].datum.is_available === availableStates.available_on_date
                        && ( !items_model.list[id].datum.start_date || (new Date(items_model.list[id].datum.start_date)).getTime() < Date.now() )
                        && ( !items_model.list[id].datum.end_date || (new Date(items_model.list[id].datum.end_date)).getTime() > Date.now() ) ) )
                && ( !items_model.list[id].datum.parent_id
                    || items_model.list[parent].datum.is_published) ;
        };

        function onSubmissionChanged( item_id ){
            if( ctrl.item && ctrl.item.datum && ctrl.item.datum.id == item_id ){
                submission_docs_model.get([item_id], true).then(function(){
                    var toGet = [],
                        currentIds = ctrl.attachments.map(function( atc ){ return ''+atc.id; });

                    if( submission_docs_model.list[item_id] && submission_docs_model.list[item_id].datum
                        && submission_docs_model.list[item_id].datum.length ){

                        submission_docs_model.list[item_id].datum.forEach(function(lid){
                            var idx = currentIds.indexOf( ''+lid );
                            if( idx !== -1 ){
                                currentIds.splice(idx,1);
                            }else{
                                toGet.push( lid );
                            }
                        });
                    }

                    // REMOVING FROM ATTACHMENTS
                    var i = ctrl.attachments.length - 1;
                    for(; i>=0; i-- ){
                        if( currentIds.indexOf( ctrl.attachments[i].id+'' ) !== -1 ){
                            ctrl.attachments.splice( i, 1 );
                        }
                    }

                    // GETTING NEW DOCUMENTS & ADDING TO ATTACHMENTS
                    library_model.get(toGet).then(function(){
                        toGet.forEach(function(library_id){
                            ctrl.attachments.unshift(Object.assign({},library_model.list[library_id].datum));
                        });
                    });
                });
            }
        };

        // WHEN DOCUMENT IS UPDATED -> UPDATE OUR DOCUMENT MODEL (name & text)
        function onDocumentUpdated( data ){
            if( ctrl.item.datum.id == data.item_id ){
                library_model.get([data.library_id], true).then(function(){
                    ctrl.attachments.forEach(function(atc){
                        if( atc.id == data.library_id ){
                            atc.name = library_model.list[atc.id].datum.name;
                            atc.text = library_model.list[atc.id].datum.text;
                        }
                    });
                });
            }
        };

        // CHECK IF ITEMS DRAGED ON DROPZONE ARE CORRECTS
        function checkDragAuthorization( event ){
            if( !ctrl.isAdmin &&event && event.dataTransfer && event.dataTransfer.items
                && event.dataTransfer.items.length ){

                var i = 0,l=event.dataTransfer.items.length, valid = true;
                for(;i<l;i++){
                    valid = valid && event.dataTransfer.items[i].kind === 'file';
                }

                return valid;
            }
            return false;
        }

        // WHEN DROP HAPPENS ON DROPZONE
        function onDrop( event ){
            ctrl.addAttachments( event.dataTransfer.files );
        }

        // REMOVE ATTACHMENT
        function removeAttachment( attachment, $event ){
            var idx = ctrl.attachments.indexOf( attachment );
            if( idx !== -1 ){
                modal_service.open({
                    reference: $event.target,
                    label: 'Delete this attachment',
                    template:'app/shared/elements/modal/cancel_modal.html',
                    is_alert: true,
                    scope: {
                        cancel: function(){
                            modal_service.close();
                            ctrl.attachments.splice( idx, 1);

                            if( attachment.id ){
                                submission_docs_model.remove( attachment.id, ctrl.item.datum.id );
                            }
                        }
                    }
                });
            }
        }

        // ADD ATTACHMENTS
        function addAttachments( files ){
            if( files && files.length && !ctrl.isAdmin ){

                Array.prototype.forEach.call(files,function( file ){
                    var upload = upload_service.upload('token', file, file.name),
                        atc = {
                            progression: 0,
                            file: file,
                            upload: upload,
                            name: file.name,
                            type: file.type
                        };

                    upload.promise.then(function(d){
                        atc.token = d.token;
                        library_model.add( atc.name, undefined, atc.token, atc.type ).then(function(id){
                            atc.id = id;
                            submission_docs_model.add( id, ctrl.item.datum.id, session.id );
                        });

                    },function(){
                        atc.upload_error = true;
                    },function( evt ){
                        atc.progression = Math.round(1000 * evt.loaded / evt.total) / 10;
                    });

                    ctrl.attachments.push(atc);
                });

                $scope.$evalAsync();
            }
            else if(ctrl.isAdmin){
                notifier_service.add({
                    type:'error',
                    message: "As an admin, you can't upload file in this submission."
                });
            }
        };
    }
]);

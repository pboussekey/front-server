angular.module('welcome')
    .factory('welcome_service',[ 'first_step', 'keyword_step', 'connection_step', 'avatar_step', 'address_step',
            'session', 'modal_service',   'filters_functions', 'user_model',
        function(first_step, keyword_step, connection_step, avatar_step, address_step,
            session, modal_service,   filters_functions, user_model){

            var service = {
                session : session,
                users : user_model.list,
                available_steps : {
                    welcome : first_step,
                    keywords : keyword_step,
                    connections : connection_step,
                    avatar : avatar_step,
                    address : address_step
                },
                steps : [],
                changeState : function(index){
                    if(service.steps[index]){
                        service.current_index = index;
                        service.current_step = service.steps[index];
                        service.current = service.steps[index].scope;
                        service.loading = true;
                        if(service.steps[index].fill){

                            return service.steps[index].fill().then(function(){
                                service.loading = false;
                                service.steps[index].initialized = true;
                                if(!modal_service.opened){
                                    modal_service.open( {
                                        template: 'app/components/welcome/tpl/welcome.template.html',
                                        scope: service,
                                        blocked : true,
                                        reference: document.activeElement,
                                        onclose : service.onClose
                                    });
                                }
                            });
                        }
                        else if(service.steps[index]){
                            service.loading = false;
                            service.steps[index].initialized = true;
                            if(!modal_service.opened){
                                modal_service.open( {
                                    template: 'app/components/welcome/tpl/welcome.template.html',
                                    scope: service,
                                    blocked : true,
                                    reference: document.activeElement,
                                    onclose : service.onClose
                                });
                            }
                        }
                    }
                    else{
                        modal_service.close();
                    }
                },
                nextStep : function(){
                    service.changeState(service.current_index + 1);
                },
                init : function(){
                    service.steps = [];
                    var steps = Object.keys(service.available_steps).length;
                    angular.forEach(service.available_steps, function(step){
                        step.isCompleted().then(function(done){
                            if(!done){
                                service.steps.push(step);
                            }
                            onLoad();
                        }, onLoad);
                    });
                    function onLoad(){
                        steps--;
                        if((service.steps.length > 0 && steps === 0) || service.steps.length === 3){
                            service.steps.sort(function(s1, s2){
                               return s1.priority < s2.priority;
                            });
                            service.changeState(0);
                        }
                    }


                },
                onClose : function(){
                    profile.closeWelcome(service.delay);
                }
            };
            return service;
        }
    ]);

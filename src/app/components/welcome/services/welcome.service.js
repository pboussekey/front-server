angular.module('welcome')
    .factory('welcome_service',[ 'FirstStep', 'KeywordStep', 'ConnectionStep', 'AvatarStep', 'AddressStep',
            'session', 'modal_service',   'filters_functions', 'user_model', 'tags_constants', 'profile', '$timeout',
        function(FirstStep, KeywordStep, ConnectionStep, AvatarStep, AddressStep,
            session, modal_service,   filters_functions, user_model, tags_constants, profile, $timeout){

            var service = {
                session : session,
                users : user_model.list,
                available_steps : [
                    new FirstStep(),
                    new AvatarStep(),
                    new KeywordStep(tags_constants.categories.skill),
                    new KeywordStep(tags_constants.categories.career),
                    new KeywordStep(tags_constants.categories.hobby),
                    new KeywordStep(tags_constants.categories.language),
                    new AddressStep(),
                    new ConnectionStep()
                ],
                steps : [],
                changeState : function(index){
                    if(service.steps[index]){
                        service.loading = true;
                        if(service.steps[index].fill){
                            return service.steps[index].fill().then(function(){
                                service.current_index = index;
                                service.current_step = service.steps[index];
                                service.current = service.steps[index].scope;
                                service.steps[index].initialized = true;
                                service.loading = false; 
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
                            service.current_index = index;
                            service.current_step = service.steps[index];
                            service.current = service.steps[index].scope;
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

                    service.steps = service.available_steps.slice()
                        .filter(function(step){
                            return step.isCompleted().then(function(completed){
                                return !completed;
                        });
                    });
                    service.changeState(0);
                },
                onClose : function(){
                    profile.closeWelcome(service.delay);
                }
            };
            return service;
        }
    ]);

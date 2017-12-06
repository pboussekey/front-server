angular.module('admin').controller('admin_controller',
    ['$state', 'mails', 'circles', 'session', 'community_service', 'page_model', 
        function($state, mails, circles, session, community_service, page_model){
        var ctrl = this;
        if(!session.roles[1]){
            $state.go('lms.dashboard');
        }
        this.breadcrumb = [{ text : 'Admin' }];
        document.title = 'TWIC - Administration';
        this.categories = {
            activities : {
                    name : "Activities",
                    key : "activities",
                    state : "lms.admin.activities"
            },
            pages : {
                name : "Pages",
                key : "pages",
                state : "lms.admin.pages"
            },
            mail : {
                name : "Mails",
                key : "mail",
                state : "lms.admin.mails",
                fill : function(){
                    mails.getList().then(function(mails){
                        mails.results.forEach(function(m, i){
                            m.id = i + 1;
                        });
                        ctrl.mails =  mails.results;
                    });
                },
                
                edit : function(mail){
                    ctrl.edited_mail = angular.copy(mail);
                },
                save : function(m){
                    mails.save(m).then(function(){
                        ctrl.edited_mail = null;
                        ctrl.category.fill(); 
                    });
                }
            },
            analytics : {
                name : "Analytics",
                key : "analytics",
                state : "lms.admin.analytics"
            },
             circle : {
                name : "Circles",
                 key : "circle",
                 state : "lms.admin.circles",
                 fill : function(){
                     circles.getList().then(function(c){
                         ctrl.circles = c;
                     });
                 }, 
                edit : function(c){
                    if(c.id){
                        circles.get(c.id).then(function(circle){
                            ctrl.edited_circle = angular.copy(circle);
                        });
                    }
                    else{
                        ctrl.edited_circle = c;
                    }
                },
                delete : function(c){
                    circles.delete(c.id).then(function(){
                        ctrl.category.fill(); 
                    });
                },
                save : function(c){
                    circles.save(c).then(function(id){
                        ctrl.edited_circle = null;
                        if(!c.id){
                            c.id = id;
                            circles.addOrganization(id, c.organizations.map(function(o){ return o.organization_id; })).then(function(){
                                ctrl.category.fill(); 
                            });
                        }
                        else{
                            ctrl.category.fill(); 
                        }
                        
                    });
                },
                searchOrganization : function(search, filter){
                    ctrl.loading = true;
                    return community_service.pages( search, filter.p, filter.n, 'organization', null, 
                        ctrl.edited_circle.organizations.map(function(o){ return o.organization_id; })).then(function(r){
                        return page_model.queue(r.list).then(function(){
                            return r.list.map(function(id){
                                ctrl.loading = false;
                                return page_model.list[id].datum;
                            });
                        });
                    });
                },
                addOrganization : function(o){
                    if(!ctrl.edited_circle.organizations.filter(function(org){ return org === o; }).length){
                        if(ctrl.edited_circle.id){
                            circles.addOrganization(ctrl.edited_circle.id, o.id).then(function(){
                                ctrl.edited_circle.organizations.push({ circle_id : ctrl.edited_circle.id, organization_id : o.id });
                            });
                        }
                        else{
                            ctrl.edited_circle.organizations.push({  organization_id : o.id });
                        }
                    }
                },
                removeOrganization : function(o){
                    if(ctrl.edited_circle.id){
                        circles.removeOrganization(o.circle_id, o.organization_id).then(function(){
                            ctrl.edited_circle.organizations = ctrl.edited_circle.organizations.filter(function(org){ return org !== o; });
                        });
                    }
                    else{
                        ctrl.edited_circle.organizations = ctrl.edited_circle.organizations.filter(function(org){ return org !== o; });
                    }
                }
             }
        };
        ctrl.category = ctrl.categories[Object.keys(ctrl.categories).filter(function(category){
            return ctrl.categories[category].state === $state.current.name;
        })[0]];
        if(ctrl.category.fill){
            ctrl.category.fill();
        }
    }
]);

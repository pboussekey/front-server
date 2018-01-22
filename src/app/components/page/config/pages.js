angular.module('page')
    .factory('pages_config',['session', '$state', function(session, $state){
        var service =
            {
                event :{
                    fields : {
                        background : {
                            displayed : true,
                            default : null
                        },
                        date : {
                            displayed : true
                        },
                        logo : {
                            displayed : false,
                            icon : 'i-events'
                        },
                        start_date : {
                            displayed : true,
                            default : null
                        },
                        end_date : {
                            displayed : true,
                            default : null
                        },
                        address : {
                            displayed : true,
                            default : null
                        },
                        title : {
                            displayed : true,
                            default : ""
                        },
                        description : {
                            displayed : true,
                            default : ""
                        },
                        tags : {
                            displayed : true,
                            default : []
                        },
                        website : {
                            displayed : true,
                            default : ""
                        },
                        confidentiality : {
                            displayed : true,
                            default : 0
                        },
                        admission : {
                            displayed : false,
                            default : 'free'
                        },
                        users : {
                            displayed : true,
                            default : []
                        },
                        import : {
                            displayed : [1]
                        },
                        channel : {
                            displayed : true
                        },
                        role : {
                            displayed : true
                        }
                    },
                    tabs : {
                        activity : { name : "Activity", href : 'lms.page.timeline' },
                        users : { name : "Participants", href : 'lms.page.users', actions : true },
                        resources : { name : "Resources", href : 'lms.page.resources', actions : true }
                    }

                },
                group : {
                    fields : {
                        background : {
                             displayed : true,
                             default : null
                        },
                        logo : {
                             displayed : true,
                             icon : 'i-groups'
                        },
                        title : {
                            displayed : true,
                            default : ""
                        },
                        description : {
                            displayed : true,
                            default : ""
                        },
                        tags : {
                            displayed : true,
                            default : []
                        },
                        confidentiality : {
                            displayed : true,
                            default : 0
                        },
                        admission : {
                            displayed : false,
                            default : 'free'
                        },
                        users : {
                            displayed : true,
                            default : []
                        },
                        import : {
                            displayed : [1]
                        },
                        channel : {
                            displayed : true
                        },
                        role : {
                            displayed : true
                        }
                    },
                    tabs : {
                        activity : { name : "Activity", href : 'lms.page.timeline' },
                        users : { name : "Participants", href : 'lms.page.users', actions : true },
                        resources : { name : "Resources", href : 'lms.page.resources', actions : true }
                    }
                },
                course : {
                    fields : {
                        background : {
                             displayed : true,
                             default : null
                        },
                        logo : {
                            displayed : true,
                            icon : 'i-courses',
                            editable : true,
                            default : null,
                            label : "Picture"
                        },
                        organization : {
                            displayed : true
                        },
                        title : {
                            displayed : true,
                            default : ""
                        },
                        description : {
                            displayed : true,
                            default : ""
                        },
                        website : {
                            displayed : true,
                            default : ""
                        },
                        tags : {
                            displayed : true,
                            default : []
                        },
                        confidentiality : {
                            displayed : false,
                            default : 1
                        },
                        admission : {
                            displayed : false,
                            default : 'free'
                        },
                        is_published : {
                            displayed : true,
                            default : 0
                        },
                        channel : {
                            displayed : true
                        },
                        users : {
                            displayed : true,
                            default : []
                        },
                        import : {
                            displayed : true
                        },
                        instructors:{
                            displayed: true
                        },
                        role : {
                            displayed : true
                        }
                    },
                    tabs : {
                        activity : { name : "Activity", href : 'lms.page.timeline' },
                        content : { name : "Content", href : 'lms.page.content' },
                        resources : { name : "Materials", href : 'lms.page.resources', actions : true },
                        users : { name : "Participants", href : 'lms.page.users', actions : true },
                        //analytics : { name : "Analytics", href : 'lms.page.analytics', actions : true, roles : ['admin'] }
                    }
                },
                organization : {
                    fields : {
                        background : {
                             displayed : true,
                             default : null
                        },
                        logo : {
                            displayed : true,
                            editable : true,
                            icon : 'i-schools',
                            default : null,
                            label : "Logo"
                        },
                        title : {
                            displayed : true,
                            default : ""
                        },
                        description : {
                            displayed : true,
                            default : ""
                        },
                        tags : {
                            displayed : true,
                            default : []
                        },
                        address : {
                            displayed : true,
                            default : null
                        },
                        confidentiality : {
                            displayed : false,
                            default : 0
                        },
                        admission : {
                            displayed : false,
                            default : 'free'
                        },
                        channel : {
                            displayed : true
                        },
                        users : {
                            displayed : false,
                            default : []
                        },
                        import : {
                            displayed : true
                        }
                    },
                    tabs : {
                        activity : { name : "Activity", href : 'lms.page.timeline' },
                        users : { name : "People", href : 'lms.page.users', actions : true },
                        resources : { name : "Resources", href : 'lms.page.resources', actions : true },
                        membership : { name : "Membership", href : 'lms.page.membership' },
                        members : { name : "Institutions", href : 'lms.page.members' },
                        community : { name : "Community", href : 'lms.page.community' },
                        grades : { name : "Grades", href : 'lms.page.grades', actions : true, roles : ['admin'] },
                        analytics : { name : "Analytics", href : 'lms.page.analytics', actions : true, roles : ['admin'] },
                        custom : { name : "Custom", href : 'lms.page.custom', roles : [1] }
                    }



                },
                getTabs : function(type, editable){
                    var page_type = service[type];
                    var tabs = {};
                    Object.keys(page_type.tabs).forEach(function(key){
                        var tab = page_type.tabs[key];
                        if(session.roles && session.roles[1] || !tab.roles || tab.roles.some(function(role_id){
                            return session.roles && session.roles[role_id] !== undefined || (role_id === 'admin' && editable);
                        })){
                            tabs[key] = tab;
                        }
                    });
                    return tabs;
                },
                getLink : function(tab, page){
                    return $state.href(tab.href, Object.assign({ id : page.id,  type : page.type }, tab.params));
                },
                isDisplayed : function(field){
                    if(!field || !field.displayed){
                        return false;
                    }
                    if(!Array.isArray(field.displayed)){
                        return field.displayed;
                    }
                    return field.displayed.some(function(role_id){
                        return session.roles && session.roles[role_id] !== undefined;
                    });
                },
                getPage : function(type){
                    var page_type = service[type].fields;
                    var page = {};
                    Object.keys(page_type).forEach(function(key){
                        if(page_type[key].default !== undefined){
                            page[key] = page_type[key].default;
                        }
                    });
                    return page;
                }
            };
        return service;

    }]);

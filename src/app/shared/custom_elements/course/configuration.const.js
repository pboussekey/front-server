angular.module('customElements')
    .constant('courseConfiguration',{
        available_states:{
            available: 1,
            not_available: 2,
            available_on_date: 3
        },
        participants_types:{
            all: 'all',
            user: 'user',
            group: 'group'
        },
        typeOptions:{
            A:{
                specific: ['text'],
                optional:['description'],
                create:'item_panel.create_assignment', update:'item_panel.update_assignment',
                name:'item_types.assignment', icon:'i-assignment-outline', sm_icon: 'i-assignment',
            },
            GA:{
                specific: ['text', 'groups'],
                optional:['description'],
                create:'item_panel.create_grp_assignment', update:'item_panel.update_grp_assignment',
                name:'item_types.group_assignment', icon:'i-group-assignment-outline', sm_icon: 'i-assignment',
            },
            QUIZ:{
                specific: ['quiz'],
                optional:[],
                create:'item_panel.create_quiz',update:'item_panel.update_quiz',
                name:'item_types.quiz', icon:'i-quiz-outline', sm_icon: 'i-quiz',
            },
            PG:{
                specific: ['text'],
                optional:['points','description','due_date'],
                create:'item_panel.create_page', update:'item_panel.update_page',
                name:'item_types.page', icon:'i-page-outline', sm_icon: 'i-page',
            },
            DISC:{
                specific: ['post'],
                optional:['description'],
                create:'item_panel.create_discussion', update:'item_panel.update_discussion',
                name:'item_types.discussion', icon:'i-discussion-outline', sm_icon: 'i-groups',
            },
            MEDIA:{
                specific: ['file'],
                optional:['points','due_date'],
                create:'item_panel.create_media', update:'item_panel.update_media',
                name:'item_types.media', icon:'i-media-outline', sm_icon: 'i-media',
            }/*,
            LC:{
                specific: ['members'],
                optional:['points','due_date'],
                create:'item_panel.create_lc', update:'item_panel.update_lc',
                name:'item_types.liveclass', icon:'i-webcam-outline', sm_icon: 'i-camera',
            }*/
        }
    });

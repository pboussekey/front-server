angular.module('API')
    .constant('items',{
        available_states:{
            available: 1,
            not_available: 2,
            available_on_date: 3
        },
        participants_types:{
            all: 'all',
            user: 'user',
            group: 'group'
        }
    });
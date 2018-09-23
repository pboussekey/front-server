angular.module('API')
    .constant('tags_constants',{
        categories : {
            SKILL : 'skill',
            CAREER : 'career',
            HOBBY : 'hobby',
            LANGUAGE : 'language'
         },
         labels : {
            SKILL : 'Skills',
            CAREER : 'Career Interests',
            HOBBY : 'Hobbies and Activities',
            LANGUAGE : 'Languages'
         },
         icons : {
            SKILL : 'i-star',
            CAREER : 'i-xp',
            HOBBY : 'i-heart',
            LANGUAGE : 'i-globe'
         },
         suggestions : {
            SKILL : ['Project Management', 'Digital Marketing', 'Business Development', 'Leadership'],
            CAREER : ['Technology', 'Non-Profit', 'Investment Banking', 'Social Entrepreneurship'],
            HOBBY : ['Traveling', 'Startup Mentoring', 'Fitness Yoga'],
            LANGUAGE : ['English', 'Spanish', 'Chinese']
         },
         placeholders : {
            SKILL : 'Press ENTER to add a new skill',
            CAREER : 'Press ENTER to add a new career interest',
            HOBBY : 'Press ENTER to add a new activity or interest',
            LANGUAGE : 'Add a new language'
         },
    });

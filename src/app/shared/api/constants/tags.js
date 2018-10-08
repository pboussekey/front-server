angular.module('API')
    .constant('tags_constants',{
        categories : {
            skill : 'skill',
            career : 'career',
            hobby : 'hobby',
            language : 'language'
         },
         labels : {
            skill : 'Skills',
            career : 'Career Interests',
            hobby : 'Hobbies and Activities',
            language : 'Languages'
         },
         icons : {
            skill : 'i-star',
            career : 'i-xp',
            hobby : 'i-heart',
            language : 'i-globe'
         },
         suggestions : {
            skill : ['Project Management', 'Digital Marketing', 'Business Development','Leadership'],
            career : ['Technology', 'Non-Profit', 'Investment Banking', 'Social Entrepreneurship'],
            hobby : ['Traveling', 'Startup Mentoring', 'Fitness Yoga'],
            language : ['English', 'Spanish', 'Chinese']
         },
         placeholders : {
            skill : 'Press ENTER to add a new skill',
            career : 'Press ENTER to add a new career interest',
            hobby : 'Press ENTER to add a new activity or interest',
            language : 'Add a new language'
         },
    });

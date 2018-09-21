angular.module('API')
    .constant('tags_constants',{
        categories : {
            SKILL : 'skill',
            CAREER : 'career',
            HOBBY : 'hobby',
            LANGUAGE : 'language'
         },
         labels : {
            SKILL : 'skill',
            CAREER : 'career expertise',
            HOBBY : 'hobby',
            LANGUAGE : 'language'
         },
         icons : {
            SKILL : 'i-star',
            CAREER : 'i-xp',
            HOBBY : 'i-heart',
            LANGUAGE : 'i-globe'
         },
         placeholders : {
            SKILL : 'Add Skills (ex: Project Management ; Digital Marketing; Business Development; Leadership)',
            CAREER : 'Add Career Interests (ex: Technology; Non-Profit; Investment Banking; Social Entrepreneurship)  ',
            HOBBY : 'Add Hobbies, Activities and Interests (ex: Traveling; Startup Mentoring; Fitness Yoga)',
            LANGUAGE : 'Add Languages (ex: English; Spanish; Chinese Mandarin) '
         },
    });

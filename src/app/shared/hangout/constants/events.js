angular.module('HANGOUT').constant('hgt_events',{

   //TOKBOX EVENTS
    tb_stream_created: 'tb_stream_created',
    tb_stream_destroyed: 'tb_stream_destroyed',
    tb_stream_published : 'tb_stream_published',
    tb_session_ended : 'tb_session_ended',
    tb_publishing_error : 'tb_publishing_error',
    
    //FIREBASE EVENTS    
    fb_request_received : 'fb_request_received',
    fb_request_removed : 'fb_request_removed',
    fb_request_declined : 'fb_request_declined',
    fb_request_accepted : 'fb_request_accepted',
    fb_connected_changed : 'fb_connected_changed',
    fb_left : 'fb_left',
    fb_joined : 'fb_joined',
    fb_current_hangout_changed : 'fb_current_hangout_changed',
    
    //HANGOUT EVENTS
    hgt_launched : 'hgt_launched',
    hgt_left : 'hgt_left',
    hgt_not_available : 'hgt_not_available',
    hgt_stream_added : 'hgt_stream_added',
    hgt_stream_removed : 'hgt_stream_removed',
    hgt_layout_changed : 'hgt_layout_changed',
    hgt_user_connected:  'hgt_user_connected',
    hgt_user_disconnected:  'hgt_user_disconnected',
    
    
    screen_requested:           'hgt_screen_requested',
    camera_requested:           'hgt_camera_requested',
    microphone_requested:       'hgt_microphone_requested',

    request_camera:             'hgt_request_camera',
    request_microphone:         'hgt_request_microphone',
    request_screen:             'hgt_request_screen',

    ask_camera_auth:            'hgt_camera_authorization',
    ask_microphone_auth:        'hgt_microphone_authorization',
    ask_screen_auth:            'hgt_screen_authorization',

    self_ask_camera_auth:       'hgt_ask_camera_auth',
    self_ask_screen_auth:       'hgt_ask_screen_auth',
    self_ask_microphone_auth:    'hgt_ask_microphone_auth',

    cancel_camera_auth:         'hgt_cancel_camera_authorization',
    cancel_microphone_auth:     'hgt_cancel_microphone_authorization',
    cancel_screen_auth:         'hgt_cancel_screen_authorization',
    
    hgt_publishing_camera_error : 'hgt_publishing_camera_error',
    hgt_publishing_microphone_error : 'hgt_publishing_microphone_error'
});

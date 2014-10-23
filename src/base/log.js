/**
* view baidu fis 
*/
'use strict';

log.L_ALL    = 0x01111;
log.L_NOTIC  = 0x00001;
log.L_DEBUG  = 0x00010;
log.L_WARNI  = 0x00100;
log.L_ERROR  = 0x01000;
log.L_NORMAL = 0x01101;

log.level = log.L_DEBUG; //调试时，修改这个东东
log.throw = false;
log.alert = false;

log.now = function(withoutMilliseconds){
    var d = new Date(), str;
    str = [
        d.getHours(),
        d.getMinutes(),
        d.getSeconds()
    ].join(':').replace(/\b\d\b/g, '0$&');
    if(!withoutMilliseconds){
        str += '.' + ('00' + d.getMilliseconds()).substr(-4);
    }
    return str;
};



log.debug = function(msg){
    log('debug', log.now() + ' ' + msg, log.L_DEBUG);
};

log.notice = function(msg){
    log('notice', msg, log.L_NOTIC);
};

log.warning = function(msg){
    log('warning', msg, log.L_WARNI);
};

log.error = function(err){
    if(!(err instanceof Error)){
        err = new Error(err.message || err);
    }
    if(log.alert){
        err.message += '\u0007';
    }
    if(log.throw){
        throw err
    } else {
        log('error', err.message, log.L_ERROR);
        process.exit(1);
    }
};

log.on = {
    any     : function(type, msg){},
    debug   : function(msg){ process.stdout.write('\n [DEBUG] ' + msg + '\n'); },
    notice  : function(msg){ process.stdout.write('\n [NOTIC] ' + msg + '\n'); },
    warning : function(msg){ process.stdout.write('\n [WARNI] ' + msg + '\n'); },
    error   : function(msg){ process.stdout.write('\n [ERROR] ' + msg + '\n'); }
};

function log(type, msg, code){
    code = code || 0;
    if((log.level & code) > 0){
        var listener = log.on[type];
        if(listener){
            listener(msg);
        }
        log.on.any(type, msg);
    }
}

module.exports = log;
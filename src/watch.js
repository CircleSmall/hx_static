/*!
 * fs watch 子目录的监听与跨平台支持（让 windows 的行为与 linux 保持一致）
 * https://github.com/aui/tmodjs
 * Released under the MIT, BSD, and GPL Licenses
 */

'use strict';

var stdout = require('./stdout.js');
var chokidar = require('chokidar');


var safePathReg = /[\\\/][_\-.\s\w]+$/i;
var selfPathReg = /tmp/i;//排除掉windows的.tmp文件

var watch = function(parent, callback, filter) {

    var timer = -1;
    function listener(path) {
        console.log(path)
        if (safePathReg.test(path) && !selfPathReg.test(path)) {
            clearTimeout(timer);
            timer = setTimeout(function() {
                callback(path);
            }, 500);
        }
    }

    chokidar.watch(parent, {
        ignored: function(path) {
            //目前没有过滤器
            return false
        },
        persistent : true
    })
    .on('add', listener)
    .on('change', listener)
    .on('unlink', listener)
    .on('error', function(err){});

};


/**
 * @param   {String}    要监听的目录
 * @param   {Function}  文件、目录改变后的回调函数
 * @param   {Function}  过滤器（可选）
 */
module.exports = function(dir, callback, filter) {

    // 排除“.”、“_”开头或者非英文命名的目录
    var FILTER_RE = /[^\w\.\-$]/;
    filter = filter || function(name) {
        return FILTER_RE.test(name);//不符合要求的为false
    };
    watch(dir, callback, filter);
};
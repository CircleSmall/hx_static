var fs = require('fs');
var path = require('path');
_exists = fs.existsSync || pth.existsSync;
// var path = require('path');

// var list = fs.readdirSync('./argv/');

// list.forEach(function(item){
// 	// console.log(fs.realpath(item));
// 	// console.log(path.dirname(fs.realpath(item)));
// });

// require.extensions['.tpl'] = function (module, filename) {
// 	module.exports = fs.readFileSync(filename, 'utf8');
// };

// console.log(require('./header.tpl'))

var find = function(rPath){
    var list = [],
        path = realpath(rPath);
    if(path){
        var stat = fs.statSync(path);
        if(stat.isDirectory()){
            fs.readdirSync(path).forEach(function(p){
                if(p[0] != '.') {
                    list = list.concat(find(path + '/' + p));
                }
            });
        } else if(true) {
            list.push(path);
        }
    } else {
        console.log('unable to find [' + rPath + ']: No such file or directory.');
    }
    return list.sort();
};

var realpath = function(path){
    if(path && _exists(path)){
        path = fs.realpathSync(path);
        if(true){
            path = path.replace(/\\/g, '/');
        }
        if(path !== '/'){
            path = path.replace(/\/$/, '');
        }
        return path;
    } else {
        return false;
    }
};

console.log(find("../"));
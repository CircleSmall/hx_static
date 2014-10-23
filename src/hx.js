'use strict';

var watch = require('./watch.js');
var defaults = require('./defaults.js');
var stdout = require('./stdout.js');
var path = require('./path.js');
var mu = require('mustache');
var log = require('./base/log.js');
var util = require('./base/utils.js');


var fs = require('fs');
// var path = require('path');
// var vm = require('vm');
var events = require('events');
// var crypto = require('crypto');
// var child_process = require('child_process');
// var exec = child_process.exec;

//让require可以读取.tpl文本
require.extensions['.tpl'] = function(module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

var hx = function(base, options) {
    // 模板项目路径
    this.base = path.resolve(base);

    // 项目配置选项
    this.options = options = this.getConfig(options);

    // 输出路径
    this.output = path.resolve(this.base, options.output);

    //数据路径
    this.datapath = path.resolve(this.base, options.data);

    //模板路径
    this.templatepath = path.resolve(this.base, options.template);

    //开发文件路径
    this.srcpath = path.resolve(this.base, options.src)

    //数据对象
    this.data = {};

    //模板对象
    this.template = {};

    // 初始化 watch 事件，修复 watch 的跨平台的 BUG
    this.on('newListener', function(event, listener) {

        if ( /*watch && */ event === 'watch') {

            this.log('\n[green]Waiting...[/green]\n\n');

            watch(this.base, function(path) {
                this.emit('watch', path);
            }.bind(this), function(folderPath) {
                return this.filter(folderPath) && folderPath !== this.output;
            }.bind(this), fs);

            //watch = null;
        }

    });

};

// 默认配置
// 用户配置将保存到模板根目录 package.json 文件中
hx.defaults = defaults;

hx.prototype = {
    __proto__: events.EventEmitter.prototype, //修改原型和事件的一致

    // 获取用户配置
    getConfig: function(options) {

        return options;
    },

    init: function() {
        log.debug("项目初始化开始");
        this.getTemplate(this.templatepath);
        this.getData(this.datapath);
        this.compile();
        log.debug("项目初始化结束");
    },

    watch: function() {
        var me = this;
        // 监控模板目录
        me.on('watch', function(filename) {
            //操作整个目录
            var dir = path.dirname(filename)
            if (dir == me.srcpath) {
                //如果是开发文件
            } else if (dir == me.templatepath) {
                //如果是模板文件
                me.getTemplate(dir);
            } else if (dir == me.datapath) {
                //如果是数据文件
                me.getData(dir);
            }
            me.compile(); //无论怎样，都要编译一下
        }, me.filter);
    },

    /* 编译文件 */
    compile: function(dir) {
        var me = this;
        util.sync(this.srcpath, this.output, function(ext, content) {
            if(ext == ".html") {
                var template = content.toString();//mustcahe 模板
                var p = me.template; //子模板
                var data = me.data; //数据
                var result = mu.render(template, data, p);
                return result;
            }
            return false;
        });

    },

    /* 获取数据 */
    getData: function(dir) {
        //数据时全局数据，所有的子模板共用同一个数据，每个数据文件的文件名是该数据的命名空间
        return this.data = this.convertDir(dir);
    },

    /* 获取子模板 */
    getTemplate: function(dir) {
        //获取所有的子模板
        return this.template = this.convertDir(dir);
    },

    /**
     * 将目录转换为js对象(文件名为key, 文件内容为value字符串)
     * @param {dir} 目录名
     * return obj
     */
    convertDir: function(dir) {
        var me = this;
        me.createDir(dir);
        var data = {};
        var dirList = fs.readdirSync(dir);
        dirList.forEach(function(item) {
            // if (error) {
            // 	return;
            // }
            if (fs.statSync(path.join(dir, item)).isDirectory()) {
                //现在还不支持目录嵌套
                me.convertDir(path.join(dir, item));
            } else {
                var p = path.resolve(dir, item);
                p = p.replace(/\\/g, '/');
                var key = path.basename(p, path.extname(p));
                data[key] = require(p);
                delete require.cache[p];
            }
            // else if (me.filterBasename(item) && me.filterExtname(item)) {
            // error = !me._compile(path.join(dir, item));
            // TODO： 这里要有一个过滤器
            // }

        });
        return data;
    },

    /**
     * 打印日志
     * @param   {String}    消息
     */
    log: function(message) {
        stdout(message);
    },

    //写入文件
    writeFile: function(file, data) {
        var dir = path.dirname(file);
        this.createDir(dir);
        fs.writeFileSync(file, data, 'utf-8');
    },

    /**
     * 创建目录
     * @param dir 目录名
     */
    createDir: function(dir) {
        if (!fs.existsSync(dir)) {
            var toMakeUpPath = [];
            //创建目录
            while (!fs.existsSync(dir)) {
                toMakeUpPath.unshift(dir);
                dir = path.dirname(dir);
            }
            toMakeUpPath.forEach(function(pathItem) {
                fs.mkdirSync(pathItem);
            });
        }
    },

    /**
     * 文件与路径筛选器
     * @param   {String}    绝对路径
     * @return  {Boolean}
     */
    filter: function(file) {

        if (fs.existsSync(file)) {
            var stat = fs.statSync(file);
            if (stat.isDirectory()) {

                var dirs = file.split(path.sep);
                var basedir = dirs[dirs.length - 1];

                return this.filterBasename(basedir) ? true : false;

            } else {

                return this.filterBasename(path.basename(file)) && this.filterExtname(path.extname(file));
            }

        } else {
            return false;
        }
    },
    
    /**
     * 名称筛选器
     * @param   {String}
     * @return  {Boolean}
     */
    filterBasename: function(name) {
        // 英文、数字、点、中划线、下划线的组合，且不能以点开头
        var FILTER_RE = /^\.|[^\w\.\-$]/;

        return !FILTER_RE.test(name); //符合要求的为true
    },

    /**
     * 后缀名筛选器
     * @param   {String}
     * @return  {Boolean}
     */
    filterExtname: function(name) {
        // 支持的后缀名
        var EXTNAME_RE = /\.(html|htm|tpl)$/i;
        return EXTNAME_RE.test(name); //符合要求的为true
    }
}

module.exports = hx;

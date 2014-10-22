"use strict"

// 模板字符串
var source = '';

var readError = null;
var compileError = null;
var writeError = null;

// 目标路径
var target = file
    .replace(path.extname(file), '.js')
    .replace(this.base, this.output);

var mod = this._getCache(file);
var modObject = {};
var metadata = {};
var count = 0;

var isDebug = this.options.debug;
var isCacheDir = this.options.combo;


try {
    source = fs.readFileSync(file, this.options.charset);
} catch (e) {
    readError = e;
}


var newMd5 = this._getMd5(source + JSON.stringify(this['package.json']));

// 如果开启了合并，编译后的文件使用缓存目录保存
if (isCacheDir) {
    target = target.replace(this.output, path.join(this.output, CACHE_DIR));
}


// 尝试从文件中读取上一次编译的结果
if (!mod && fs.existsSync(target)) {
    mod = this._fsRead(target, this.options.charset);
}


// 获取缓存的元数据
if (mod) {
    metadata = this._getMetadata(mod) || {};
    count = metadata.version || 0;
}


// 检查是否需要编译
var modified = !this.options.cache || !mod // 从来没有编译过
    || metadata.debug // 上个版本为调试版
    || isDebug // 当前配置为调试版
    || newMd5 !== metadata.md5; // 模板已经发生了修改（包括配置文件）


// 获取模板 ID
var id = this._toId(file);


// 广播：模板加载事件
this.emit('load', readError, {

    // 模板 ID
    id: id,

    // 模板是否需要重新编译
    modified: modified,

    // 原始文件路径
    sourceFile: file,

    // 模板源代码
    source: source,

    // 输出路径
    outputFile: target

});


if (readError) {
    return;
}


try {

    // 编译模板
    if (modified) {
        modObject = this.template.AOTcompile(source, {
            filename: id,
            alias: this.options.alias,
            type: this.options.type,
            compress: this.options.compress,
            escape: this.options.escape,
            runtime: this.options.runtime,
            debug: isDebug
        });
        mod = modObject.code;
    }

} catch (e) {
    compileError = e;
}


// 不输出的情况：遇到错误 || 文件或配置没有更新
if (!compileError && modified) {

    count++;

    mod = this._setMetadata(mod, {
        debug: isDebug,
        version: count,
        md5: newMd5
    });


    try {
        this._fsMkdir(path.dirname(target)); //////
        fs.writeFileSync(target, mod, this.options.charset);
    } catch (e) {
        writeError = e;
    }


    if (!isCacheDir && !writeError) {
        if (isDebug || !this.options.minify) {
            this._beautify(target);
        } else {
            this._minify(target);
        }
    }

}


var compileInfo = {

    // 模板 ID
    id: id,

    // 版本
    version: count,

    // 源码
    source: source,

    // 模板文件路径
    sourceFile: file,

    // 编译结果代码
    output: mod,

    // 编译输出文件路径
    outputFile: target,

    // 是否被修改
    modified: modified,

    // 依赖的子模板 ID 列表
    requires: modObject.requires || []
};


if (compileError && !compileError.source) {

    // 语法错误，目前只能对比生成后的 js 来查找错误的模板语法

    compileError.debugFile = path.join(this.base, DEBUG_File);

    this.debuging = true;

    this._debug(compileError, function(message) {

        var e = {

            // 错误名称
            name: compileError.name,

            // 报错信息
            message: message,

            // 调试文件地址
            debugFile: compileError.debugFile,

            // 编译器输出的临时文件
            temp: compileError.temp

        };

        for (var name in e) {
            compileError[name] = e[name];
        }

        this.emit('debug', compileError);

    }.bind(this));


} else {

    // 删除上次遗留的调试文件
    if (this.debuging) {
        this._fsUnlink(path.join(this.base, DEBUG_File));
        delete this.debuging;
    }

    // 缓存编译好的模板
    this._setCache(file, mod);
}


this.emit('compile', compileError || writeError, compileInfo);


if (compileError || writeError) {
    this.emit('debug', compileError || writeError);
    return null;
} else {
    return compileInfo;
}
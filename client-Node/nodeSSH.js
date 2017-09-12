#!/usr/local/bin/node
friendly();

var fs = require('fs');
var path = require('path');
var yargs = require('yargs');
var argv = yargs.argv;
var client = require('ssh2').Client;
var readlineSync = require('readline-sync');
var jsonFormat = require('json-format');
var chalk = require('chalk');

var config = false;

var cwd = __dirname;
var package = false;
var cmdArguments = process.argv.splice(2);


//----------------------------------- 输出版本或帮助信息 ------------------------------
if (argv.v || argv.version || argv.h || argv.help) {
    package = readPackage();
    if (argv.v || argv.version) {
        console.log('version: ' + package.version);
        console.log('author: ' + package.author.name);
    }
    if (argv.h || argv.help) {
        showHelp(package);
    }
    process.exit(0);
}

//----------------------------------- 读取配置文件 ------------------------------
try {
    config = fs.readFileSync(path.join(cwd, './config.json'));
    config = JSON.parse(config);
} catch (e) {
    config = false;
}
// --------------------- 如果没有正确的配置文件，则让用户输入配置后保存至配置文件
if (!config) {
    config = {};
    console.log(chalk.white.bold.bgYellow('      not found config.json, please input follow:      '));
    console.log('who is using this client ?');
    var user = readlineSync.question('user: ', {
        defaultInput: 'unknow'
    });
    console.log("your server's host that have installed syncShell");
    var host = readlineSync.question('host: ', {
        defaultInput: "false"
    });
    if (host === "false") {
        console.log(chalk.white.bold.bgRedBright("      you must input the correct host!      "));
        process.exit(0);
    }
    console.log("username for login: " + host);
    var username = readlineSync.question("username: ", {
        defaultInput: false
    });
    var password = readlineSync.question("password: ", {
        defaultInput: ''
    });
    console.log("where is your cmd.sh path on server ?");
    var cmdPath = readlineSync.question("cmdPath: ", {
        defaultInput: '/usr/local/bin/cmd.sh'
    });
    config = {
        user: user,
        host: host,
        username: username,
        password: password,
        cmdPath: cmdPath
    };
    // 写入配置文件
    fs.writeFileSync(path.join(cwd, './config.json'), jsonFormat(config));
}

var __CONFIG = {
    // who is using this client ?
    user: config.user || "unknow",
    // your cmd.sh path on server
    cmdPath: config.cmdPath || '/usr/local/bin/cmd.sh',
    // your server's host that have installed cmd.sh
    host: config.host || '',
    // username for login
    username: config.username || 'guest',
    // password for login
    password: config.password || ''
};

//----------------------------------- 解析命令 ------------------------------
var ssh2 = new client();
ssh2.on('ready', function () {
    // 捕获退出信号，发送 CTRL + C 给服务器，以中断当前命令
    process.on('SIGINT', function () {
        ssh2.exec("\x003", function (err, stream) {
            if (err) throw err;
            stream.on('close', function (code, signal) {
                ssh2.end();
                process.exit(0);
            }).on('data', function (data) {
                process.stdout.write(data.toString());
            }).stderr.on('data', function (data) {
                process.stdout.write(data.toString());
            });
        });
    });
    // 判断是否有多个-c参数，如果有，则取第一个
    if (isArray(argv.c)) {
        argv.c = argv.c[0];
    }
    // 判断是否有必填参数，如果语法错误则显示帮助信息
    if (!argv.c || argv.c === true) {
        package = readPackage();
        showHelp(package);
        process.exit(0);
    }
    // 获取要命令
    var cmd = argv.c || '';

    var shell = "sh " + __CONFIG.cmdPath + " -u " + __CONFIG.user;
    shell = shell + ' -c ' + cmd;
    // 去除本应用需要用到的参数，保留剩下的
    for (var i = 0; i < cmdArguments.length; i++) {
        // 只删除第一个-c参数
        if (cmdArguments[i] === '-c' || cmdArguments[i] === '--c') {
            cmdArguments.splice(i, 2);
            break;
        }
    }
    shell = shell + ' ' + cmdArguments.join(' ');

    ssh2.exec(shell, function (err, stream) {
        if (err) throw err;
        stream.on('close', function (code, signal) {
            ssh2.end();
        }).on('data', function (data) {
            process.stdout.write(data.toString());
        }).stderr.on('data', function (data) {
            process.stdout.write(data.toString());
        });
    });
}).connect({
    host: __CONFIG.host,
    username: __CONFIG.username,
    password: __CONFIG.password
});

function friendly() {
    process.on('uncaughtException', function (error) {
        console.log('\nOh!!! There seems to be a problem with the program! amazing!');
        console.log('Please contact me by following if you are willing to contribute:');
        console.log('- url:    https://github.com/LanFly/syncShell/issues');
        console.log('- email:  LanFly <bluescode@outlook.com>');
        console.log('You can copy the following information to help me quickly locate the problem, Thank you very much.\n');
        console.log('version: 0.1.1');
        console.log(error.stack);
        process.exit(1);
    });
}

function readPackage() {
    var package = false;
    try {
        package = fs.readFileSync(path.join(cwd, '../package.json'));
        package = JSON.parse(package);
        if (!package) {
            package = {
                name: 'cmd',
                version: '0.1.1',
                author: {
                    name: 'author: LanFly <bluescode@outlook.com>'
                }
            };
        }
    } catch (error) {
        package = {
            name: 'cmd',
            version: '0.1.1',
            author: {
                name: 'author: LanFly <bluescode@outlook.com>'
            }
        };
    }
    return package;
}

function showHelp(package) {
    console.log('Usage: cmd [options]');
    console.log('Options:');
    console.log('   -c, --c         ', 'Commands to run');
    console.log('   -v, --version   ', 'Display software version')
    console.log('   -h, --help      ', 'Show help');
    console.log('Examples:');
    console.log('   cmd -c gulp-test1   // run gulp-test1 command defined in the cmd.sh file on server');
    console.log('Infomation:');
    console.log('   name:   ' + package.name);
    console.log('   author: ' + package.author.name);
    console.log('   bugs:   ');
    console.log('     - url:     ' + package.bugs.url);
    console.log('     - email:   ' + package.bugs.email);
}

function isArray(any) {
    return Object.prototype.toString.call(any) === "[object Array]"
}
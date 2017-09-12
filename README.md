# syncShell
将多个shell任务转换为同步任务（我也不知道怎么命名比较合适）
Perform multiple shell tasks in synchronous order (I don't know how to name it)

### [English version](#en)

报告bug：

 - email: [bluescode@outlook.com](mailto:bluescode@outlook.com)
 - issue: [https://github.com/LanFly/syncShell/issues](https://github.com/LanFly/syncShell/issues)


举个栗子：
> 我们前端使用gulp构建工具，有`程序媛A`和`程序员B`开发同一个功能，现在需要部署到test1环境进行测试了。
> 
> `程序媛A`执行下面的脚本：
>`sh gulp-build-test1.sh`
>这个命令需要5分钟或者更多时间才能执行完。
> 
> `程序员B`这时也想测试自己的程序有没有bug，他也执行下面的脚本：
> `sh gulp-build-test1.sh`

程序员B很慌😨，因为脚本直接报一大堆他看不懂的错误。就算gulp不报错，他们也不应该同一时间编译同一个工程。

正确的顺序应该是：
`程序猿A`在6分钟后执行完了，告诉`程序员B`：“Hey, 我上完了”。
然后`程序员B`再执行脚本。他们总共花了12分钟在等待脚本执行。
如果有3个以上的人呢？

--------------

很明显，程序猿A不需要等待她的脚本执行完成，她得知程序员B也要编译的时候，只要中断自己的任务，让程序员B再执行一次脚本就可以了。这样，他们总共只需要花6分钟时间。

这一切都需要A和B手工配合。syncShell就是这样一个工具，它能帮你自动管理多个用户的任务，然后按照先来后到的顺序自动执行。

# 怎么用？

第一步：把`server`文件夹下的`cmd.sh`文件放到你的服务器上，默认放到`/usr/local/bin/cmd.sh`，然后设置`alias`为`cmd`，这样你就可以在任意目录执行cmd命令了。
```bash
alias cmd=/usr/local/bin/cmd.sh
```

第二步：打开cmd.sh文件，配置要让它管理的任务。定位到这段代码：
```bash
#映射命令简称对应的目标命令
cmdT="" #目标命令
case $cmd in
  test1)
    cmdT="sh /home/froad/test1.sh"
    ;;
  test2)
    cmdT="sh /home/froad/test2.sh"
    ;;
  build)
    cmdT="sh /data/shell/dev2/qiniuPersonal.sh"
    ;;
esac
```
我们定义了3个任务，分别是`test1`、`test2`、`build`，任务对应的脚本由`cmdT`指定。任务名字由你自己指定，对应的脚本也由你指定，只要按照格式添加即可。但是也要符合bash的语法。

你可以在这里添加任意多个任务。

第三步：执行任务。
`sh /usr/local/bin/cmd.sh -u LanFly -c test1`
如果你配置了`alias`，则可以使用更短的命令
`cmd -u LanFly -c test1`

`-u`参数指定是谁在运行本次test1任务。`-c`参数指定要运行的任务名。

`cmd`就会立即执行你指定的test1的任务。如果你的test1任务还没执行完，B又执行了`cmd -u someone -c test1`，则someone会得到下面这句话：
`I am busy now, LanFly is running at 2017-09-11 16:23:23`
并且阻塞，直到LanFly的test1任务执行完。someone的test1任务会自动运行。LanFly也可以随时按下`ctrl c`中断，someone的任务也会立即执行。

可以有多个用户执行同一个命令，cmd会按照先来后到顺序执行。只要前一个用户执行完，或者是被中断，后一个用户就会自动执行，依次执行完所有的用户。

支持多个用户执行多个不同的任务。cmd以任务名为管理单位。这意味着，你在执行test1的时候，其他用户可以执行test2，并且是不会阻塞。只有在同一个任务名有多个用户在执行的时候才会阻塞。

# 客户端

服务端安装很简单，只需要一个cmd.sh文件就行。syncShell还有一个客户端，可以让你在自己电脑上远程执行cmd任务。省去手动连接服务器的麻烦。

### 安装客户端

很简单，使用-g选项全局安装。如果安装错误，你可能需要加上sudo以提供权限。
```bash
npm install syncShell -g
```
安装完后，你就可以像服务器端一样直接使用cmd命令了，用法稍微有点不同。不过在这之前我们先得进行简单的配置。

### 配置

在终端中输入：
```bash
cmd
```
第一次运行会让你输入服务端配置信息，按照自己的情况输入，下面是各字段的说明：
`user`: 谁在用这个客户端，一般是你自己的用户名。即`-c`参数的值，客户端会自动帮你填写`-c`参数。
`host`: 安装了cmd.sh文件的服务器地址。客户端会自动连接服务器帮你运行cmd命令。
`username`: 用于登录服务器的用户名。
`password`: 用于登录服务器的密码。默认空字符串。
`cmdPath`: 服务器上`cmd.sh`文件的路径或别名。默认`/usr/local/bin/cmd.sh`

输入完后会保存这些信息到syncShell包的/client-Node/文件夹下的config.json文件中。配置完后就可以开始使用了。

### 运行

客户端用法和服务端用法一致，不同之处在于客户端会自动使用user字段的信息，帮你填写-c参数。所以你不必输入-c参数。
```bash
cmd -c test1
```
如果你配置的用户名为`LanFLy`，则上面的命令的结果等于`sh /usr/local/bin/cmd.sh -u LanFly -c test1`。它会自动连接服务器，并运行这个命令。

你还可以输入其它的参数，它会原样传递给cmd.sh脚本，你可以编辑脚本实现更多功能。

> 值得注意的是，如果你需要的参数名和-c冲突了，那么你可以传递两个或多个-c参数。第一个参数是syncShell的任务名，并且一定是第一个。其余-c参数会原封不动传递。第一个-c会被去掉。

**客户端按ctrl+c同样会传递给服务端。总之，你可以认为客户端的执行和服务端完全一样。**

-------------------------







# <span id="en">English version document</span>

Report bug：

 - email: [bluescode@outlook.com](mailto:bluescode@outlook.com)
 - issue: [https://github.com/LanFly/syncShell/issues](https://github.com/LanFly/syncShell/issues)


Let me give an example first:

> Our front end uses the gulp build tool, which has the Programmer A and programmer B to develop the same program, and now needs to be deployed to the test1 environment for testing.

> Program A executes the following script:
>`sh gulp-build-test1.sh`
> This command will take 5 minutes or more to complete.
> Programmer B also wants to test whether his program has bug, and he performs the following script:
>`sh gulp-build-test1.sh`

Programmer B was at a loss as the script reported a lot of mistakes he didn't understand.😨 Even if gulp doesn't make a mistake, they shouldn't compile the same project at the same time.

The correct order should be...:
Programmer A finished in 6 minutes and told the programmer B, "Hey, I'm done".
The programmer B then executes the script. They spent a total of 12 minutes waiting for the script to execute.
What if there are more than 3 people?

--------------

Obviously, programmer A does not have to wait for her script execution to complete. She knows that when programmer B is compiling, it's okay to just interrupt her task and let the programmer B execute the script again. In this way, they only need 6 minutes in all.

All this requires manual collaboration between A and B. SyncShell is a tool, it can help you to automatically manage multiple user tasks, and then follow the order automatically in order of arrival.

# How to use it?

The first step: put the `cmd.sh` file under the `server` folder on your server, default to `/usr/local/bin/cmd.sh`, and then set alias to `cmd` so that you can execute the cmd command in any directory.
```bash
alias cmd=/usr/local/bin/cmd.sh
```

The second step: open the `cmd.sh` file and configure the task to be managed by it. Locate this code:
```bash
#The mapping command is referred to as the corresponding target command
cmdT="" #Target command
case $cmd in
  test1)
    cmdT="sh /home/froad/test1.sh"
    ;;
  test2)
    cmdT="sh /home/froad/test2.sh"
    ;;
  build)
    cmdT="sh /data/shell/dev2/qiniuPersonal.sh"
    ;;
esac
```
We define 3 tasks, namely `test1`, `test2`, `build`, and the task corresponding script specified by `cmdT`. The task name is assigned by yourself, and the corresponding script is specified by you, as long as you add in format. But also conform to the syntax of bash.

You can add any number of tasks here.

The third step: perform the task:
`sh /usr/local/bin/cmd.sh -u LanFly -c test1`
If you configure `alias`, you can use shorter commands:
`cmd -u LanFly -c test1`

The `-u` parameter specifies who is running the test1 task. The `-c` parameter specifies the name of the task to run.

`cmd` will immediately execute the task of your assigned test1. If your test1 task is not finished, B executes the `cmd -u someone -c test1`, then someone gets the following sentence:
`I am busy now, LanFly is running at 2017-09-11 16:23:23`
And block until the LanFly test1 task is done. The someone task for test1 will run automatically. LanFly can also press `ctrl c` interrupts at any time, and the tasks of someone will be executed immediately.

You can have multiple users to perform the same command, `cmd` will be in accordance with the order of execution in order of arrival. As soon as the previous user has finished or is interrupted, the latter user will execute automatically and execute all the users in turn.

It supports multiple users performing several different tasks. `cmd` takes task name as management unit. This means that when you execute test1, other users can execute test2 and are not blocked. Only when the same task name has multiple users blocked when it is executed.

# Client

The server installation is simple and requires only one `cmd.sh` file. SyncShell also has a client that allows you to remotely execute `cmd` tasks on your computer. Save the trouble of manually connecting your server.

### Installation client

Very simple. Use the `-g` option to install globally. If the installation error, you may need to add sudo to provide permissions.

```bash
npm install syncShell -g
```

Once installed, you can use the `cmd` command directly like the server side. The usage is slightly different. But before that, we have to do simple configuration.

### configure

Input in terminal:

```bash
cmd
```
The first run allows you to type in the server configuration information and enter it as you like. Here are the instructions for each field:
`user`: Who is using this client? usually your own user name. That is, the value of the -c parameter, and the client will help you fill out the -c parameter automatically.
`host`: The server address of the cmd.sh file was installed. The client will automatically connect to the server to help you run the cmd command.
`username`: The user name used to log in to the server.
`password`: The password used to log on to the server. Default empty string.
`cmdPath`: The path or alias of the cmd.sh file on the server. Default `/usr/local/bin/cmd.sh`

When you've finished typing, it saves the information into the config.json file under the /client-Node/ folder of the syncShell package. After configuration, you can start using it.

### run

The client usage is consistent with the server usage. The difference is that the client automatically uses the user field information to help you fill in the -c parameter. So you don't have to enter the -c parameter.

```bash
cmd -c test1
```

If you configure the user name to be LanFLy, the result of the above command is equal to `sh /usr/local/bin/cmd.sh -u LanFly -c test1`. It automatically connects to the server and runs this command.

You can also input other parameters, which will pass to the cmd.sh script as they are, and you can edit the script to perform more functions.

> It is worth noting that if you need parameter names to conflict with -c, you can pass two or more -c parameters. The first parameter is the task name of the syncShell, and must be the first. The rest of the -c parameters will be delivered as they are. The first -c will be removed.

**The client by ctrl+c will also pass to the server. In short, you can think that the client's execution is exactly the same as the server.**

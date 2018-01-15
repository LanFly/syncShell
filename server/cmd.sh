# ver: 2.0.0
# author: LanFly
# mail: bluescode@outlook.com

# 初始化资源，存放日志文件
if [ ! -d "/var/log/cmd" ];
then
  mkdir -p /var/log/cmd
fi
# 配置操作记录日志文件
access_log="/var/log/cmd/access.log"

# 处理参数，前2个参数一定是-c和-u，后面可以无限接其它参数，这些参数除了-c和-u，剩余的会被原样透传给要执行的目标命令
otherPara=$*
otherPara=${otherPara#-c * }
otherPara=${otherPara#-u * }

user="unknow" # 用户名
cmd="" # 命令简称
while getopts "u:c:" arg
do
  case $arg in
  u)
    if [[ "$OPTIND" = "3" || "$OPTIND" = "5" ]]; then
      user=$OPTARG
    fi
    ;;
  c)
    if [[ "$OPTIND" = "3" || "$OPTIND" = "5" ]]; then
      cmd=$OPTARG
    fi
    ;;
  esac
done

# 定义任务
declare -A cmdMap

# |-----------------------------------------|
# |           在下面添加任务名称               |
# |-----------------------------------------|
# | example: cmdMap+=(["name"]="shell")     |
# |-----------------------------------------|
cmdMap+=(["test1"]="sh ~/test.sh")
cmdMap+=(["test2"]="echo 'test2'")
# |-----------------------------------------|

# 查看任务列表 
if [ "$1" = "list" ]; then
  for k in ${!cmdMap[@]}; do
    echo $k' -> '${cmdMap[$k]}
  done
  exit 0
fi

# 查看当前所有正在运行的任务
if [ "$1" = "who" ]; then
  lock_all=`find /dev/shm -name 'cmd-*'`
  for file in $lock_all; do
    cmd_name=${file#\/dev\/shm\/cmd-}
    isBusy="0"
    flock -xn "/dev/shm/cmd-${cmd_name}" -c ""
    isBusy=$?
    if [ "$isBusy" = "1" ]; then
      content=$(sed -n "1p" /var/log/cmd/${cmd_name}.whois)
      time=${content:0:19}
      name=${content:20}
      echo "[${name}] is running [${cmd_name}] at ${time}"
    fi
  done
fi

# 查找命令简称对应的目标命令
cmdT="" # 目标命令
cmdTPara="" # 带参数的目标命令
for k in ${!cmdMap[@]}; do
  if [ "$k" = "$cmd" ]; then
    cmdT=${cmdMap[$k]}
    cmdTPara=${cmdMap[$k]}' '${otherPara}
    break
  fi
done


if [ ! "$cmdT" = "" ]; then

# 获取系统当前时间
curTime=$(date '+%Y-%m-%d %H:%M:%S')
# 是否冲突标识 0:不冲突 1:冲突
isBusy=0
flock -xn "/dev/shm/cmd-${cmd}" -c "\
  echo ${curTime}' '${user} > /var/log/cmd/${cmd}.whois;\
  echo '[start]-['${curTime}']-['${user}']-['${cmd}']-['${cmdTPara}']' >> ${access_log};\
  $cmdTPara;\
  echo '[finish]-['$(date '+%Y-%m-%d %H:%M:%S')']-['${user}']-['${cmd}']-['${cmdTPara}']' >> ${access_log};
"

isBusy=$?
if [ "$isBusy" = "1" ]
then
	content=$(sed -n "1p" /var/log/cmd/${cmd}.whois)
	time=${content:0:19}
	name=${content:20}
	echo "I am busy now, ${name} is running at ${time}"
	flock -x "/dev/shm/cmd-${cmd}"  -c "\
          echo $(date '+%Y-%m-%d %H:%M:%S')' '${user} > /var/log/cmd/${cmd}.whois;\
          echo '[start]-['${curTime}']-['${user}']-['${cmd}']-['${cmdTPara}']' >> ${access_log};\
          $cmdTPara;\
          echo '[finish]-['$(date '+%Y-%m-%d %H:%M:%S')']-['${user}']-['${cmd}']-['${cmdTPara}']' >> ${access_log};
        "
fi

else
`$cmd`
fi

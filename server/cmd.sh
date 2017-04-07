#初始化资源，存放日志文件
if [ ! -d "/var/log/cmd" ];
then
  mkdir -p /var/log/cmd
fi

#处理参数
user="unknow" #用户名
cmd="" #命令简称
while getopts "u:c:" arg
do
  case $arg in
  u)
    user=$OPTARG
    ;;
  c)
    cmd=$OPTARG
    ;;
  esac
done

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

if [ ! "$cmdT" = "" ]; then

#获取系统当前时间
curTime=$(date '+%Y-%m-%d %H:%M:%S')
nowTime=""
#是否冲突标识 0:不冲突 1:冲突
isBusy=0
flock -xn "/dev/shm/cmd-${cmd}" -c "echo ${curTime}' '${user} > /var/log/cmd/${cmd}.whois; $cmdT;"
isBusy=$?
if [ "$isBusy" = "1" ]
then
	content=$(sed -n "1p" /var/log/cmd/${cmd}.whois)
	time=${content:0:19}
	name=${content:20}
	echo "I am busy now, ${name} is running now at ${time}"
	flock -x "/dev/shm/cmd-${cmd}"  -c "echo $(date '+%Y-%m-%d %H:%M:%S')' '${user} > /var/log/cmd/${cmd}.whois; $cmdT;"
fi

else
`$cmd`
fi

//初始化数据
var clientidname = 'sduEn9';
var host = 'http://qa-t.shoppingm.cn';
//var appId = 'e3x6eiVFpVEg7Rhzn4fhouhM-gzGzoHsz';
//var appId = 'BCOGEHyl1Y13kRRK4HjknROO-gzGzoHsz';
var appId = 'eWBTl83vk7egBcxweRUsCyp8-gzGzoHsz';  //正式环境
var appId = 'Gx1p05nkH8gLAn2FiwXdVofR-gzGzoHsz';  //QA环境
//var clientId = decodeURI(getParam('clientid'))||'liangliang';
var clientId = clientidname;
var firstFlag = true;
var rt;  //链接对象
var currentConv = '';  //当前房间号
var msgTime = '';
//房间对象列表
var roomList = [];
//当前房间对象
var room;
//当前置顶房间id
var toproom;
//AV.initialize('eWBTl83vk7egBcxweRUsCyp8-gzGzoHsz', 'vJYl6jtApxfECew7hi8PPxOo');  //正式环境
AV.initialize('Gx1p05nkH8gLAn2FiwXdVofR-gzGzoHsz', 'R69Wccem2PIYNXjmqTWmcoCj');    //QA环境
//初始化view
var _ele = $('#list-wrap'),
    _tpl = $('#list').html(),
    _wintpl = $('#window-tpl').html(),
    _wintplempty = $("#window-tpl-empty").html(),
    _winele = $('#window-main');

$(function(){
    // 点击上线
    $("#login").on('click',function(){
        var url = host+'/api/customerservice/login';
        var data = {'csserial':clientId};
        $.ajax({
            type: 'POST',
            url: url,
            data: data,
            dataType: 'json',
            success: function(){
                main();//初始化程序
            },
            error:function(){
                alert('登陆失败，请重试')
            }
        });
    });
    // 点击离线
    $("#logout").on('click',function(){
        if(rt){
            var url = host+'/api/customerservice/logout';
            var data = {'csserial':clientId};
            $.ajax({
                type: 'POST',
                url: url,
                data: data,
                dataType: 'json',
                success: function(){
                    rt.close();
                    $("#list-wrap").find('li').remove();
                    $(".conv-wrap").remove();
                    window.location.reload();
                },
                error:function(){
                    alert('下线失败，请重试');
                }
            });
        }else{
            alert('你还没上线呢');
        }
    });

    // 关闭窗口时关闭链接
    $(window).unload(function(){
        rt.close();
    });
});

// 创建聊天实例（支持单页多实例）
function createRt(){
    if (!firstFlag) {
        rt.close();
    }
    rt = AV.realtime({
        appId: appId,
        clientId: clientId,
        // 是否开启 HTML 转义，防止 XSS
        encodeHTML: true
        // 是否开启服务器端认证
        // auth: authFun
    });
}
// 主函数
function main(){
    createRt();
    // rt链接成功事件
    rt.on('open',function(){  //建立链接
        console.log('实时通信服务建立成功！');
        if(firstFlag){
            firstFlag = false;
            // 查询当前 当前用户的 的相关信息
            rt.query(function(data) {
//                console.log(data);
                if(data.length == 0){
                    addEmpty();
                }
                for(var i=0;i<data.length;i++){  //遍历所有与本用户相关的conversation信息
                    var convId = data[i].objectId;
                    var name = data[i].c;
                    addChat(convId,name);  //渲染模版
                    getText(convId);  //聊天纪录
                }
                //激活当前聊天窗口 并隐藏其他聊天窗口
                activeChat(data[0].objectId);
            });
        }
    });

    // 监听服务情况
    rt.on('reuse', function() {
        showCurrentLog('服务器正在重连，请耐心等待。。。');
    });

    // 监听错误
    rt.on('error', function() {
        showCurrentLog('连接遇到错误。。。');
    });

    // 收消息事件
    rt.on('message', function(data) {
        var _this;
        var handler = 0;
        for(var i = 0;i<roomList.length;i++){
            if(roomList[i].convid == data.cid){
                handler++;
            }
        }

        if(handler == 1){
            if(data.cid != toproom){
                _this = toTop(data.cid);// 置顶收到消息的会话
            }else{
                _this = $("#list-wrap").find('li[data-convid='+data.cid+']');
            }
            if(data.cid != currentConv){
                makeColor(_this,data.cid);
            }
        }else if(handler == 0){
            addChat(data.cid,data.fromPeerId);  //添加窗口
            if(data.cid != toproom){
                _this = toTop(data.cid);
            }else{
                _this = $("#list-wrap").find('li[data-convid='+data.cid+']');
            }
            makeColor(_this,data.cid);
            var printWall = $('#print-wall-'+data.cid).get(0);
            showMsg(printWall,data);
        }
    });

}
//获取用户信息
function getQuestion(convid,callback){
    var questionname = '';
    var data = {'onlycode':convid};
    var url = host+'/api/god/viewgod';
    $.ajax({
        type: 'POST',
        url: url,
        data: data,
        dataType: 'json',
        success: function(data){
            if(data.code == 200){
                questionname = data.businessObj.nickName || data.businessObj.mobile;
                callback(nickname);
            }else{
                alert('用户信息接口报错，请刷新重试');
            }
        },
        error:function(){
            alert('用户信息获取失败请刷新重试');
        }
    });
}
// 没有会话展示空模版
function addEmpty(){
    var _winhtml = _.template(_wintplempty);
    var _wineleDom = _winhtml({});
    _winele.append($(_wineleDom).show());
}

// 添加一个会话对象
function addChat(convid,name){
    if($(".chat-list-li[data-convid = "+convid+"]").length != 0){   //已经添加过的会话不再添加
        return;
    }

    getQuestion(convid,function(data){
        // 用来渲染模版的数据
        var _convidObj = {'convid':convid,'convname':data};
        //console.log(_convidObj)
        // 隐藏空模版
        $("#window-tpl-empty").hide();

        //渲染列表条目模版
        var _html = _.template(_tpl);
        var _eleDom = _html(_convidObj);
        _ele.append($(_eleDom));

        //渲染聊天窗口模版
        var _winhtml = _.template(_wintpl);
        var _wineleDom = _winhtml(_convidObj);
        _winele.append($(_wineleDom).hide());


        //给列表元素绑定事件
        _ele.find('li').off('click').on('click',function(){
            var _convid = $(this).data('convid');
            activeChat(_convid);
            return false;
        });

        //绑定发送图片事件
        _winele.find('.send-pic').off('change').on('change',function(e){
            e.preventDefault();
            var _convid = $(this).closest('.conv-wrap').data('convid');
            sendImg(_convid);
        });

        //绑定发送消息点击事件
        _winele.find('.send-btn').off('click').on('click',function(e){
            e.preventDefault();
            var _convid = $(this).closest('.conv-wrap').data('convid');
            sendMsg(_convid);
        });

        //绑定发送消息回车事件
        _winele.find('.input-send').off('keydown').on('keydown',function(e){
            if(e.keyCode == 13){
                var _convid = $(this).closest('.conv-wrap').data('convid');
                sendMsg(_convid);
            }
        });
    });

}

// 列表中置顶convid为convid的item
function toTop(convid){
    toproom = convid;
    var _this = '';
    $("#list-wrap").find('li').each(function(){
        if($(this).data('convid') == convid){
            var __this = $(this).parent().prepend($(this).clone(true));
            _this = __this.find('li').eq(0);
            $(this).remove();
        }
    });
    return _this;  //返回置顶条目的对象
}

//给新消息添加高亮以及消息条数
function makeColor(_this,cid){
    var _li = $(".chat-list-li[data-convid = "+cid+"]");
    var _count = parseInt(_li.data('count')) + 1;
    _li.data('count',_count);
    _li.find('.hongdian').css({'display':'inline'}).text(_count);
    _this.find('a').css({'color':'red'});
}

// 显示房间id为convid的窗口的消息
function getText(convid){
    rt.conv(convid, function(obj) {
        var printWall = $('#print-wall-'+convid).get(0);
        // 判断服务器端是否存在这个 conversation
        if (obj) {
            // 获取到这个 conversation 的实例对象
            conv = obj;

            if(!room){
                room = obj;
            }

            // 将房间对象存储进room数组
            var _roomObj = {convid:convid,obj:obj};
            roomList.push(_roomObj);

            // 接收消息
            conv.receive(function(data) {
                if (!msgTime) {
                    // 存储下最早的一个消息时间戳
                    msgTime = data.timestamp;
                }
                showMsg(printWall,data);
            });
            getLog(printWall,conv,function(){});

        } else {
            console.log('服务器端不存在这个 conversation。');
        }
    });
}

// 发送消息
function sendMsg(convid) {

    // 如果没有连接过服务器
    if (firstFlag) {
        alert('服务器未链接，请刷新当前页面重试！');
        return;
    }

    var inputSend = $('#input-send-'+convid).get(0);
    var printWall = $('#print-wall-'+convid).get(0);
    var val = inputSend.value;

    // 不让发送空字符
    if (!String(val).replace(/^\s+/, '').replace(/\s+$/, '')) {
        alert('请输入点文字！');
    }
    // 向这个房间发送消息，这段代码是兼容多终端格式的，包括 iOS、Android、Window Phone
    room.send({
        text: val
    }, {
        type: 'text'
    }, function(data) {

        // 发送成功之后的回调
        inputSend.value = '';
        showLog(printWall,'（' + formatTime(data.t) + '）  自己： ', val);
        printWall.scrollTop = printWall.scrollHeight;
    });
}

//发送图片
function sendImg(convid){
    var printWall = $('#print-wall-'+convid).get(0);
    var picbox = $('#photoFileUpload-'+convid).get(0);
    var text;
    if (picbox.files.length > 0) {
        var file = picbox.files[0];
        var name = 'avatar.jpg';

        var avFile = new AV.File(name, file);
        avFile.save().then(function(obj) {
            // 数据保存成功
            text = {'url':obj.url()};
            sendPic(text);
        }, function(err) {
            // 数据保存失败
            text = '图片发送失败，请刷新重试('+err+')';
            sendPic(text);
        });
    }

    function sendPic(text){
        //发送多媒体消息，如果想测试图片发送，可以打开注释
        room.send({
            text: 'text',
            // 自定义的属性
            attr: {
                a:123
            },
            url: text.url,
            metaData: {
                name:'logo',
                format:'png',
                height: 123,
                width: 123,
                size: 888
            }
        }, {
            type: 'image'
        }, function(data) {
            showLog(printWall,'（' + formatTime(data.t) + '）  自己： ', text);
            printWall.scrollTop = printWall.scrollHeight;
        });
    }
}

// 激活convid为convid的房间为当前房间
function activeChat(convid){
    // 设置convid为当前conv
    currentConv = convid;

    var _thisList = $(".chat-list-li[data-convid = "+convid+"]"); // 左侧列表条目
    _thisList.addClass('active').siblings().removeClass('active'); // 左侧列表当前列表加背景色区分
    _thisList.data('count',0); //清空未读消息条数
    _thisList.find('.hongdian').css({'display':'none'});  //隐藏未读消息条数容器
    _thisList.find('a').css({'color':'#888'});   //字体颜色变回灰色

    for(var i=0;i<roomList.length;i++){
        if(roomList[i].convid == convid){
            room = roomList[i].obj;   //激活当前房间对象
        }
    }
    // 显示对应聊天窗口，并隐藏其他的
    $(".conv-wrap").each(function(){
        if($(this).data('convid') == convid){
            $(this).show().siblings().hide();
            //console.log($(this).html());
        }
    })
}

// 获取消息历史
function getLog(printWall,conv,callback) {
    var height = printWall.scrollHeight;
    if ($(printWall).data('logflag')) {
        return;
    } else {
        // 标记正在拉取
        $(printWall).data('logflag',true);
    }
    conv.log({
        t: msgTime
    }, function(data) {
        $(printWall).data('logflag',false);
        // 存储下最早一条的消息时间戳
        var l = data.length;
        if (l) {
            msgTime = data[0].timestamp;
        }
        for (var i = l - 1; i >= 0; i--) {
            showMsg(printWall,data[i], true);
        }
        if (l) {
            printWall.scrollTop = printWall.scrollHeight - height;
        }
        if (callback) {
            callback();
        }
    });
}

// 显示接收到的信息
function showMsg(printWall,data, isBefore) {

    //console.log(data);

    var text = '';
    var _url = '';
    var from = data.fromPeerId;
    if (data.msg.type) {
        text = data.msg.text;
        if(data.msg.type == 'image'){
            text = data.msg;
        }
    } else {
        text = data.msg;
    }
    if (data.fromPeerId === clientId) {
        from = '自己';
    }
    if (String(text).replace(/^\s+/, '').replace(/\s+$/, '')) {
        showLog(printWall,'（' + formatTime(data.timestamp) + '）  ' + encodeHTML(from) + '： ', text, isBefore);
    }
}

// 在窗口中显示消息
function showLog(printWall,msg, data, isBefore) {
    if (data) {
        // console.log(msg, data);
        if(data.url){
            msg = msg + '<span class="strong">' + '<img src="'+data.url+'" width="500" />' + '</span>';
        }else{
            msg = msg + '<span class="strong">' + encodeHTML(JSON.stringify(data)) + '</span>';
        }

    }
    var p = document.createElement('p');
    p.innerHTML = msg;
    if (isBefore) {
        printWall.insertBefore(p, printWall.childNodes[0]);
    } else {
        printWall.appendChild(p);
    }
}

// 在当前窗口显示系统通知
function showCurrentLog(msg,data,isBefore){
    showLog($('#print-wall-'+currentConv).get(0),msg,data,isBefore)
}

// 转义防止xss
function encodeHTML(source) {
    return String(source)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    // .replace(/\\/g,'&#92;')
    // .replace(/"/g,'&quot;')
    // .replace(/'/g,'&#39;');
}

// 格式化事件显示
function formatTime(time) {
    var date = new Date(time);
    var month = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
    var currentDate = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
    var hh = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
    var mm = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    var ss = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
    return date.getFullYear() + '-' + month + '-' + currentDate + ' ' + hh + ':' + mm + ':' + ss;
}
//获取url参数
function getParam(name){
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    var r = window.location.search.substr(1).match(reg);  //匹配目标参数
    if (r != null) return r[2]; return null; //返回参数值
}
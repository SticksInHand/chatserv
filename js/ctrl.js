//初始化数据
var appId = 'e3x6eiVFpVEg7Rhzn4fhouhM-gzGzoHsz';
var clientId = 'liangliang';
var firstFlag = true;

//初始化view
var _ele = $('#list-wrap'),
    _tpl = $('#list').html();

// 创建聊天实例（支持单页多实例）
var rt = AV.realtime({
    appId: appId,
    clientId: clientId,
    // 是否开启 HTML 转义，防止 XSS
    encodeHTML: true
    // 是否开启服务器端认证
    // auth: authFun
});

rt.on('open',function(){  //建立链接
    console.log('实时通信服务建立成功！');
    if(firstFlag){
        firstFlag = false;
        // 查询当前 当前用户的 的相关信息
        rt.query(function(data) {
            var _list = {'list':[]};
            for(var i=0;i<data.length;i++){  //遍历所有与本用户相关的conversation信息
                var convId = data[i].objectId;
                _list.list.push(convId);

                rt.conv(convId, function(obj) {
                    // 判断服务器端是否存在这个 conversation
                    if (obj) {
                        // 获取到这个 conversation 的实例对象
                        conv = obj;
                        console.log(obj);

                        conv.receive(function(data) {
                            if (!msgTime) {
                                // 存储下最早的一个消息时间戳
                                msgTime = data.timestamp;
                            }
                            console.log('这是我收到的消息');
                            console.log(data);
                        });

                    } else {
                        console.log('服务器端不存在这个 conversation。');
                    }
                });
            }

            //渲染模版
            var _html = _.template(_tpl);
            _ele.html(_html(_list));
        });
    }else{

    }
});
/**
 * Created by jinyiliang on 16/3/11.
 */
//列表相关函数合集
var _CoserWeibolist = {
    //配置
    _cfg:{
        flag:$("#flag").val(),//页面标识
        page:2,
        main:$("#element"), //主体元素
        maxnum:100,  //加载最多次数(默认100)
        vote:$("#vote"),
        port:GLOBALS_VARS.site_www+"/special/coser/ajax_get_weibo_list?page=",      //分页接口
        vortport:GLOBALS_VARS.site_www+"/special/coser/vote",                       //投票接口
        searchPort:GLOBALS_VARS.site_www+"/special/coser/ajax_search_weibo_list",   //搜索接口
        myVortPort:GLOBALS_VARS.site_www+"/special/coser/ajax_get_my_vote_list",    //我的投票列表接口
        myList:GLOBALS_VARS.site_www+"special/coser/ajax_get_my_comic_list",        //我的作品列表接口
        repostSupportPort:GLOBALS_VARS.site_www+"special/coser/repost",             //拉票(转发)微博接口
        sendCommentPort:GLOBALS_VARS.site_www+"special/coser/send_comment",         //发送评论接口
        authorFormPort:GLOBALS_VARS.site_www+"special/coser/update_author",         //提交个人信息接口
        order:function(){
            return this.main.attr('data-order')
        }
    },
    //时间戳转日期
    getLocalTime:function (nS) {
        return new Date(parseInt(nS) * 1000).toLocaleString().substr(0,16)
    },
    //获取页面参数
    getParam:function(param){
        var r = new RegExp("\\?(?:.+&)?" + param + "=(.*?)(?:&.*)?$");
        var m = window.location.toString().match(r);
        return m ? decodeURIComponent(m[1]) : ""; //如果需要处理中文，可以用返回decodeURLComponent(m[1])
    },
    //列表页获取列表相关数据
    getJson:function(page,order){
        var _this = this;
        $.ajax({
            type:"GET",
            url:_this._cfg.port+page+"&order="+order,
            cache:false,
            success:function(data){
                _this.render(_this.parseJson(data));
            }
        })
    },
    //搜索页获取列表相关数据
    getSearchJson:function(page,keyword){
        var _this = this;
        $.ajax({
            type:"GET",
            url:_this._cfg.searchPort+"?page="+page+"&keyword="+keyword,
            cache:false,
            success:function(data){
                _this.render(_this.parseJson(data));
            }
        })
    },
    //获取我的作品列表相关数据
    getMyComicJson:function(){
        var _this = this;
        $.ajax({
            type:"GET",
            url:_this._cfg.myList,
            cache:false,
            success:function(data){
                _this.render(_this.parseJson(data));
            }
        })
    },
    //获取我投票的作品列表
    getMyVoteJson:function(page){
        var _this = this;
        $.ajax({
            type:"GET",
            url:_this._cfg.myVortPort+'?page='+page,
            cache:false,
            success:function(data){
                _this.render(_this.parseJson(data));
            }
        })
    },
    renderEmpty:function(){  //没有数据时显示的内容
        $(".loading-more").hide();
        var template = '';
        if(GLOBALS_VARS.page == 'search'){
            var text = '没有搜到结果，换个词试试吧~';
            template = '<p class="empty" >'+text+'</p>';
        }
        if(GLOBALS_VARS.page == 'my_comic_list'){
            var text='快来参赛吧~';
            template = '<p class="empty" >'+text+'</p><p class="empty-p"><a href="http://weibo.com/p/1008089f503074600f2ed0a0c670c4ec02420a" class="join-empty"></a></p>';
        }
        if(GLOBALS_VARS.page == 'lst'){
            var text = '作品审核中~';
            template = '<p class="empty" >'+text+'</p>';
        }
        if(GLOBALS_VARS.page == 'my_vote_list'){
            var text = '快去给你喜欢的coser投票吧~'
            template = '<p class="empty" >'+text+'</p>';
        }

        this._cfg.main.html($(template));
        $(window).off();
    },
    render:function(data){ //渲染模板
        if(data.ten.length == 0){
            this.renderEmpty();
        }else{
            var template = _.template($("#item-template").html());
            this._cfg.main.append(template(data));
        }
    },
    parseJson:function(res){  //格式化取回的数据
        var _this = this;
        var tenArr = [];
        if(res){
            if(GLOBALS_VARS.page != 'my_comic_list'){
                this._cfg.maxnum = res.total_page;
                this._cfg.page = res.page_num+1;
                if(_this._cfg.page == _this._cfg.maxnum+1 ){
                    $(".loading-more").hide();
                }
            }
            for(var i = 0;i<res.data.length;i++){
                var author_id           = res.data[i].author_id;
                tenArr[i] = {};
                tenArr[i].name          = res.author_list[author_id]?res.author_list[author_id].author_name:res.author_list.author_name;
                tenArr[i].head          = res.author_list[author_id]?res.author_list[author_id].avatar:res.author_list.avatar;
                tenArr[i].verified      = res.author_list[author_id]?res.author_list[author_id].verified:res.author_list.verified;
                tenArr[i].all_vote_num  = res.author_list[author_id]?res.author_list[author_id].vote_num:res.author_list.vote_num;
                tenArr[i].all_rank_no   = res.author_list[author_id]?res.author_list[author_id].rank_no:res.author_list.rank_no;
                tenArr[i].text          = res.data[i].weibo_content;
                tenArr[i].create_at     = res.data[i].create_at;
                tenArr[i].vote_num      = res.data[i].vote_num;
                tenArr[i].author_id     = res.data[i].author_id;
                tenArr[i].weibo_id      = res.data[i].weibo_id;
                tenArr[i].imgUrl        = res.data[i].img_json;
                tenArr[i].rank_no       = res.data[i].rank_no;

                tenArr[i].text = _this.replaceTopic(tenArr[i].text);

                tenArr[i].create_at = _this.getLocalTime(tenArr[i].create_at);  //时间戳转时间
                if(tenArr[i].imgUrl.length == 1){
                    tenArr[i].imgUrl[0].img_url = tenArr[i].imgUrl[0].img_url.replace('bmiddle','wap360');
                }else{
                    for(var j = 0;j<tenArr[i].imgUrl.length;j++){
                        tenArr[i].imgUrl[j].img_url = tenArr[i].imgUrl[j].img_url.replace('bmiddle','thumb180');
                    }
                }
            }
        }else{
            tenArr = [];
        }

        return {"ten":tenArr};
    },
    //微博话题替换增加连接
    replaceTopic:function(str){
        var r;    // 声明变量。
        r=str.replace(/\#([^\#|.]+)\#/g,function(word){
            return '<span class="lanse">'+word+'</span>';
        });


        return(r);    //返回替换后的字符串
    },
    //滑动加载更多
    takeMore:function(keyword){
        var _this = this;
        var range = 50;             //距下边界长度/单位px
        var totalheight = 0;
        $(window).on('touchstart',function(){
            var srollPos = $(window).scrollTop();    //滚动条距顶部距离(页面超出窗口的高度)
            totalheight = parseFloat($(window).height()) + parseFloat(srollPos);
            if(($(document).height()-range) <= totalheight  && _this._cfg.page != _this._cfg.maxnum+1){
                if(GLOBALS_VARS.page == 'search'){  //搜索页
                    _this.getSearchJson(_this._cfg.page,keyword);
                }
                if(GLOBALS_VARS.page == 'lst'){     //列表页
                    _this.getJson(_this._cfg.page,_this._cfg.main.attr('data-order'));
                }
                if(GLOBALS_VARS.page == 'my_vote_list'){ //我投票的列表
                    _this.getMyVoteJson(_this._cfg.page);
                }
            }
        });
    },
    //将投票按钮变为loading
    loadingVote:function(O_this){
        var this_button = O_this;
        this_button.removeClass("mz-wb-arrow").addClass("loading-vote");
        this_button.find("span").hide();
    },
    //将投票按钮去掉loading
    removeLoadingVote:function(O_this){
        var this_button = O_this;
        this_button.removeClass("loading-vote").addClass("mz-wb-arrow");
        this_button.find("span").show();
    },
    vote:function(weibo_id,$_this,vote_from){ //投票接口
        var _this = this;
        if($_this!=''){
            _this.loadingVote($_this);
        }
        $.ajax({
            type:"POST",
            url:_this._cfg.vortport,
            data:{"weibo_id":weibo_id,'vote_from':vote_from},
            dataType:"json",
            cache:false,
            success:function(data){
                if($_this!=''){  //手动投票
                    alert(data.message);
                    _this.removeLoadingVote($_this);
                    $_this.addClass('mz-wb-arrow-active');
                    if(data.code == 1){
                        var _text = $_this.closest('.mz-wb-con').find('.mz-wb-name-vote').text().replace(/(\d)*/,function(word){
                            if(data.data.vote_num != undefined){
                                return parseInt(word)+parseInt(data.data.vote_num);
                            }else{
                                return parseInt(word)+1;
                            }
                        });
                        $_this.closest('.mz-wb-con').find('.mz-wb-name-vote').text(_text);
                    }
                }else{  //拉票中转页自动投票
                    if(GLOBALS_VARS.page != 'report_weibo'){
                        alert(data.message);
                        setTimeout(function(){
                            top.window.location.href = GLOBALS_VARS.site_www + '/special/coser/show?weibo_id='+weibo_id;
                        },200);
                    }
                }
            }
        })
    },
    orderStatusChange:function(order){//动态修改order参数
        this._cfg.page = 2;
        this._cfg.main.attr('data-order',order);
    },
    tabJsonAction:function(){ //切换标签时动态显示数据
        var _this = this;
        $(".list-tab").find("li").on('click',function(e){//给标签切换绑定事件
            e.preventDefault();
            $(this).addClass("active").siblings().removeClass("active");
            var order = $(".list-tab").find('.active').attr('data-order');
            _this.orderStatusChange(order);
            _this._cfg.main.html('');
            $(".loading-more").show();
            _this.getJson(1,order);  //抓取数据
        })
    },
    //获取内容字符数
    getStringLen:function(Str){
        var   i,len,code;
        if(Str==null || Str == "")   return 0;
        len = Str.length;
        for(i = 0;i < Str.length;i++){
            code = Str.charCodeAt(i);
            if(code > 255){len ++;}
        }
        return len;
    },
    //刷新输入框中可输入的字数
    refreshNum:function(){
        var _this = this;
        var txt = $(".zhuanfa-textarea textarea").val();
        var number = 140-Math.ceil(_this.getStringLen(txt)/2);
        if(number < 0){
            $(".zishu").addClass('red-color');
        }else{
            $(".zishu").removeClass('red-color');
        }
        $(".zishu").html(number);
        return txt;
    },
    //转发拉票等微博接口
    sendWeibo:function(weibo_id,txt){
        var _this = this;
        var port = this._cfg.repostSupportPort;
        $.ajax({
            type:"POST",
            url:port,
            data:{"weibo_id":weibo_id,'txt':txt},
            dataType:"json",
            cache:false,
            success:function(data){
                if(data.code == 0){
                    alert(data.message);
                }else{
                    alert(data.message);
                    if(GLOBALS_VARS.page == 'report_weibo'){
                        _this.vote(weibo_id,'','share');
                        window.location.href = GLOBALS_VARS.site_www+"/special/coser/show?weibo_id="+weibo_id;
                    }else if(GLOBALS_VARS.page == 'repost_support_vote'){
                        window.history.go(-1);
                    }
                }
            }
        })
    },
    //评论接口
    sendComment:function(weibo_id,txt){
        var port = this._cfg.sendCommentPort;
        $.ajax({
            type:"POST",
            url:port,
            data:{"weibo_id":weibo_id,'txt':txt},
            dataType:"json",
            cache:false,
            success:function(data){
                if(data.code == 0){
                    alert(data.message);
                }else{
                    alert(data.message);
                    window.location.href = GLOBALS_VARS.site_www+"/special/coser/show?weibo_id="+weibo_id;
                }
            }
        })
    },
    //提交个人信息
    commitPersonInfo:function(_json){
        var port = this._cfg.authorFormPort;
        $.ajax({
            type:"POST",
            url:port,
            data:_json,
            dataType:"json",
            cache:false,
            success:function(data){
                if(data.code == 0){
                    alert(data.message);
                }else{
                    alert(data.message);
                    window.history.go(-1);
                }
            }
        })
    },
    init:function(){  //列表页初始化
        var _this = this;
        var order = $(".list-tab").find('.active').attr('data-order');
        _this.orderStatusChange(order);
        this.getJson(1,order);
        this.takeMore();
        this.tabJsonAction();
        _this._cfg.main.on("click",".mz-wb-arrow",function(e){
            e.preventDefault();
            _this.vote($(this).attr('data-vote'),$(this),'vote');
        });
    },
    searchInit:function(keyword){  //搜索页初始化
        var _this = this;
        this.getSearchJson(1,keyword);
        this.takeMore(keyword);
        _this._cfg.main.on("click",".mz-wb-arrow",function(e){
            e.preventDefault();
            _this.vote($(this).attr('data-vote'),$(this),'vote');
        });
    },
    //我的作品列表初始化(无分页)
    myComicInit:function(){
        this.getMyComicJson();
        $(".loading-more").hide();
    },
    //我投票的作品列表初始化
    myVoteInit:function(){
        var _this = this;
        this.getMyVoteJson(1);
        this.takeMore();
        _this._cfg.main.on("click",".mz-wb-arrow",function(e){
            e.preventDefault();
            _this.vote($(this).attr('data-vote'),$(this),'vote');
        });
    },
    //详情页初始化
    detailInit:function(){
        $(".send-right input").blur();
        var _this = this;
        $(".send-right input").on("focus",function(){
            window.location.href = GLOBALS_VARS.site_www+"special/coser/comment?weibo_id="+_this.getParam('weibo_id');//这里改成评论页地址
        });
        _this._cfg.main.on("click",".mz-wb-arrow",function(e){  //绑定投票事件
            e.preventDefault();
            _this.vote($(this).attr('data-vote'),$(this),'vote');
        });
    },
    supportInit:function(){
        var weibo_id = this.getParam("weibo_id");
        this.vote(weibo_id,'','vote');
    },
    repostSupportInit:function(){//输入页初始化
        var _this = this;
        var weibo_id = this.getParam('weibo_id');
        this.refreshNum();
        $("textarea").on('keydown',function(){
            _this.refreshNum();
        });
        $(".title-zhuanfa .cancle").on("click",function(e){
            e.preventDefault();
            if(GLOBALS_VARS.page == 'comment' || GLOBALS_VARS.page == 'report_weibo'){
                window.location.href = GLOBALS_VARS.site_www+"/special/coser/show?weibo_id="+weibo_id;
            }else if(GLOBALS_VARS.page == 'repost_support_vote'){
                window.history.go(-1);
            }
        });
        $(".title-zhuanfa .send").on('click',function(e){
            e.preventDefault();
            var txt = _this.refreshNum();
            var number = 140-Math.ceil(_this.getStringLen(txt)/2);
            if(number<0){
                alert('字数超过140个，请删除相应字数后重新发送');
            }else if(number>=140){
                alert('请输入您要发送的内容');
            }else{
                if(GLOBALS_VARS.page == 'comment'){
                    _this.sendComment(weibo_id,txt);
                }else{
                    _this.sendWeibo(weibo_id,txt);
                }
            }
        });
    },
    join_favorite:function(siteUrl, siteName){
        alert("请手动操作添加书签");
    },
    //完善个人信息页初始化
    personInfoInit:function(){
        var _this = this;
        $(".input-submit input").on("click",function(e){
            e.preventDefault();
            var O_rea_name = $("#real-name"),
                O_qq = $("#qq"),
                O_phone = $("#tel"),
                O_card_no = $("#id-num");
            if(O_rea_name.val()||O_qq.val()||O_phone.val()||O_card_no.val()){
                var real_name = O_rea_name.val(),
                    qq = O_qq.val(),
                    phone = O_phone.val(),
                    card_no = O_card_no.val();

                var _json = {"real_name":real_name,"qq":qq,"phone":phone,"card_no":card_no};
                _this.commitPersonInfo(_json);
            }else{
                alert("请至少输入一项信息");
            }
        });
    },
    initAll:function(){
        var _this = this;
        $(".collect-button").on("click",function(e){
            e.preventDefault();
            _this.join_favorite('http://manhua.weibo.com','微漫画');
        });
    }
};
//评论列表文档  http://open.weibo.com/wiki/2/comments/show
GLOBALS_VARS.page = GLOBALS_VARS.page?GLOBALS_VARS.page:'';
_CoserWeibolist.initAll();
if(GLOBALS_VARS.page == 'lst'){    //列表页
    _CoserWeibolist.init();
}
if(GLOBALS_VARS.page == 'search'){ //搜索页
    var keyword = _CoserWeibolist.getParam('keyword');
    _CoserWeibolist.searchInit(keyword);
}
if(GLOBALS_VARS.page == 'my_comic_list'){ //我的作品列表
    _CoserWeibolist.myComicInit();
}
if(GLOBALS_VARS.page == 'my_vote_list'){ //我投票的作品列表
    _CoserWeibolist.myVoteInit();
}
if(GLOBALS_VARS.page == 'support_vote'){ //拉票中转页
    _CoserWeibolist.supportInit();
}
if(GLOBALS_VARS.page == 'repost_support_vote'||GLOBALS_VARS.page == 'report_weibo'||GLOBALS_VARS.page == 'comment'){ //拉票输入页
    _CoserWeibolist.repostSupportInit();
}
if(GLOBALS_VARS.page == 'show'){ //详情页
    _CoserWeibolist.detailInit();
}
if(GLOBALS_VARS.page == 'author_form'){
    _CoserWeibolist.personInfoInit();
}
//logs.js
//测试页面
const util = require('../../utils/util.js')

Page({
  data: {
    logs: [],
    str:'123',
    str2:'321'
  },
  onLoad: function () {
    this.setData({
      logs: (wx.getStorageSync('logs') || []).map(log => {
        return util.formatTime(new Date(log))
      })
    })
    wx.setNavigationBarTitle({
      title: '测试页面',
    })
  },
  onShow:function(){
    console.log('show:',res)
    var str = 'xxx.xxx.xxx&22:AC:22:22&BEL_SPP'
    var name,mac;
    var index1,index2;
    name = str.substring(str.indexOf('&')+1,str.lastIndexOf('&'))
    mac = str.substring(str.lastIndexOf('&')+1, str.length)
    if(mac.length>1&&name.length>1){
      this.setData({
        str: name,
        str2: mac+':true'
      })
    }else{
      this.setData({
        str: name,
        str2: mac+':false'
      })
    }
    
  },
  touchStart:function(res){
    console.log('start')
  }, touchMove:function(res){
    console.log('move')
  }, touchEnd:function(res){
    console.log('end')
  },
})

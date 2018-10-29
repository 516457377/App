//logs.js
//测试页面
const util = require('../../utils/util.js')

Page({
  data: {
    logs: [],
    str: '123',
    str2: '321'
  },
  onLoad: function() {
    var that = this;

    wx.getSystemInfo({
      success: function(res) {
        // 可使用窗口宽度、高度
        console.log('height=' + res.windowHeight);
        console.log('width=' + res.windowWidth);
        that.setData({
          // second部分高度 = 利用窗口可使用高度 - first部分高度（这里的高度单位为px，所有利用比例将300rpx转换为px）
          broud: res.windowWidth / 750 * that.data.broud
        })
      },
    })
    this.setData({

      logs: (wx.getStorageSync('logs') || []).map(log => {
        return util.formatTime(new Date(log))
      })
    })
    wx.setNavigationBarTitle({
      title: '测试页面',
    })
  },
  onShow: function() {
    // console.log('show:',res)
    var str = 'xxx.xxx.xxx&22:AC:22:22&BEL_SPP'
    var name, mac;
    var index1, index2;
    name = str.substring(str.indexOf('&') + 1, str.lastIndexOf('&'))
    mac = str.substring(str.lastIndexOf('&') + 1, str.length)
    if (mac.length > 1 && name.length > 1) {
      this.setData({
        str: name,
        str2: mac + ':true'
      })
    } else {
      this.setData({
        str: name,
        str2: mac + ':false'
      })
    }

  },
  touchStart: function(res) {
    console.log('start')
  },
  touchMove: function(res) {
    console.log('move')
  },
  touchEnd: function(res) {
    console.log('end')
  },
  button: function(e) {
    var buttonType = e.currentTarget.dataset.type
    console.log(buttonType)
    switch (buttonType) {
      case 'chaAdd':
        console.log('backward the channel')
        break
      case 'chaDes':
        console.log('forward the channel')
        break
      case 'volAdd':
        console.log('strengthen the volumn')
        break
      case 'volDes':
        console.log('weaken the volumn')
        break
      default:
        console.log('ok')
    }
  }
})
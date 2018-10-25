// pages/start/start.js
var num;
var app = getApp()
var result = false;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    mList: [{
      name: '未搜索到设备，请刷新',
      mac: ''
    }],
    openBle: false,
    UUID_SERVER: '0000fee0-0000-1000-8000-00805f9b34fb',
    debug: false,
    name: '',
    mac: '',
    ios: false

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log(this.route, 'onLoad')
    that = this;
    //检查设备型号
    wx.getSystemInfo({
      success: function(res) {
        console.log('info', res)
        if (res.system.indexOf('ios') || res.system.indexOf('iOS') || res.system.indexOf('Ios')) {
          that.setData({
            ios: true
          })
        }
      },
    })

    if (options.result) {
      result = true;
    }
    var that = this;
    wx.openBluetoothAdapter({
      success: function(res) {
        console.log('蓝牙初始化成功')
        that.setData({
          openBle: true
        })
        wx.startPullDownRefresh({})
      },
      fail: function(res) {
        console.log('蓝牙初始化失败')

        that.setData({
          openBle: false
        })
        wx.showLoading({
          title: '请打开蓝牙重试',
          mask: !that.data.debug,
        })
      }
    })

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   * 每次进入会调用
   */
  onShow: function() {

    this.setData({
      name: wx.getStorageSync('name'),
      mac: wx.getStorageSync('mac')
    })
    console.log(this.route, 'onShow', 'BLE has:', this.data.openBle, 'name:', this.data.name, '_result:', result)
    var that = this;
    if (that.data.name != null && that.data.name != '' && !result) {
      //存在数据直接连接
      wx.redirectTo({
        url: '../kongzhi/kongzhi?mac=' + that.data.mac + '&name=' + that.data.name,
        complete: function() {
          console.log('start结束')
        }
      })
    }
    if (that.data.openBle) {
      wx.startPullDownRefresh({})
    } else {
      wx.onBluetoothAdapterStateChange(function(res) { //会一直监听改变一次发送一次
        console.log('检测蓝牙状态：', res.available, res.discovering)
        if (!that.data.openBle && res.available) {
          that.setData({
            openBle: true
          })
          wx.startPullDownRefresh({})
        }
      })
    }
  },

  /**
   * 当蓝牙状态可用 开始搜索设备
   */
  searchDevice: function() {
    var that = this
    //清空当前列表
    that.setData({
      mList: [{}]
    })
    wx.hideLoading()
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: false,
      success: function(res) {
        console.log('打开扫描开始')

        // wx.onBluetoothDeviceFound(function(res) {
        //   console.log('发现设备', res)
        //   var ds = that.data.mList
        //   var temp = {
        //     name: res.devices[0].name,
        //     mac: res.devices[0].deviceId
        //   }
        //   ds.push(temp)
        //   that.setData({
        //     mList: ds
        //   })
        // })
      },
      fail: function(res) {
        console.log('打开扫描设备失败', res)
      }
    })
    //3秒后关闭扫描
    clearTimeout(num) //只需要一个定时器存在
    num = setTimeout(function() {
      wx.stopBluetoothDevicesDiscovery({
        success: function(res) {
          console.log('关闭扫描')
          wx.stopPullDownRefresh(); //停止当前页面的下拉刷新
          wx.hideNavigationBarLoading(); //加载动画结束
          wx.getBluetoothDevices({
            success: function(res) {
              console.log('所有设备', res)
              for (var i = 0; i < res.devices.length; i++) {
                var ds = that.data.mList
                if (res.devices[i].name.indexOf('t') == -1 &&
                  res.devices[i].name.indexOf('BLE') == -1) { //过滤不符合蓝牙
                  continue;
                }
                var temp = {
                  name: res.devices[i].name,
                  mac: res.devices[i].deviceId
                }
                ds.push(temp)
                that.setData({
                  mList: ds
                })
              }
            },
            fail: function(res) {
              that.setData({
                mList: [{
                  name: '未搜索到设备，请刷新',
                  mac: ''
                }]
              })
            },
            complete: function(res) {
              console.log('length:', that.data.mList)
              if (that.data.mList.length <= 0) {
                that.setData({
                  mList: [{
                    name: '未搜索到设备，请刷新',
                    mac: ''
                  }]
                })
              }

            }
          })
        },
      })
    }, 2500)
    // clearTimeout(num)

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    console.log('下拉刷新')
    wx.showNavigationBarLoading(); //加载动画开始

    this.searchDevice()


  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  // onShareAppMessage: function() {

  // },
  /**
   * 刷新
   */
  onRefresh: function() {
    wx.startPullDownRefresh({})
  },
  /**item 点击*/
  onItemClick: function(res) {
    console.log('itemclick', res.currentTarget.dataset.mac, res.currentTarget.dataset.name);
    if (res.currentTarget.dataset.mac == '' && !this.data.debug) {
      return
    }
    wx.redirectTo({
      url: '../kongzhi/kongzhi?mac=' + res.currentTarget.dataset.mac + '&name=' + res.currentTarget.dataset.name,
      complete: function() {
        console.log('start结束')
      }
    })
  },
  onClick: function(res) {
    var that = this
    wx.scanCode({
      success: function(res) {
        console.log(res.result, '扫码成功')
        var url = res.result;
        var name, mac;
        if (that.data.debug) {

        }
        // url = 'http://www.xxx.com/downapp/xxx&SPP_Ble&08:7C:BE:96:27:04'
        //http://www.xxx.com/downapp/xxx&SPP_Ble&08:7C:BE:96:27:04

        name = url.substring(url.indexOf('&') + 1, url.lastIndexOf('&'))
        mac = url.substring(url.lastIndexOf('&') + 1, url.length)
        if (mac.length > 1 && name.length > 1) {
          if (that.data.ios) {
            //如果是ios则通过名字连接，先扫描设备识别名字连接
            that.connectForName(name)
          } else {
            console.log('扫码跳转:', name, mac)
            wx.redirectTo({
              url: '../kongzhi/kongzhi?mac=' + mac + '&name=' + name,
              complete: function() {
                console.log('start结束')
              }
            })
          }
        } else {
          console.log('不跳转')

          wx.showToast({
            title: '二维码识别失败\n请扫描正确二维码',
            duration: 3000,
            icon: 'none'
            // image:'../../src/images/warning.png'
          })
          return;
        }



        // that.setData({
        //   url:res.result
        // })
      },
      fail: function(res) {
        console.log(res.result, '扫码失败')
      }
    })
  },
  connectForName:function(name){
    wx.getBluetoothDevices({
      success: function(res) {
        for(var i =0;i<res.devices.length;i++){
          if (res.devices[i].name == name || res.devices[i].localName == name){
            wx.redirectTo({
              url: '../kongzhi/kongzhi?mac=' + res.devices[i].deviceId + '&name=' + name,
              complete: function () {
                console.log('start结束')
              }
            })
          }
        }
      },
    })
  }
})
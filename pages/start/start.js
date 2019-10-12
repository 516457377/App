// pages/start/start.js
var num;
var app = getApp()
var result = false;
var autoName = 'Nodivice';
var jump = false;
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
    debug: __wxConfig.envVersion == "develop" ? true : false,
    name: '',
    mac: '',
    // ios: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log(this.route, 'onLoad');
    that = this;
    jump = false;
    autoName = 'Nodivice';
    //检查设备型号
    wx.getSystemInfo({
      success: function(res) {
        console.log('info', res, '版本', app.getVersion())
        // if (res.system.indexOf('ios') || res.system.indexOf('iOS') || res.system.indexOf('Ios')) {
        //   that.setData({
        //     ios: true
        //   })
        // }
      },
    })
    //版本判断
    if (app.getPlatform() == 'android' && this.versionCompare('6.5.7', app.getVersion())) {
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，请更新至最新版本',
        showCancel: false,
        success: function(res) {
          if (res.confirm) { //确认

          }
        }
      })
      return;
    } else if (app.getPlatform() == 'ios' && this.versionCompare('6.5.6', app.getVersion())) {
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，请更新至最新版本',
        showCancel: false
      })
      return;
    }

    if (options.result) {
      result = true;
    }
    var that = this;
    wx.openBluetoothAdapter({ //初始化蓝牙模块
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
  onReady: function() {},


  /**
   * 生命周期函数--监听页面显示
   * 每次进入会调用
   */
  onShow: function() {

    this.setData({
      name: wx.getStorageSync('name'),
      mac: wx.getStorageSync('mac')
    })

    var that = this;
    if (jump){
      return;
    }
    //延迟0.5秒触发，有可能初始化蓝牙有延迟。
    setTimeout(function() {
      console.log(this.route, 'onShow', 'BLE has:', that.data.openBle, 'name:', that.data.name, '_result:', result)

      if (that.data.name != null && that.data.mac != '' && !result && that.data.openBle && !jump) {
        //存在数据直接连接  
        jump = true;
        wx.hideLoading();
        wx.redirectTo({ 
          url: '../kongzhi/kongzhi?mac=' + that.data.mac + '&name=' + that.data.name,
          complete: function() {
            console.log('start结束')
            wx.stopPullDownRefresh();
          }
        })
      }

      if (that.data.name != null && that.data.mac != null && result) {
        autoName = that.data.name;
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

            if (that.data.name != null && that.data.mac != '' && !result && that.data.openBle && !jump) {
              //存在数据直接连接
              jump = true;
              wx.hideLoading();
              wx.redirectTo({
                url: '../kongzhi/kongzhi?mac=' + that.data.mac + '&name=' + that.data.name,
                complete: function() {
                  console.log('start结束')
                  wx.stopPullDownRefresh();
                }
              })
            } else {
              wx.startPullDownRefresh({})
            }
          }
        })
      }
    }, 500)

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

    wx.closeBluetoothAdapter({
      success: function(res) {},
    })
    wx.openBluetoothAdapter({
      success: function(res) {
        console.log("重启设备");
        wx.hideLoading()
        wx.startBluetoothDevicesDiscovery({
          allowDuplicatesKey: false,
          success: function(res) {
            console.log('打开扫描开始:', res)

            wx.onBluetoothDeviceFound(function(res) {
              console.log('发现设备', res)
              // var ds = that.data.mList
              // var temp = {
              //   name: res.devices[0].name,
              //   mac: res.devices[0].deviceId
              // }
              // ds.push(temp)
              // that.setData({
              //   mList: ds
              // })
            })
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

              wx.getBluetoothDevices({
                success: function(res) {
                  console.log('所有设备', res)
                  for (var i = 0; i < res.devices.length; i++) {
                    var ds = that.data.mList
                    if (res.devices[i].localName.indexOf('t') == -1 &&
                      res.devices[i].localName.indexOf('BLE') == -1) { //过滤不符合蓝牙
                      continue;
                    }
                    var temp = {
                      name: res.devices[i].localName,
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
                  console.log('关闭扫描')
                  wx.stopPullDownRefresh(); //停止当前页面的下拉刷新
                  wx.hideNavigationBarLoading(); //加载动画结束
                  console.log('扫描结果：length:', that.data.mList, '可能连接名：', autoName)
                  if (that.data.mList.length <= 1) {
                    console.log('没有扫描到')
                    that.setData({
                      mList: [{
                        name: '未搜索到设备，请刷新',
                        mac: ''
                      }]
                    })
                  } else {
                    var remeber = -1;
                    for (var i = 0; i < that.data.mList.length; i++) {
                      if (autoName == that.data.mList[i].name && !jump) {
                        console.log('找到了相符的:', autoName, i);
                        remeber = i;
                        wx.showModal({
                          title: '发现可重连设备',
                          content: '是否重连',
                          showCancel: true,
                          success(res) {
                            if (res.confirm) {
                              console.log('点击确认重连', remeber);
                              jump = true;
                              wx.hideLoading();
                              wx.redirectTo({
                                url: '../kongzhi/kongzhi?mac=' + that.data.mList[remeber].mac + '&name=' + that.data.mList[remeber].name,
                                complete: function() {

                                  return;
                                }
                              })

                            } else {
                              console.log('取消重连');
                              autoName = 'Nodivice';
                            }
                          }
                        })
                      }
                    }
                  }

                }
              })
            },
          })
        }, 2500)
      },
    })


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
    if (res.currentTarget.dataset.mac == '' && !this.data.debug && !jump) {
      return
    }
    jump = true;
    wx.hideLoading();
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
        // name = url.substring(url.indexOf('&') + 1, url.lastIndexOf('&'))
        // mac = url.substring(url.lastIndexOf('&') + 1, url.length)

        if (url.indexOf('##') != -1) { //识别码 双#
          name = url.substring(url.indexOf('##') + 2);
          that.connectForName(name)
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


        // if (mac.length > 1 && name.length > 1) {
        //   if (that.data.ios) {
        //     //如果是ios则通过名字连接，先扫描设备识别名字连接
        //     that.connectForName(name)
        //   } else {
        //     console.log('扫码跳转:', name, mac)
        //     wx.redirectTo({
        //       url: '../kongzhi/kongzhi?mac=' + mac + '&name=' + name,
        //       complete: function() {
        //         console.log('start结束')
        //       }
        //     })
        //   }
        // } else {
        //   console.log('不跳转')

        //   wx.showToast({
        //     title: '二维码识别失败\n请扫描正确二维码',
        //     duration: 3000,
        //     icon: 'none'
        //     // image:'../../src/images/warning.png'
        //   })
        //   return;
        // }



        // that.setData({
        //   url:res.result
        // })
      },
      fail: function(res) {
        console.log(res.result, '扫码失败')
        wx.showToast({
          title: '二维码识别失败\n请扫描正确二维码',
          duration: 3000,
          icon: 'none'
          // image:'../../src/images/warning.png'
        })
      }
    })
  },
  connectForName: function(name) {
    wx.getBluetoothDevices({
      success: function(res) {

        for (var i = 0; i < res.devices.length; i++) {

          if (res.devices[i].name.indexOf(name) > -1 || res.devices[i].localName.indexOf(name) > -1) {
            if (!jump) {
              jump = true;
              
              wx.hideLoading();
              wx.redirectTo({
                url: '../kongzhi/kongzhi?mac=' + res.devices[i].deviceId + '&name=' + res.devices[i].localName,
                complete: function() {
                  console.log('start结束')
                  wx.stopPullDownRefresh();
                  return;
                }
              })
            }

          }
        }
        console.log("没有找到合适的连接设备");
        wx.showToast({
          title: '二维码连接失败\n请确认设备状态后重试',
          duration: 3000,
          icon: 'none'
          // image:'../../src/images/warning.png'
        })
      },
    })
  },
  /**版本比较*/
  versionCompare: function(ver1, ver2) {
    var version1pre = parseFloat(ver1)
    var version2pre = parseFloat(ver2)
    var version1next = parseInt(ver1.replace(version1pre + ".", ""))
    var version2next = parseInt(ver2.replace(version2pre + ".", ""))
    if (version1pre > version2pre)
      return true
    else if (version1pre < version2pre)
      return false
    else {
      if (version1next > version2next)
        return true
      else
        return false
    }
  }
})
// pages/kongzhi/kongzhi.js
var app = getApp;
var mac;
var name;
var X, Y;
var hasMove = false;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    deviceID: '', //当前连接设备id(MAC)
    UUID_SERVER: '0000FEE0-0000-1000-8000-00805F9B34FB',
    UUID_WRITE: '0000FEE2-0000-1000-8000-00805F9B34FB',
    UUID_READ: '0000FEE1-0000-1000-8000-00805F9B34FB',
    mDevice: null,
    show: false,
    show_lun: true,
    debug: false,
    longClick: false,
    connect: false,
    NumOut: false,
    slider: 0,

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this;
    mac = options.mac
    name = options.name

    console.log('kongzhi', mac, name, 'connect:', that.data.connect);

    wx.showLoading({
      title: '连接中',
      mask: !that.data.debug,
    });

    wx.createBLEConnection({
      deviceId: mac,
      timeout: 5000,
      success: function(res) {
        that.onConnectOK(res)
      },
      fail: function(res) {
        // that.onConnectNO(res)
        console.log('第一次连接失败', res)
        //第一次失败1秒后再次连接
        setTimeout(function() {
          wx.createBLEConnection({
            deviceId: mac,
            timeout: 10000,
            success: function(res) {
              that.onConnectOK(res)
            },
            fail: function(res) {
              that.onConnectNO(res)
            }
          })
        }, 2000)
      }
    })

  },
  /**
   * 蓝牙连接成功
   */
  onConnectOK: function(res) {
    var that = this;
    console.log('蓝牙连接成功', res)

    // wx.setStorage({
    //   key: '',
    //   data: '',
    // })

    wx.getBLEDeviceServices({
      deviceId: mac,
      success: function(res) {
        console.log('获取到severuuid', res)
        that.setData({
          connect: true
        })
        
        wx.setNavigationBarTitle({
          title: name + '(已连接)',
        })
        wx.hideLoading()
        wx.setStorageSync('name', name)
        wx.setStorageSync('mac', mac)
        wx.onBLEConnectionStateChange(function(res) { //蓝牙状态监听
          console.log('连接状态', res.connected, "connect:", that.data.connect)
          if (!res.connected && that.data.connect) {
            //蓝牙断开后回到首页
            console.log('监听跳转')
            wx.reLaunch({
              url: '../start/start?result=true',
            })
          }
        })
        wx.getBLEDeviceCharacteristics({
          deviceId: mac,
          serviceId: that.data.UUID_SERVER,
          success: function(res) {
            console.log('特征码', res)
          }
        })
      },
      fail: function(res) {
        console.log('serverid获取失败', res);
        if (that.data.NumOut) {
          that.onConnectNO(res)
          return;
        }
        that.setData({
          NumOut: true
        })
        wx.closeBluetoothAdapter({
          success: function(res) {
            console.log('适配器重启');
            wx.openBluetoothAdapter({
              success: function(res) {
                console.log('重启后重连')
                wx.createBLEConnection({
                  deviceId: mac,
                  timeout: 3000,
                  success: function(res) {
                    console.log('重连成功')
                    that.onConnectOK(res);
                  },
                  fail: function(res) {
                    console.log('第一次重接失败', res)
                    //第一次失败2秒后再次连接
                    setTimeout(function() {
                      wx.createBLEConnection({
                        deviceId: mac,
                        timeout: 5000,
                        success: function(res) {
                          that.onConnectOK(res)
                        },
                        fail: function(res) {
                          that.onConnectNO(res)
                        }
                      })
                    }, 2000)
                  }
                })
              },
            })
          },
        })
        // wx.closeBLEConnection({
        //   deviceId: mac,
        //   success: function(res) {
        //     console.log('断开连接重连')
        //     wx.createBLEConnection({
        //       deviceId: mac,
        //       timeout: 5000,
        //       success: function(res) {
        //         console.log('重连成功')
        //         that.onConnectOK(res);
        //       },
        //       fail: function(res) {
        //         console.log('第一次重接失败', res)
        //         //第一次失败2秒后再次连接
        //         setTimeout(function() {
        //           wx.createBLEConnection({
        //             deviceId: mac,
        //             timeout: 10000,
        //             success: function(res) {
        //               that.onConnectOK(res)
        //             },
        //             fail: function(res) {
        //               that.onConnectNO(res)
        //             }
        //           })
        //         }, 2000)
        //       }
        //     })
        //   },
        // })

      }
    })

    wx.notifyBLECharacteristicValueChange({
      deviceId: mac,
      serviceId: that.data.UUID_SERVER,
      characteristicId: that.data.UUID_READ,
      state: true,
      success: function(res) {
        console.log('监听开启成功')
        //请求音量
        const sound = new Int8Array(3);
        sound[0] = 121;
        sound[1] = -121;
        sound[2] = 124;
        that.wirte(sound)

        wx.onBLECharacteristicValueChange(function(res) {
          console.log('收到消息:', res);
          var v = res.value;
          var array = new Int8Array(v);
          that.setData({
            slider: array[0]
          })
          console.log(array)
        })
      },
    })
  },
  /**蓝牙连接失败*/
  onConnectNO: function(res) {
    var that = this
    console.log('蓝牙连接失败', res)
    wx.showToast({
      title: '连接失败请重试',
      icon: 'none',
      image: '../../src/images/warning.png',
      mask: !that.data.debug,
      duration: 2000

    })
    if (!that.data.debug) {
      setTimeout(function() {
        console.log('链接失败跳转')
        wx.reLaunch({
          url: '../start/start?result=true',
        })
      }, 2000)
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    var that = this;

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    // wx.closeBLEConnection({
    //   deviceId: this.data.deviceID,
    //   success: function(res) {
    //     console.log('关闭蓝牙连接')
    //   },fail:function(res){
    //     console.log('关闭蓝牙连接失败')
    //   }
    // })
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    wx.closeBLEConnection({
      deviceId: mac,
      success: function(res) {
        console.log('关闭蓝牙连接')
      },
    })

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

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
   * 长按
   */
  onLongClick: function(res) {
    var that = this
    console.log('长按')
    that.setData({
      longClick: true
    })
    const down = new Int8Array(3);
    down[0] = 121;
    down[1] = -121;
    down[2] = 126;
    wx.vibrateShort({})
    that.wirte(down)
    setTimeout(function() {
      const up = new Int8Array(3);
      up[0] = 121;
      up[1] = -121;
      up[2] = 127;
      wx.vibrateShort({})
      that.wirte(up)
    }, 800)

  },

  /**
   * 按钮点击事件 
   */
  onClickUp: function(event) {
    var that = this;
    console.log(event)
    switch (event.currentTarget.id) {
      case 'top1':
        console.log('top1')
        const close = new Int8Array(5);
        close[0] = 101;
        close[1] = -1;
        close[2] = 0;
        close[3] = 0;
        close[4] = 100;
        this.wirte(close)
        wx.vibrateShort({})

        break;
      case 'top2':
        console.log('top2')
        const home = new Int8Array(3);
        home[0] = 121;
        home[1] = -121;
        home[2] = 3;
        this.wirte(home)
        wx.vibrateShort({})
        break;
      case 'top3':
        console.log('top3')
        const menu = new Int8Array(3);
        menu[0] = 121;
        menu[1] = -121;
        menu[2] = 82;
        this.wirte(menu)
        wx.vibrateShort({})
        break;
      case 'top_gun':
        that.setData({
          show_lun: !that.data.show_lun
        })
        break;
      case 'top4':
        console.log('top4')
        this.setData({
          show: !this.data.show
        })
        wx.vibrateShort({})
        break;
      case 'up':
        console.log('up')
        const up = new Int8Array(3);
        up[0] = 121;
        up[1] = -121;
        up[2] = 19;
        this.wirte(up)
        wx.vibrateShort({})
        break;
      case 'left':
        console.log('left')
        const left = new Int8Array(3);
        left[0] = 121;
        left[1] = -121;
        left[2] = 21;
        this.wirte(left)
        wx.vibrateShort({})
        break;
      case 'enter':
        console.log('enter')
        const enter = new Int8Array(3);
        enter[0] = 121;
        enter[1] = -121;
        enter[2] = 23;
        this.wirte(enter)
        wx.vibrateShort({})
        break;
      case 'right':
        console.log('right')
        const right = new Int8Array(3);
        right[0] = 121;
        right[1] = -121;
        right[2] = 22;
        this.wirte(right)
        wx.vibrateShort({})
        break;
      case 'down':
        console.log('down')
        const down = new Int8Array(3);
        down[0] = 121;
        down[1] = -121;
        down[2] = 20;
        this.wirte(down)
        wx.vibrateShort({})
        break;
      case 'back':
        console.log('back')
        const back = new Int8Array(3);
        back[0] = 121;
        back[1] = -121;
        back[2] = 4;
        this.wirte(back)
        wx.vibrateShort({})
        break;
      case 'zhuxiao':
        wx.vibrateShort({})
        wx.clearStorageSync()
        that.setData({
          connect: false
        })
        wx.closeBLEConnection({
          deviceId: mac,
          success: function(res) {
            console.log('断开链接')
            that.disConnect();
          },
          complete: function(res) {
            console.log('点击跳转到链接页面')
            wx.reLaunch({
              url: '../start/start',
            })
          }
        })
        break;
      case 'ceiling_up':
        console.log('ceiling_up')
        const ceiling_up = new Int8Array(5);
        ceiling_up[0] = 97;
        ceiling_up[1] = -1;
        ceiling_up[2] = 0;
        ceiling_up[3] = 0;
        ceiling_up[4] = 96;
        this.wirte(ceiling_up)
        wx.vibrateShort({})
        break;

      case 'ceiling_down':
        console.log('ceiling_down')
        const ceiling_down = new Int8Array(5);
        ceiling_down[0] = 96;
        ceiling_down[1] = -1;
        ceiling_down[2] = 0;
        ceiling_down[3] = 0;
        ceiling_down[4] = 95;
        this.wirte(ceiling_down)
        wx.vibrateShort({})
        break;
    }

  },
  button: function(e) {
    var buttonType = e.currentTarget.dataset.type
    console.log(buttonType)
    switch (buttonType) {
      case 'chaAdd':
        console.log('right')
        const right = new Int8Array(3);
        right[0] = 121;
        right[1] = -121;
        right[2] = 22;
        this.wirte(right)
        wx.vibrateShort({})
        break
      case 'chaDes':
        console.log('left')
        const left = new Int8Array(3);
        left[0] = 121;
        left[1] = -121;
        left[2] = 21;
        this.wirte(left)
        wx.vibrateShort({})
        break
      case 'volAdd':
        console.log('up')
        const up = new Int8Array(3);
        up[0] = 121;
        up[1] = -121;
        up[2] = 19;
        this.wirte(up)
        wx.vibrateShort({})
        break
      case 'volDes':
        console.log('down')
        const down = new Int8Array(3);
        down[0] = 121;
        down[1] = -121;
        down[2] = 20;
        this.wirte(down)
        wx.vibrateShort({})
        break
      default:
        console.log('enter')
        const enter = new Int8Array(3);
        enter[0] = 121;
        enter[1] = -121;
        enter[2] = 23;
        this.wirte(enter)
        wx.vibrateShort({})
        //5.1
        break;
    }
  },
  /**
   * 写入数据事件
   */
  wirte: function(buff) {
    var that = this;
    wx.writeBLECharacteristicValue({
      deviceId: mac,
      serviceId: that.data.UUID_SERVER,
      characteristicId: that.data.UUID_WRITE,
      value: buff.buffer,
      success: function(res) {
        console.log('发送成功', res)
      },
      fail(res) {
        console.log(res, "发送失败")
      }
    })
  },
  connect: function() {

  },
  onTouch: function(res) {
    hasMove = true
    var xm, ym;
    xm = X - res.touches[0].x;
    ym = Y - res.touches[0].y;
    X = res.touches[0].x;
    Y = res.touches[0].y;
    console.log('move', xm, ym)
    ym *= 2.5;
    xm *= 2.5;
    if (xm < -100) {
      xm = -100;
    }
    if (xm > 100) {
      xm = 100;
    }
    if (ym < -100) {
      ym = -100;
    }
    if (ym > 100) {
      ym = 100;
    }
    console.log('move', xm, ym)
    const move = new Int8Array(2);
    move[0] = xm;
    move[1] = ym;
    this.wirte(move)
  },
  onTouchStart: function(res) {
    hasMove = false
    console.log('start', res)
    X = res.touches[0].x;
    Y = res.touches[0].y;
    const start = new Int8Array(2);
    if (this.data.show_lun) {
      start[0] = 122;
      start[1] = -122;

    } else {
      start[0] = -122;
      start[1] = 122;
      // const up = new Int8Array(3);
      // up[0] = 121;
      // up[1] = -121;
      // up[2] = 126;
      // wx.vibrateShort({})
      // that.wirte(up)
    }
    this.wirte(start)

  },
  onTouchEnd: function(res) {
    var that = this;
    console.log('end', res)
    if (that.data.longClick) {
      that.setData({
        longClick: false
      })
      return;
    }

    if (!hasMove) { //点击事件
      const click = new Int8Array(3);
      click[0] = 121;
      click[1] = -121;
      click[2] = 125;
      that.wirte(click)
      wx.vibrateShort({})
    }
    if (!this.data.show_lun) { //弹起
      setTimeout(function() {
        const up = new Int8Array(3);
        up[0] = 121;
        up[1] = -121;
        up[2] = 127;
        that.wirte(up)
        wx.vibrateShort({})
        that.setData({
          show_lun: true
        })
      }, 200)
    }

  },
  changeSlider: function(res) {
    this.setData({
      slider: res.detail.value
    })
  },
  /**
   * 音量改变
   */
  change: function(res) {
    this.setData({
      slider: res.detail.value
    })
    console.log(res)
    const sound = new Int8Array(3);
    sound[0] = 123;
    sound[1] = -123;
    sound[2] = res.detail.value;
    this.wirte(sound)
    wx.vibrateShort({})
  },
  disConnect: function() {
    wx.createBLEConnection({
      deviceId: '00:00:00:00:00',
      success: function(res) {
        console.log("这也能连接成功？");
      },
      fail: function(res) {
        console.log("尝试连接失败");
      }
    })
  },

})
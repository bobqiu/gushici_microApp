// pages/songci/songci.js
var config = require('../../config')
var util = require('../../utils/util.js')
Page({
  data: {
    songciItem: null,
    audioId: 0,
    duration: 0,
    audioUrl: '',
    currentSongci: '',
    poster: 'http://m.qpic.cn/psb?/V121Rqgy1YUsix/IviqfBJYA85bdpCyovu1Pi2.YVOCku1MlgYcy4FbGv0!/b/dDEBAAAAAAAA&bo=7wHzAQAAAAARByw!&rf=viewer_4',
    currentTab: 0,
    show_content: '',
    playing: false,
    duration_show: '',
    current_time_show: '',
    seek2: 0,
    slideValue: 0,
    time2close: 0,
    closeplaytime: 0
  },
  text2audio: function (e) {
    var that = this
    var id_ = e.target.dataset.id_
    var title = e.target.dataset.title
    var author = e.target.dataset.author
    wx.showLoading({
      title: '音频加载中...',
    })
    wx.request({
      url: config.service.host + '/songci/text2audio/' + id_,
      success: function (res) {
        if (res && res.statusCode == 200 && res.data.code == 0) {
          var urls = res.data.data.data
          if (!urls || urls.length == 0) {
            wx.hideLoading();
            return
          }
          var old_play_mode = that.get_play_mode();
          wx.setStorageSync('old_play_mode', old_play_mode);
          wx.setStorageSync('play_mode', 'hc')
          that.setData({
            mode: 'hc'
          })
          that.backgroundAudioManager.src = urls[0]
          that.backgroundAudioManager.title = title
          that.backgroundAudioManager.singer = author
          that.backgroundAudioManager.coverImgUrl = that.data.poster
          that.backgroundAudioManager.epname = 'i古诗词'
          that.backgroundAudioManager.play()
          wx.setStorageSync('text2audio', true)
          wx.setStorageSync('text2audiourls', urls.slice(1))
          wx.setStorageSync('text2audiotitle', title)
          wx.setStorageSync('text2audioauthor', author)
          setTimeout(() => {
            wx.hideLoading();
          }, 500)
        } else {
          wx.showToast({
            title: '网络异常~~',
            icon: 'none'
          })
        }
      }, fail: function (e) {
        wx.showToast({
          title: '网络异常~~',
          icon: 'none'
        })
      }
    })
  },
  setTimed: function () {
    var that = this
    wx.showActionSheet({
      itemList: ['2小时', '1小时', '30分钟', '10分钟', '播放完这首', '不设置'],
      success: function (res) {
        var index = res.tapIndex
        var seconds = 0
        switch (index) {
          case 0:
            seconds = 7200
            break
          case 1:
            seconds = 3600
            break
          case 2:
            seconds = 1800
            break
          case 3:
            seconds = 600
            break
          case 4:
            var currentTime = that.backgroundAudioManager.currentTime
            seconds = that.backgroundAudioManager.duration - (currentTime ? currentTime : 0) + 0.5
            break
          case 5:
            seconds = -1
            break
        }
        try {
          var setTimedInt = wx.getStorageSync('setTimedInt')
          if (!setTimedInt) {
            setTimedInt = 0
          }
        } catch (e) {
          setTimedInt = 0
        }
        if (seconds == -1) {
          wx.removeStorageSync('time2close')
          wx.removeStorageSync('closeplaytime')
          if (that.data.time2close && that.data.time2close != 0) {
            if (setTimedInt > 0) {
              clearInterval(setTimedInt)
              wx.setStorageSync('setTimedInt', 0)
            }
            wx.showToast({
              title: '取消成功',
              icon: 'none'
            })
          }
          that.setData({
            time2close: 0,
            closeplaytime: 0
          })
        } else {
          var time2close = (new Date).getTime() / 1000 + seconds
          if (that.data.playing) {
            wx.showToast({
              title: '播放器将于' + util.timetrans(time2close).slice(11) + '关闭',
              icon: 'none'
            })
            if (setTimedInt > 0) {
              clearInterval(setTimedInt)
              wx.setStorageSync('setTimedInt', 0)
            }
            wx.setStorageSync('time2close', time2close)
            wx.setStorageSync('closeplaytime', parseInt(seconds / 60))
            that.setData({
              time2close: time2close,
              closeplaytime: parseInt(seconds / 60)
            })
            var timedId = setInterval(() => {
              try {
                var time2closeS = wx.getStorageSync('time2close')
              } catch (e) {
                time2closeS = 0
              }
              if (!time2closeS || time2closeS == 0 || (new Date()).getTime() >= time2close * 1000) {
                that.pauseplaybackmusic()
                that.setData({
                  time2close: 0,
                  closeplaytime: 0
                })
                wx.showToast({
                  title: '定时已到~~',
                  icon: 'none'
                })
                wx.removeStorageSync('time2close')
                wx.removeStorageSync('closeplaytime')
                clearInterval(timedId)
                wx.setStorageSync('setTimedInt', 0)
              }
            }, 3000)
            wx.setStorageSync('setTimedInt', timedId)
          } else {
            wx.showToast({
              title: '请先打开播放器',
              icon: 'none'
            })
          }
        }
      },
      fail: function (res) {
      }
    })
  },
  change_mode: function () {
    //xunhuan->one->shuffle->xunhuan
    var that = this
    var mode = "xunhuan"
    if (this.data.mode == 'hc') {
      wx.showToast({
        title: '请等待语音播放完毕...',
        icon: 'none'
      })
      return false
    }
    if (this.data.mode == 'xunhuan') {
      this.setData({
        mode: "one"
      })
      mode = "one"
      wx.showToast({
        title: '单曲循环',
        icon: 'none'
      })
      wx.setStorageSync('singleid', { 'id': that.data.songciItem.id, 'url': that.data.audioUrl, 'title': that.data.songciItem.work_title, 'author': that.data.songciItem.work_author })
    } else if (this.data.mode == 'one') {
      this.setData({
        mode: "shuffle"
      })
      wx.showToast({
        title: '随机播放',
        icon: 'none'
      })
      mode = "shuffle"
    } else if (this.data.mode == 'shuffle') {
      this.setData({
        mode: "xunhuan"
      })
      wx.showToast({
        title: "循环播放",
        icon: 'none'
      })
      mode = "xunhuan"
    }
    try {
      wx.setStorageSync('play_mode', mode)
    } catch (e) { }
  },
  get_by_id: function (key, pull = false) {
    if (!pull) {
      wx.showLoading({
        title: '加载中...'
      });
    }
    var that = this
    wx.getStorage({
      key: 'songci' + key + util.formatTime(new Date()),
      success: function (res) {
        var d = res.data;
        that.setData(d);
        that.get_play_mode();
        var time2close = wx.getStorageSync('time2close')
        that.setData({
          time2close: time2close && time2close > 0 ? time2close : 0
        });
        if (time2close && time2close > 0) {
          var last_micro_seconds = time2close - (new Date()).getTime() / 1000
          if (last_micro_seconds) {
            that.setData({
              closeplaytime: parseInt(last_micro_seconds / 60.0 + 0.5)
            });
          }
        }
      },
      fail: function () {
        var open_id = ''
        try {
          open_id = wx.getStorageSync('user_open_id')
        } catch (e) {
        }
        if (!open_id) {
          util.userLogin()
        }
        wx.request({
          url: config.songciUrl + 'index/' + key + '/' + open_id,
          success(result) {
            if (!result || result.data.code != 0) {
              wx.showToast({
                title: '网络异常~~',
                icon: 'none'
              })
              return
            }
            var target_id = 0
            var work = result.data.data.data
            var show_content = ''
            if (work.intro) {
              target_id = 0
              show_content = work.intro
            } else if (work.annotation) {
              target_id = 1
              show_content = work.annotation
            } else if (work.translation) {
              target_id = 2
              show_content = work.translation
            } else if (work.appreciation) {
              target_id = 3
              show_content = work.appreciation
            } else if (work.master_comment) {
              target_id = 4
              show_content = work.master_comment
            }
            show_content = show_content.replace(/\n/g, "\n&emsp;&emsp;")
            show_content = show_content.replace(/\t/g, "\n&emsp;&emsp;")
            if (work.id % 4 != 0) {
              var url = config.neteaseAudioUrl
            } else {
              var url = config.songciAudioUrl
            }
            if (work.layout == 'indent') {
              work.content = work.content.replace(/\n/g, "\n&emsp;&emsp;")
              work.content = work.content.replace(/\t/g, "\n&emsp;&emsp;")
            }
            that.setData({
              songciItem: work,
              audioId: work.audio_id,
              audioUrl: url +
              work.audio_id + '.m4a',
              currentSongci: work.work_title + '-' + work.work_author,
              currentTab: target_id,
              show_content: show_content,
              duration_show: '',
              current_time_show: '',
              seek2: 0,
              slideValue: 0
            });
            if (work.like == 1) {
              wx.setStorage({
                key: 'songci' + key + util.formatTime(new Date()),
                data: that.data,
              })
            }
            that.get_play_mode();
            var time2close = wx.getStorageSync('time2close')
            that.setData({
              time2close: time2close && time2close > 0 ? time2close : 0
            });
            if (time2close && time2close > 0) {
              var last_micro_seconds = time2close - (new Date()).getTime() / 1000
              if (last_micro_seconds) {
                that.setData({
                  closeplaytime: parseInt(last_micro_seconds / 60.0 + 0.5)
                });
              }
            }
          }
        });
      }
    });
  },
  do_operate_play: function (key, mode = "xunhuan") {
    var that = this
    var music_ids = wx.getStorageSync('music_ids')
    if (!music_ids) {
      wx.showToast({
        title: '播放失败~~',
        icon: 'none'
      })
      return
    }
    var play_id = 1
    var mode = that.data.mode
    if (mode == 'xunhuan') {
      var index = music_ids.indexOf(
        that.data.songciItem.id)
      //循环播放
      if (key == 'next') {
        if (index == music_ids.length - 1) {
          play_id = music_ids[0]
        } else {
          play_id = music_ids[index + 1]
        }
      } else {
        if (index == 0) {
          play_id = music_ids[music_ids.length - 1]
        } else {
          play_id = music_ids[index - 1]
        }
      }
    } else if (that.data.mode == 'one') {
      //单曲循环
      try {
        var play_id_url = wx.getStorageSync('singleid')
        that.backgroundAudioManager.src = play_id_url.url
        that.backgroundAudioManager.title = play_id_url.title
        that.backgroundAudioManager.singer = play_id_url.author
        that.backgroundAudioManager.coverImgUrl = that.data.poster
        that.backgroundAudioManager.epname = 'i古诗词'
        that.backgroundAudioManager.play()
        if (play_id_url.title) {
          that.record_play(play_id_url.id, play_id_url.title + '-' + play_id_url.author);
        }
      } catch (e) {
        wx.setStorageSync('singleid', { 'id': that.data.songciItem.id, 'url': that.data.audioUrl, 'title': that.data.songciItem.work_title, 'author': that.data.songciItem.work_author })
        that.backgroundAudioManager.src = that.data.audioUrl
        that.backgroundAudioManager.title = that.data.songciItem.work_title
        that.backgroundAudioManager.epname = 'i古诗词'
        that.backgroundAudioManager.singer = that.data.songciItem.work_author
        that.backgroundAudioManager.coverImgUrl = that.data.poster
        that.backgroundAudioManager.play()
        if (that.data.songciItem && that.data.songciItem.work_title) {
          that.record_play(that.data.songciItem.id, that.data.songciItem.work_title + '-' + that.data.songciItem.work_author);
        }
      }
    } else {
      //随机播放
      var play_id = parseInt(music_ids.length * Math.random())
      if (play_id >= music_ids.length) {
        play_id = music_ids.length - 1
      }
      play_id = music_ids[play_id]
    }
    if (mode != 'one') {
      try {
        that.get_by_id(play_id)
        var try_times = 0
        var playInt = setInterval(() => {
          if (that.data.songciItem && that.data.songciItem.id == play_id) {
            that.playsound();
            if (that.data.songciItem.work_title) {
              that.record_play(play_id, that.data.songciItem.work_title + '-' + that.data.songciItem.work_author);
            }
            clearInterval(playInt)
          }
          try_times++
          if (try_times >= 100) {
            wx.showToast({
              title: '播放失败:(',
              icon: 'none'
            });
            clearInterval(playInt)
          }
        }, 600)
      } catch (e) {
        wx.showToast({
          title: '播放失败:(',
          icon: 'none'
        })
      }
    }
    wx.setStorageSync('text2audio', false)
    wx.setStorageSync('text2audiourls', [])
  },
  operate_play: function (e) {
    var key = e.target.dataset.key
    this.do_operate_play(key, this.data.mode)
  },
  operate_like: function (e) {
    var like = e.target.dataset.like
    var operate = like == 1 ? 'dislike' : 'like'
    var that = this
    wx.getStorage({
      key: 'user_open_id',
      success: function (res) {
        var open_id = res.data;
        var gsc_id = that.data.songciItem.id
        wx.request({
          url: config.service.host + '/user/' + operate + '/' + open_id + '/' + gsc_id,
          success: function (res) {
            if (!res || res.data.code != 0) {
              wx.showToast({
                title: '网络异常~~',
                icon: 'none'
              });
              return
            }
            wx.showToast({
              title: res.data.data,
              icon: 'none'
            });
            if (res.data.code == 0) {
              var songciItem = that.data.songciItem
              if (operate == 'like') {
                songciItem.like = 1
              } else {
                songciItem.like = 0
              }
              that.setData({
                songciItem: songciItem
              })
              wx.removeStorage({
                key: 'songci' + songciItem.id + util.formatTime(new Date())
              })
            }
          }
        })
      },
      fail: function () {
        wx.showToast({
          title: '请稍后再试',
          icon: 'none'
        });
        util.userLogin()
      }
    })
  },
  pauseplaybackmusic: function () {
    this.backgroundAudioManager.pause()
    var currentTime = 1
    if (this.backgroundAudioManager.currentTime && this.backgroundAudioManager.currentTime > 1) {
      currentTime = this.backgroundAudioManager.currentTime
    }
    this.setData({
      seek2: currentTime,
      slideValue: parseInt(currentTime / this.backgroundAudioManager.duration),
      playing: false
    });
  },
  playbackmusic: function (e) {
    var that = this
    var mode = wx.getStorageSync('play_mode')
    if (mode == 'hc') {
      that.reset_playmode();
    }
    if (that.data.playing) {
      that.pauseplaybackmusic()
    } else {
      if (that.data.mode == 'one') {
        wx.setStorageSync('singleid', { 'id': that.data.songciItem.id, 'url': that.data.audioUrl, 'title': that.data.songciItem.work_title, 'author': that.data.songciItem.work_author })
      }
      that.playsound();
      if (that.data.songciItem && that.data.songciItem.work_title) {
        that.record_play(that.data.songciItem.id, that.data.songciItem.work_title + '-' + that.data.songciItem.work_author);
      }
      wx.setStorageSync('text2audio', false)
      wx.setStorageSync('text2audiourls', [])
    }
  },
  record_play: function (id_, title) {
    var that = this
    var historyplay = wx.getStorageSync('historyplay')
    if (!historyplay) {
      historyplay = {}
    }
    if (historyplay.hasOwnProperty(id_ + '')) {
      var old_data = historyplay[id_]
      old_data['times'] += 1
      historyplay[id_] = old_data
    } else {
      historyplay[id_] = { 'id': id_, 'title': title, 'times': 1 }
    }
    wx.setStorageSync('historyplay', historyplay)
  },
  search_: function (e) {
    var id_ = e.target.dataset.id_
    var q = e.target.dataset.q
    var pages = getCurrentPages()
    var url = '/pages/catalog/catalog?id=' + id_ + '&q=' + q
    if (pages.length == config.maxLayer) {
      util.pageConfirm(url)
    } else {
      wx.navigateTo({
        url: url
      });
    }
  },
  changeContent: function (e) {
    var target_id = e.target.dataset.item
    var gsc = this.data.songciItem
    var show_content = ''
    switch ('' + target_id) {
      case '0':
        show_content = gsc.intro
        break
      case '1':
        show_content = gsc.annotation
        break
      case '2':
        show_content = gsc.translation
        break
      case '3':
        show_content = gsc.appreciation
        break
      case '4':
        show_content = gsc.master_comment
        break
    }
    show_content = show_content.replace(/\n/g, "\n&emsp;&emsp;")
    show_content = show_content.replace(/\t/g, "\n&emsp;&emsp;")
    this.setData({
      currentTab: target_id,
      show_content: show_content
    })
  },
  onPullDownRefresh: function () {
    wx.showNavigationBarLoading();
    var that = this
    if (parseInt(that.data.songciItem.id) > 8099) {
      var id_ = 0
    } else {
      id_ = that.data.songciItem.id
    }
    var key = parseInt(id_) + 1
    that.get_by_id(key, true)
    setTimeout(() => {
      wx.hideNavigationBarLoading()
      wx.stopPullDownRefresh()
    }, 600)
    that.setData({
      playing: false,
      seek2: 0,
      slideValue: 0,
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    if (options.hasOwnProperty('id')) {
      var id_ = options.id
    } else {
      id_ = parseInt(Math.random() * 8100)
    }
    that.get_by_id(id_)
  },
  playsound: function () {
    const backgroundAudioManager = this.backgroundAudioManager
    if (this.data.songciItem) {
      backgroundAudioManager.title = this.data.songciItem.work_title
      backgroundAudioManager.epname = 'i古诗词'
      backgroundAudioManager.singer = this.data.songciItem.work_author
      backgroundAudioManager.coverImgUrl = this.data.poster
      backgroundAudioManager.startTime = this.data.seek2
      backgroundAudioManager.seek(this.data.seek2)
      backgroundAudioManager.src = this.data.audioUrl
      this.setData({
        playing: true
      });
    } else {
      wx.showToast({
        title: '播放失败，请稍后重试~~',
        icon: 'none'
      })
    }
  },
  get_play_mode: function () {
    var that = this
    try {
      var mode = wx.getStorageSync('play_mode')
    } catch (e) {
      mode = 'xunhuan'
    }
    if (!mode) {
      mode = 'xunhuan'
    }
    that.setData({
      mode: mode
    })
    return mode
  },
  reset_playmode: function () {
    var that = this
    try {
      var old_play_mode = wx.getStorageSync('old_play_mode')
    } catch (e) {
      old_play_mode = 'xunhuan'
    }
    old_play_mode = old_play_mode == 'hc' ? 'xunhuan' : old_play_mode
    wx.setStorageSync('play_mode', old_play_mode);
    that.setData({
      mode: old_play_mode
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function (e) {
    var that = this
    var mode = that.get_play_mode()
    that.backgroundAudioManager = wx.getBackgroundAudioManager();
    this.backgroundAudioManager.onEnded(() => {
      var text2audio = false
      try {
        text2audio = wx.getStorageSync('text2audio')
      } catch ($e) {
      }
      if (text2audio) {
        var urls = wx.getStorageSync('text2audiourls')
        var title = wx.getStorageSync('text2audiotitle')
        var author = wx.getStorageSync('text2audioauthor')
        if (urls.length > 0) {
          that.backgroundAudioManager.src = urls[0]
          that.backgroundAudioManager.title = title
          that.backgroundAudioManager.singer = author
          that.backgroundAudioManager.coverImgUrl = that.data.poster
          that.backgroundAudioManager.epname = 'i古诗词'
          that.backgroundAudioManager.play()
          wx.setStorageSync('text2audio', true)
          wx.setStorageSync('text2audiourls', urls.slice(1))
        } else {
          wx.setStorageSync('text2audio', false)
          that.reset_playmode();
        }
      } else {
        var mode = that.get_play_mode()
        if (mode != 'hc') {
          that.do_operate_play('next', mode)
        } else {
          that.reset_playmode()
        }
      }
    });
    this.backgroundAudioManager.onPause(() => {
      that.pauseplaybackmusic()
    });
    this.backgroundAudioManager.onStop(() => {
    });
    this.backgroundAudioManager.onError((e) => {
      that.setData({
        playing: false
      })
      wx.showToast({
        title: '播放失败:(',
        icon: 'none'
      });
    });
    this.backgroundAudioManager.onWaiting(() => {
      wx.showLoading({
        title: '音频加载中...',
      });
    });
    this.backgroundAudioManager.onCanplay(() => {
      wx.hideLoading();
    });
    this.backgroundAudioManager.onPlay(() => {
      wx.hideLoading();
    });
    this.backgroundAudioManager.onPrev(() => {
      var mode = that.get_play_mode()
      that.do_operate_play('up', mode)
    });

    this.backgroundAudioManager.onNext(() => {
      var mode = that.get_play_mode()
      that.do_operate_play('next', mode)
    });
    this.backgroundAudioManager.onTimeUpdate(() => {
      that.musicStart()
    });
    var music_ids = wx.getStorageSync('music_ids')
    if (!music_ids) {
      var app = getApp()
      app.get_music_list()
    }
  },
  setCurrentPlaying: function () {
    var that = this
    // 如果正在播放
    if (that.backgroundAudioManager && !that.backgroundAudioManager.paused) {
      var audioUrl = that.backgroundAudioManager.src
      if (audioUrl) {
        var re = /[0-9]+\.m4a/g
        var results = audioUrl.match(re)
        if (results && results.length > 0) {
          results = results[0].slice(0, -4)
          if (that.data.audioId == results) {
            setTimeout(() => {
              that.setData({
                playing: true
              });
            }, 200)
            return
          }
        }
      }
    }
    that.setData({
      playing: false
    });
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var that = this
    var id_ = setInterval(() => {
      if (that.data.songciItem) {
        clearInterval(id_)
        that.setCurrentPlaying();
        wx.hideLoading();
      }
    }, 100)
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },
  longPress: function () {
    var that = this
    if (parseInt(that.data.songciItem.id) <= 1) {
      var id_ = 8101
    } else {
      id_ = that.data.songciItem.id
    }
    var key = parseInt(id_) - 1
    var pages = getCurrentPages()
    var url = '/pages/songci/songci?id=' + key
    if (pages.length == config.maxLayer) {
      util.pageConfirm(url)
    } else {
      wx.navigateTo({
        url: url
      });
    }
  },

  onShareAppMessage: function (res) {
    return {
      title: this.data.currentSongci,
      path: '/pages/songci/songci?id=' + this.data.audioId,
      imageUrl: '/static/share4.jpg',
      success: function (res) {
        util.showSuccess('分享成功')
      },
      fail: function (res) {
        util.showSuccess('取消分享')
      }
    }
  },
  longPressBack: function () {
    wx.redirectTo({
      url: '/pages/catalog/catalog',
    })
  },
  musicStart: function () {
    var that = this
    try {
      var time2close = wx.getStorageSync('time2close')
      if (time2close && time2close > 0 && (new Date()).getTime() > time2close * 1000) {
        that.pauseplaybackmusic()
        that.setData({
          time2close: 0,
          closeplaytime: 0
        })
        try {
          var setTimedInt = wx.getStorageSync('setTimedInt')
          if (!setTimedInt) {
            setTimedInt = 0
          }
        } catch (e) {
          setTimedInt = 0
        }
        wx.removeStorageSync('time2close')
        wx.removeStorageSync('closeplaytime')
        if (setTimedInt > 0) {
          wx.showToast({
            title: '定时已到~~',
            icon: 'none'
          })
          wx.setStorageSync('setTimedInt', 0)
          clearInterval(setTimedInt)
        }
        return
      }
      if (time2close && (new Date()).getTime() < time2close * 1000) {
        var last_micro_seconds = time2close - (new Date()).getTime() / 1000
        if (last_micro_seconds) {
          that.setData({
            closeplaytime: parseInt(last_micro_seconds / 60.0 + 0.5)
          });
        }
      }
    } catch (e) { }
    var current_time = this.backgroundAudioManager.currentTime
    var duration = this.backgroundAudioManager.duration
    this.setData({
      slideValue: parseInt(current_time / duration * 100)
    })
    var current_time_show = (parseInt(current_time / 60) < 10 ? '0' + parseInt(current_time / 60) : parseInt(current_time / 60)) + ':' + ((parseInt(current_time % 60) > 9) ? parseInt(current_time % 60) : '0' + parseInt(current_time % 60))
    var duration_show = (parseInt(duration / 60) < 10 ? '0' + parseInt(duration / 60) : parseInt(duration / 60)) + ':' + ((parseInt(duration % 60) > 9) ? parseInt(duration % 60) : '0' + parseInt(duration % 60))
    that.setData({
      duration: this.backgroundAudioManager.duration,
      current_time: this.backgroundAudioManager.currentTime,
      duration_show: duration_show,
      current_time_show: current_time_show
    })
  },
  sliderChanging: function (e) {
    var that = this
    var current_time = e.detail.value / 100.0 * that.backgroundAudioManager.duration
    if (that.backgroundAudioManager.buffered < current_time) {
      wx.showLoading({
        title: '音频加载中',
      });
    }
    var current_time_show = (parseInt(current_time / 60) < 10 ? '0' + parseInt(current_time / 60) : parseInt(current_time / 60)) + ':' + ((parseInt(current_time % 60) > 9) ? parseInt(current_time % 60) : '0' + parseInt(current_time % 60))
    that.setData({
      current_time_show: current_time_show,
      seek2: current_time
    })
  },
  slider2change: function (e) {
    var that = this
    var v = e.detail.value
    var duration = that.backgroundAudioManager.duration ? that.backgroundAudioManager.duration : 0
    var seek2 = v / 100 * duration
    that.setData({
      seek2: seek2 >= duration ? 0 : seek2
    });
    setTimeout(() => {
      that.playsound()
    }, 1000)
  }
});
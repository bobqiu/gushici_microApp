var config = require('config')
var util = require('utils/util')
App({onLaunch(){
  try{
    var open_id = wx.getStorageSync('user_open_id')
  }catch(e){
  }
  if(!open_id){
    util.userLogin()
  }
  try{
      var today = util.formatTime(new Date())
      open_id = wx.getStorageSync('user_open_id')
      var play_mode = wx.getStorageSync('play_mode')
      today = today.replace(/-/g, '')
      var historyplay = wx.getStorageSync('historyplay')
      var today_clear = wx.getStorageSync('clear_1' + today)
      if (!today_clear || today_clear != 1) {
        wx.clearStorage();
      }
      wx.setStorage({
        key: 'clear_1' + today,
        data: 1,
      })
      wx.setStorage({
        key: 'historyplay',
        data: historyplay
      })
      if(open_id){
        wx.setStorage({
          key: 'user_open_id',
          data: open_id
        })
      }
      wx.setStorageSync('play_mode', play_mode ? play_mode: 'xunhuan')
  }catch(e){}
}});
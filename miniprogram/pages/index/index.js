//index.js
const app = getApp();
const QQMapWx = require('../../libs/qqmap-wx-jssdk1.0/qqmap-wx-jssdk.js');
wx.cloud.init();
const db = wx.cloud.database();
const day = db.collection('day');
const food = db.collection('food');
const _ = db.command;
let ctx = null;
let lastX = 100;
let lastY = 100;
let direction = true;
let lineWidth = 2;
let imgList = [];
let defaulImgList = [];
let imgIndex = 0;
let windowWidth = 375;
let windowHeight = 603;
let requestTime = 0; // ../../images/404.png
Page({
    data: {
        city: '',
        period: '',
        adjecttive: '',
        airQuality: '',
        weather: '',
        suitList: [],
        imgUrl: '',
        date: ''
    },
    onLoad: function () {
        const qqmapsdk = new QQMapWx({
            key: 'IHEBZ-T2IRS-O5EOK-6MTX6-5LTC5-4CBMT'
        });
        // 获取用户位置
        wx.getLocation({
            type: 'gcj02',
            success: res => {
                qqmapsdk.reverseGeocoder({
                    location: {
                        latitude: res.latitude,
                        longitude: res.longitude
                    },
                    success: res => {
                        const city = res.result.address_component.city.replace('市', '');
                        this.setData({
                            city: city
                        });
                        this.getWeatherData(city);
                    }
                });
            }
        });
        // wx.getSystemInfo({
        //      success (res) {
        //          windowWidth = res.windowWidth;
        //          windowHeight = res.windowHeight;
        //      }
        // });
    },
    onReady: function () {
        // ctx = wx.createCanvasContext('drawCanvas');
    },
    onShow: function () {
        this.setPeriod();
        if (this.data.city !== '') {
            this.getWeatherData(this.data.city);
        }
        this.freshData();
    },
    freshData: function() {
        const date = this.getFromatDay(new Date());
        if (this.data.date !== date) {
            this.setData({
                date: date
            });
            this.getFoodData();
        }
    },
    onPullDownRefresh: function () {
        this.setPeriod();
        // this.getWeatherData(this.data.city);
        const date = this.getFromatDay(new Date());
        if (this.data.date !== date || imgList.length.length === 0) {
            this.freshData();
            wx.stopPullDownRefresh();
        } else {
            wx.stopPullDownRefresh({
                success: () => {
                    if (imgList.length > 0) {
                        imgIndex++;
                        if (imgIndex > imgList.length - 1) {
                            imgIndex = 0;
                        }
                        console.log(imgIndex);
                        setTimeout(() => {
                            this.setData({
                                imgUrl: imgList[imgIndex]
                            });
                        }, 580);
                    }
                }
            });
        }
    },
    getFoodData: function () {
        wx.showLoading({
            title: '加载美食中...',
        });
        const date = this.getFromatDay(new Date());
        day.doc(date).get({
            success: res => {
                wx.hideLoading();
                const data = res.data;
                const title = data.lunarYear + '年' + data.lunar;
                this.setDateBarTitle(title);
                this.setData({
                    suitList: data.food,
                    imgUrl: this.getFileUrl(data.food[0])
                });
                setTimeout(() => {
                    this.getFoodImage(data.food);
                }, 580);
            },
            fail: res => {
                wx.showToast({
                      title: '网络拥挤，加载失败！',
                      icon: 'none',
                      duration: 10000
                });
            }
        });
    },
    getFoodImage: function (foods) {
        // this.downloadImage(foods.shift());
        // defaulImgList = foods;
        foods.forEach(item => {
            this.downloadImage(item);
        });
    },
    getFileUrl: function (name) {
        return 'cloud://dev-37644f.6465-dev-37644f/image/' + name + '.jpg';
    },
    downloadImage: function (fileID) {
        fileID = this.getFileUrl(fileID);
        wx.cloud.downloadFile({
            fileID: fileID,
            success: res => {
                console.log(fileID);
                imgList.push(res.tempFilePath);
            },
            fail: res => {
                console.log(fileID, res);
                imgList.push(fileID);
            }
        });
    },
    // drawImage: function (resource) {
    //     let paintWidth = windowWidth;
    //     console.log(windowWidth, windowHeight, windowHeight - windowWidth);
    //     let painPading = 0;
    //     ctx.drawImage(resource, 0, 0, 500, 500, 0, painPading, paintWidth, paintWidth);
    //     ctx.draw(true);
    // },
    getFromatDay: function (date) {
        return '2018-12-28';
        // return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    },
    imageErro: function () {
        this.setData({
            imgUrl: '../../images/404.png'
        });
    },
    getWeatherData: function (city) {
        wx.request({
            url: 'https://www.tianqiapi.com/api/',
            data: {
                version: 'v1',
                city: city
            },
            success: res => {
                this.setAirQuality(res.data.data);
            },
            fail: res => {
                wx.showToast({
                      title: '天气加载失败，请稍后再试！',
                      icon: 'fail',
                      duration: 2000
                });
            }
        });
    },
    setDateBarTitle: function (title) {
        wx.setNavigationBarTitle({
            title: title
        });
    },
    getTwoHourPeriods: function (date) {
        const hours = date.getHours();
        const periods = ['子', '丑', '丑', '寅', '寅', '卯', '卯', '辰', '辰', '巳', '巳', '午', '午', '未', '未', '申', '申', '酉', '酉', '戌', '戌', '亥', '亥', '子'];
        return periods[hours] + '时';
    },
    getPeridsAdjective: function (period) {
        const adjecttive = {
            '子时': '夜色阑珊',
            '丑时': '皎皎明月',
            '寅时': '黎明破晓',
            '卯时': '日出有曜',
            '辰时': '迎风锁雾',
            '巳时': '艳阳当空',
            '午时': '烈日当头',
            '未时': '翠深红隙',
            '申时': '桑榆暮景',
            '酉时': '白日催怿',
            '戌时': '万物朦胧',
            '亥时': '夜深人静'
        };
        return adjecttive[period];
    },
    setPeriod: function () {
        const period = this.getTwoHourPeriods(new Date());
        const adjecttive = this.getPeridsAdjective(period);
        this.setData({
            period: period,
            adjecttive: adjecttive
        });
    },
    setAirQuality: function (data) {
        const todayWeather = data[0];
        const airQuality = todayWeather.air + ' · 空气质量' + todayWeather.air_level;
        const weather = todayWeather.tem1 + ' ' + todayWeather.wea;
        this.setData({
            airQuality: airQuality,
            weather: weather
        });
    }
})

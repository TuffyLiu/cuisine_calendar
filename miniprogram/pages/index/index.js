//index.js
const app = getApp();
const QQMapWx = require('../../libs/qqmap-wx-jssdk1.0/qqmap-wx-jssdk.js');
wx.cloud.init();
const db = wx.cloud.database();
const day = db.collection('day');
const _ = db.command;
Page({
    data: {
        city: '',
        period: '',
        adjecttive: '',
        airQuality: '',
        weather: '',
        suitList: [],
        imgUrl: '',
        date: '',
        dateList: [],
        menuList: [],
        weatherList: [],
        currentIndex: 0,
        loading: false
    },
    onLoad: function () {
        // wx.getSystemInfo({
        //     success(res) {
        //         // console.log(res)
        //     }
        // });
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
    },
    onReady: function () {},
    onShow: function () {
        this.setPeriod();
        if (this.data.city !== '') {
            this.getWeatherData(this.data.city);
        }
    },
    freshData: function () {
        const date = this.getFromatDay(new Date());
        if (this.data.date !== date) {
            this.setData({
                date: date
            });
            this.getFoodData();
        }
    },
    onPullDownRefresh: function () {
        this.data.loading = true;
        let data = {};
        const activeData = this.data.dateList[this.data.currentIndex];
        data[`dateList[${this.data.currentIndex}].active`] = activeData.active ? (activeData.active + 1) % activeData.food.length : 1;
        this.setData(data);
    },
    imageLoad: function () {
        if (this.data.loading) {
            setTimeout(() => {
                wx.stopPullDownRefresh();
            }, 1);
            this.data.loading = false;
        }
    },
    intervalChange: function (e) {
        const data = this.data.dateList[e.detail.current];
        const title = data.lunarYear + '年' + data.lunar;
        this.setDateBarTitle(title);
        this.data.currentIndex = e.detail.current;
    },
    getFoodData: function () {
        wx.showLoading({
            title: '加载美食中...',
        });
        const dateList = this.getDayList();
        day.where({
            _id: _.in(dateList),
        }).get({
            success: res => {
                console.log(res);
                this.data.menuList = res.data;
                wx.hideLoading();
                const {
                    menuList,
                    weatherList
                } = this.data;
                if (menuList.length > 0 && weatherList.length > 0) {
                    let dateList = [];
                    menuList.forEach((item, index) => {
                        dateList.push(Object.assign({}, item, weatherList[index]));
                    });
                    this.setData({
                        dateList: dateList
                    });
                    this.setDateBarTitle(dateList[0].lunarYear + '年' + dateList[0].lunar);
                }
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
    getFromatDay: function (date) {
        let formatNumber = function (num) {
            return num > 9 ? num : '0' + num;
        };
        return date.getFullYear() + '-' + formatNumber((date.getMonth() + 1)) + '-' + formatNumber(date.getDate());
    },
    getDayList: function () {
        let list = [];
        for (let i = 0; i < 7; i++) {
            list.push(this.getFromatDay(new Date(new Date().getTime() + i * 24 * 60 * 60 * 1000)));
        }
        return list;
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
                city: city,
                appid: '23587788',
                appsecret: 'NQDQ4MZ9'
            },
            success: res => {
                this.data.weatherList = res.data.data;
                this.freshData();
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
    }
})

//index.js
const app = getApp();
const QQMapWx = require('../../libs/qqmap-wx-jssdk1.0/qqmap-wx-jssdk.js');
wx.cloud.init();
const db = wx.cloud.database();
// const day = db.collection('day');
const food = db.collection('food');
const lunar = db.collection('lunar');

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
        loading: false,
        permision: true,
        MIN: 1,
        MAX: 200
    },
    onLoad: function () {
        food.count().then((res) => {
            this.setData({
                MAX: res.total
            });
        });
        const qqmapsdk = new QQMapWx({
            key: 'IHEBZ-T2IRS-O5EOK-6MTX6-5LTC5-4CBMT'
        });
        // 获取用户位置
        wx.getLocation({
            type: 'gcj02',
            success: (res) => {
                // console.log(res);
                qqmapsdk.reverseGeocoder({
                    location: {
                        latitude: res.latitude,
                        longitude: res.longitude
                    },
                    success: (res) => {
                        const city = res.result.address_component.city.replace('市', '');
                        this.setData({
                            city: city,
                            permision: true
                        });
                        this.getData(city, new Date());
                    }
                });
            },
            fail: (res) => {
                this.setData({
                    permision: false
                });
            }
        });
    },
    onReady: function () {},
    onShow: function () {
        this.setPeriod();
        if (this.data.city !== '') {
            this.getWeatherData(this.data.city).then((w) => {
                w.forEach((item, index) => {
                    this.data.dateList[index] = {
                        ...this.data.dateList[index],
                        ...item
                    };
                });
                this.setData({
                    dateList: this.data.dateList
                });
            });
        }
    },
    getData(city, date) {
        wx.showLoading({
            title: '加载美食中...'
        });

        Promise.all([this.getWeatherData(city), this.getCalendarData(date), this.getFoodData()])
            .then(([weather, calendar, food]) => {
                // console.log(calendar, weather);
                weather.forEach((element) => {
                    element.food = [];
                });
                weather[0].food = food.map((item) => {
                    return item.name.replace('.jpg', '');
                });
                weather[0].lunarYear = calendar.lunarYear;
                weather[0].lunar = calendar.lunar;

                new Array(30).fill(1).forEach(() => {
                    weather.push({
                        lunarYear: calendar.lunarYear
                    });
                });
                this.setData({
                    dateList: weather
                });
                this.setDateBarTitle(calendar.lunarYear + '年' + calendar.lunar);
                wx.hideLoading();
                this.getOneDate(1, true);
            })
            .catch((e) => {
                wx.hideLoading();
            });
    },
    getOneDate(index, next) {
        if (!next) {
            wx.showLoading({
                title: '加载美食中...'
            });
        }

        Promise.all([this.getCalendarData(new Date(new Date().getTime() + 24 * 60 * 60 * 1000 * index)), this.getFoodData()])
            .then(([calendar, food]) => {
                this.data.dateList[index].food = food.map((item) => {
                    return item.name.replace('.jpg', '');
                });
                const quotes = new Array(
                    '任何一种爱，都不比对美食的热爱真切。——萧伯纳 George Bernard Shaw',
                    '这世界如果有更多的人热爱美食与诗歌胜过爱黄金，这世界会是一个更美好的地方。——托尔金 J.R.R.Tolkien',
                    '只要告诉我你爱吃什么，我就能知道你是什么样的人。——萨瓦林 Jean Anthelme Brillat-Savarin',
                    '我厌恶那些对美食不认真的人，他们都是肤浅的。——奥斯卡•王尔德 Oscar Wilde',
                    '美食是身体的歌曲，而歌曲是心灵的美食。——格里高利•罗伯兹 Gregory David Roberts',
                    '我们对小时候吃的美食都有着深刻记忆，美食有着带我们回到过去的魔力。——霍马洛•坎图 Homaro Cantu',
                    '满足身体的美食是不足够的，也得要有满足心灵的美食。——陶乐斯•戴 Dorothy Day'
                );
                this.data.dateList[index].quotes = quotes[this.getRandom(0, 6)];
                this.data.dateList[index].lunarYear = calendar.lunarYear;
                this.data.dateList[index].lunar = calendar.lunar;
                this.data.dateList[index].week = calendar.weekday;
                this.data.dateList[index].day = this.data.dateList[index].day || Number(calendar.day.slice(-2)) + '日(' + calendar.jieqi + ')';
                if (index > this.data.dateList.length - 5) {
                    const tamp = [];
                    new Array(30).fill(1).forEach(() => {
                        tamp.push({
                            lunarYear: calendar.lunarYear
                        });
                    });
                    this.data.dateList = [...this.data.dateList, ...tamp];
                }
                this.setData({
                    dateList: this.data.dateList
                });
                if (!next) {
                    this.setDateBarTitle(calendar.lunarYear + '年' + calendar.lunar);
                    wx.hideLoading();
                }
            })
            .catch((e) => {
                wx.hideLoading();
            });
    },
    getWeatherData: function (city) {
        // console.log('getWeatherData');
        return new Promise((resolve, reject) => {
            wx.request({
                url: 'https://www.tianqiapi.com/api/',
                data: {
                    version: 'v1',
                    city: city,
                    appid: '23587788',
                    appsecret: 'NQDQ4MZ9'
                },
                success: (res) => {
                    resolve(res.data.data);
                },
                fail: (res) => {
                    reject(res);
                    wx.showToast({
                        title: '天气加载失败，请稍后再试！',
                        icon: 'fail',
                        duration: 2000
                    });
                }
            });
        });
    },
    getFromatDay: function (date) {
        let formatNumber = function (num) {
            return num > 9 ? num : '0' + num;
        };
        return date.getFullYear() + '' + formatNumber(date.getMonth() + 1) + '' + formatNumber(date.getDate());
    },
    getFromatDay2: function (date) {
        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    },
    getCalendarData: function (date) {
        return new Promise((resolve) => {
            lunar.doc(this.getFromatDay(date)).get({
                success: (res) => {
                    resolve(res.data);
                },
                fail: () => {
                    resolve(this.getCalendar(date));
                }
            });
        });
    },
    getCalendar: function (date) {
        return new Promise((resolve, reject) => {
            wx.request({
                url: 'https://v.juhe.cn/calendar/day',
                data: {
                    date: this.getFromatDay2(date),
                    key: 'bbe3094e5135f8fe88b859b47b6aaff4'
                },
                success: (res) => {
                    if (res.data.result) {
                        resolve(res.data.result.data);
                        this.saveCalendar(date, res.data.result.data);
                    } else {
                        reject(res);
                        wx.showToast({
                            title: '农历日历加载失败，请稍后再试！',
                            icon: 'fail',
                            duration: 2000
                        });
                    }
                },
                fail: (res) => {
                    reject(res);
                    wx.showToast({
                        title: '农历日历加载失败，请稍后再试！',
                        icon: 'fail',
                        duration: 2000
                    });
                }
            });
        });
    },
    saveCalendar: function (date, data) {
        lunar.add({
            // data 字段表示需新增的 JSON 数据
            data: {
                _id: this.getFromatDay(date),
                lunar: data.lunar,
                lunarYear: data.lunarYear,
                weekday: data.weekday
            },
            success: function (res) {
                // res 是一个对象，其中有 _id 字段标记刚创建的记录的 id
                console.log(res);
            }
        });
    },
    getRandom: function (min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    },

    getFoodData: function () {
        // console.log('getFoodData');
        return new Promise((resolve, reject) => {
            const foodList = this.getRandomList();
            food.where({
                _id: _.in(foodList)
            }).get({
                success: (res) => {
                    resolve(res.data);
                },
                fail: () => {
                    reject(res);
                    wx.showToast({
                        title: '网络拥挤，加载失败！',
                        icon: 'none',
                        duration: 10000
                    });
                }
            });
        });
    },
    onPullDownRefresh: function () {
        wx.stopPullDownRefresh();
        let data = {};
        const activeData = this.data.dateList[this.data.currentIndex];
        data[`dateList[${this.data.currentIndex}].active`] = activeData.active ? (activeData.active + 1) % activeData.food.length : 1;
        this.setData(data);
    },
    imageLoad: function () {
        if (this.data.loading) {
            this.data.loading = false;
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

    intervalChange: function (e) {
        const data = this.data.dateList[e.detail.current] || {};
        if (!data.food || data.food.length === 0) {
            this.getOneDate(e.detail.current);
        } else {
            const title = data.lunarYear + '年' + data.lunar;
            this.setDateBarTitle(title);
        }
        if (!this.data.dateList[e.detail.current + 1].food || this.data.dateList[e.detail.current + 1].food.length === 0) {
            this.getOneDate(e.detail.current + 1, true);
        }
        this.data.currentIndex = e.detail.current;
    },
    getRandomList: function () {
        let arry = new Array(6).fill(0);
        return arry.map(() => {
            return this.getRandom(this.data.MIN, this.data.MAX);
        });
    },
    imageErro: function () {
        this.setData({
            imgUrl: '../../images/404.png'
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
            子时: '夜色阑珊',
            丑时: '皎皎明月',
            寅时: '黎明破晓',
            卯时: '日出有曜',
            辰时: '迎风锁雾',
            巳时: '艳阳当空',
            午时: '烈日当头',
            未时: '翠深红隙',
            申时: '桑榆暮景',
            酉时: '白日催怿',
            戌时: '万物朦胧',
            亥时: '夜深人静'
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
});

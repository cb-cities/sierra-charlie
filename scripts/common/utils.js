'use strict';

function pad(n) {
  return (
    n < 10 ? '0' + n :
      '' + n);
}

var _ = module.exports = {
  assign: require('object-assign'),

  ensure: function (object, key, defaultValue) {
    if (!(key in object)) {
      object[key] = defaultValue;
    }
    return object[key];
  },

  getUnion: function (array1, array2) {
    var union = {};
    array1.concat(array2).forEach(function (item) {
        union[item] = true;
      });
    return Object.keys(union);
  },

  getSortedKeys: function (object, compare) {
    return Object.keys(object || {}).sort(compare || function (key1, key2) {
        return key1.localeCompare(key2);
      });
  },

  debounce: function (func, duration) {
    var timeout;
    return function () {
      var that = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function () {
          func.apply(that, args);
        },
        duration);
    };
  },

  formatYear: function (dateTime) {
    return (
      !dateTime ? null :
        '' + dateTime.getUTCFullYear());
  },

  formatMonth: function (dateTime) {
    return (
      !dateTime ? null :
        pad(dateTime.getUTCMonth() + 1));
  },

  formatDay: function (dateTime) {
    return (
      !dateTime ? null :
        pad(dateTime.getUTCDate()));
  },

  formatDate: function (dateTime) {
    return (
      !dateTime ? null :
        _.formatYear(dateTime) + '-' +
        _.formatMonth(dateTime) + '-' +
        _.formatDay(dateTime));
  },

  formatHour: function (dateTime) {
    return (
      !dateTime ? null :
        pad(dateTime.getUTCHours()));
  },

  formatMinute: function (dateTime) {
    return (
      !dateTime ? null :
        pad(dateTime.getUTCMinutes()));
  },

  formatSecond: function (dateTime) {
    return (
      !dateTime ? null :
        pad(dateTime.getUTCSeconds()));
  },

  formatTime: function (dateTime) {
    return (
      !dateTime ? null :
        _.formatHour(dateTime) + ':' +
        _.formatMinute(dateTime) + ':' +
        _.formatSecond(dateTime));
  },

  formatDateTime: function (dateTime) {
    return (
      !dateTime ? null :
        _.formatDate(dateTime) + ' ' +
        _.formatTime(dateTime));
  },

  parseDateTime: function (rawDateTime) {
    return (
      !rawDateTime ? null :
        new Date(rawDateTime.split(' ').join('T')));
  },

  storeJson: function (key, value) {
    if (value !== null && value !== undefined) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.removeItem(key);
    }
  },

  loadJson: function (key, defaultValue) {
    var value = localStorage.getItem(key);
    return (
      value !== null ? JSON.parse(value) :
        defaultValue);
  },

  detectHairline: function () {
    var hairline = false;
    if (window.devicePixelRatio && window.devicePixelRatio >= 2) {
      var div = document.createElement('div');
      div.style.border = '.5px solid transparent';
      document.body.appendChild(div);
      if (div.offsetHeight === 1) {
        hairline = true;
      }
      document.body.removeChild(div);
    }
    if (hairline) {
      document.documentElement.classList.remove('no-hairline');
      document.documentElement.classList.add('hairline');
    } else {
      document.documentElement.classList.remove('hairline');
      document.documentElement.classList.add('no-hairline');
    }
    return hairline;
  },

  detectTouch: function () {
    var touch = 'ontouchstart' in window;
    if (touch) {
      document.documentElement.classList.add('touch');
      document.addEventListener('touchstart', function () {});
    } else {
      document.documentElement.classList.add('no-touch');
    }
    return touch;
  }
};

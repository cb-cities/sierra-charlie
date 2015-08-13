'use strict';

var _ = module.exports = {
  sendRequest: function (method, url, data, cb, opts) {
    opts = opts || {};
    var req = new XMLHttpRequest();
    req.open(method, url, true);
    Object.keys(opts.headers || {}).forEach(function (key) {
        req.setRequestHeader(key, opts.headers[key]);
      });
    req.onreadystatechange = opts.onChangeState || function () {
      if (req.readyState === 4) {
        if (req.status >= 200 && req.status < 400) {
          return cb(req.responseText);
        }
        if (req.status >= 400 && req.status < 500) {
          return cb(null, {
              type:     'clientError',
              status:   req.status,
              response: req.responseText.trim()
            });
        }
        if (req.status >= 500) {
          return cb(null, {
              type:     'serverError',
              status:   req.status,
              response: req.responseText.trim()
            });
        }
        return cb(null, {
            type:     'unknownError',
            status:   req.status,
            response: req.responseText.trim()
          });
      }
    };
    req.timeout   = opts.timeout || 60000;
    req.ontimeout = opts.onTimeout || function () {
      return cb(null, {
          type: 'timeout'
        });
    };
    if (data && data.length) {
      req.send(data);
    } else {
      req.send();
    }
    return req;
  },

  addQuery: function (url, query) {
    var sep = url.indexOf('?') === -1 ? '?' : '&';
    Object.keys(query).forEach(function (key) {
        if (query[key] !== null && query[key] !== undefined) {
          url += sep + key + '=' + query[key];
          sep = '&';
        }
      });
    return url;
  },

  addHeader: function (opts, key, value) {
    opts = opts || {};
    opts.headers = opts.headers || {};
    opts.headers[key] = value;
    return opts;
  },

  addAuthHeader: function (opts, token) {
    return _.addHeader(opts, 'Authorization', 'Bearer ' + token);
  },

  addJsonHeader: function (opts) {
    return _.addHeader(opts, 'Content-Type', 'application/json');
  },

  sendJsonRequest: function (method, url, data, cb, opts) {
    return _.sendRequest(
      method,
      url,
      data ? JSON.stringify(data) : null,
      function (res, err) {
        if (err) {
          return cb(null, err);
        }
        if (!res || !res.length) {
          return cb();
        }
        var json;
        try {
          json = JSON.parse(res);
        } catch (ex) {
          return cb(null, {
              type:     'unknownError',
              response: res
            });
        }
        return cb(json);
      },
      data ? _.addJsonHeader(opts) : opts);
  },

  getJsonResource: function (url, cb, opts) {
    return _.sendJsonRequest('GET', url, null, cb, opts);
  },

  postJsonResource: function (url, data, cb, opts) {
    return _.sendJsonRequest('POST', url, data, cb, opts);
  },

  deleteJsonResource: function (url, cb, opts) {
    return _.sendJsonRequest('DELETE', url, null, cb, opts);
  },

  putJsonResource: function (url, data, cb, opts) {
    return _.sendJsonRequest('PUT', url, data, cb, opts);
  }
};

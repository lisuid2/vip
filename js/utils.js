/**
 * 工具模块 - 通用工具函数
 * 负责本地存储、数据处理等通用功能
 */

// 本地存储管理
const Storage = {
  // 设置值
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('本地存储失败:', e);
      return false;
    }
  },

  // 获取值
  get(key, defaultValue) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
      console.warn('本地存储读取失败:', e);
      return defaultValue;
    }
  },

  // 删除值
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('本地存储删除失败:', e);
      return false;
    }
  },

  // 清空所有
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.warn('本地存储清空失败:', e);
      return false;
    }
  },

  // 带过期时间的设置（TTL缓存）
  setWithTTL(key, value, ttlMinutes = 60) {
    try {
      const data = {
        value: value,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000
      };
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('本地存储失败:', e);
      return false;
    }
  },

  // 获取带有过期检查的值
  getWithTTL(key, defaultValue) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      
      const data = JSON.parse(item);
      const now = Date.now();
      
      // 检查是否过期
      if (now - data.timestamp > data.ttl) {
        localStorage.removeItem(key); // 删除过期数据
        return defaultValue;
      }
      
      return data.value;
    } catch (e) {
      console.warn('本地存储读取失败:', e);
      return defaultValue;
    }
  }
};

// URL参数处理
const URLParams = {
  // 获取参数
  get(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  },

  // 获取所有参数
  getAll() {
    return Object.fromEntries(new URLSearchParams(window.location.search));
  },

  // 设置参数（不刷新页面）
  set(params) {
    const newParams = new URLSearchParams(window.location.search);
    
    Object.keys(params).forEach(key => {
      if (params[key]) {
        newParams.set(key, params[key]);
      } else {
        newParams.delete(key);
      }
    });

    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    window.history.replaceState(null, null, newUrl);
  },

  // 构建URL
  build(baseUrl, params) {
    const query = new URLSearchParams(params).toString();
    return query ? `${baseUrl}?${query}` : baseUrl;
  }
};

// 数据验证
const Validator = {
  // 验证视频URL
  isValidVideoUrl(url) {
    if (!url) return false;
    
    try {
      new URL('http://' + url);
      return true;
    } catch (e) {
      return false;
    }
  },

  // 验证HTTP URL
  isValidHttpUrl(url) {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (e) {
      return false;
    }
  },

  // 验证邮箱
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
};

// 时间工具
const Time = {
  // 格式化时间
  format(date, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    const map = {
      YYYY: date.getFullYear(),
      MM: String(date.getMonth() + 1).padStart(2, '0'),
      DD: String(date.getDate()).padStart(2, '0'),
      HH: String(date.getHours()).padStart(2, '0'),
      mm: String(date.getMinutes()).padStart(2, '0'),
      ss: String(date.getSeconds()).padStart(2, '0')
    };

    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (matched) => map[matched]);
  },

  // 获取距离现在的时间差
  getTimeAgo(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return '刚刚';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}天前`;
    
    return this.format(date, 'YYYY-MM-DD');
  }
};

// 字符串工具
const String = {
  // 截断字符串
  truncate(str, length, ellipsis = '...') {
    return str.length > length ? str.substring(0, length) + ellipsis : str;
  },

  // 转换为驼峰命名
  toCamelCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  },

  // 转换为蛇形命名
  toSnakeCase(str) {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  },

  // HTML转义
  escape(str) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, (m) => map[m]);
  },

  // HTML反转义
  unescape(str) {
    const map = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#039;': "'"
    };
    return str.replace(/&[^;]+;/g, (m) => map[m] || m);
  }
};

// 数组工具
const Array = {
  // 去重
  unique(arr) {
    return [...new Set(arr)];
  },

  // 去重（对象数组）
  uniqueBy(arr, key) {
    const seen = new Set();
    return arr.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  },

  // 分组
  groupBy(arr, key) {
    return arr.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) result[group] = [];
      result[group].push(item);
      return result;
    }, {});
  },

  // 随机取一个
  random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
};

// 对象工具
const Object = {
  // 深合并
  merge(target, source) {
    for (const key in source) {
      if (source[key] instanceof Object && target[key] instanceof Object) {
        this.merge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  },

  // 深复制
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (obj instanceof Object) {
      const clone = {};
      for (const key in obj) {
        clone[key] = this.deepClone(obj[key]);
      }
      return clone;
    }
  }
};

// 性能工具
const Performance = {
  // 防抖
  debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  // 节流
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // 测量执行时间
  async measure(name, func) {
    const start = performance.now();
    const result = await func();
    const end = performance.now();
    console.log(`${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  }
};

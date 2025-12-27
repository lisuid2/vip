/**
 * API 模块 - 接口检测与切换
 * 负责接口管理、检测、切换等功能
 */

const API = {
  // 所有可用的解析接口列表
  list: [
    { name: "虾米解析", url: "https://jx.xmflv.com/?url=" },
    { name: "国内线路", url: "https://jx.nnxv.cn/tv.php?url=" },
    { name: "线路", url: "https://jx.m3u8.tv/jiexi/?url=" },
    { name: "备用线路", url: "https://jx.xmflv.cc/?url=" },
    { name: "线路五", url: "https://jx.playerjy.com/?url=" },
    { name: "OK解析", url: "https://okjx.cc/?url=" },
  ],

  // 初始化API列表UI
  init() {
    const select = document.getElementById("jk");
    const apiList = document.getElementById("apiList");
    
    if (!select || !apiList) return;
    
    select.innerHTML = '';
    apiList.innerHTML = '';
    
    this.list.forEach((api, index) => {
      // 创建下拉菜单选项
      const option = document.createElement('option');
      option.value = api.url;
      option.textContent = api.name;
      select.appendChild(option);
      
      // 创建状态显示项
      const item = document.createElement('div');
      item.className = 'api-item';
      item.id = `api-${index}`;
      item.innerHTML = `
        <span><span class="status-dot"></span><span class="api-name">${api.name}</span></span>
        <span class="status-text">等待检测</span>
      `;
      apiList.appendChild(item);
    });
    
    // 恢复上次选择的接口
    const lastIndex = Storage.get('lastApiIndex', 0);
    select.selectedIndex = lastIndex;
    
    // 尝试恢复缓存的检测结果
    const cachedResults = Storage.getWithTTL('apiCheckResults', null);
    if (cachedResults && cachedResults.results) {
      this.restoreCachedResults(cachedResults);
    }
  },

  // 从缓存恢复检测结果显示
  restoreCachedResults(cachedResults) {
    cachedResults.results.forEach((result) => {
      const element = document.getElementById(`api-${result.index}`);
      const dot = element?.querySelector('.status-dot');
      const statusText = element?.querySelector('.status-text');
      
      if (!element) return;
      
      if (result.available) {
        element.className = 'api-item success';
        if (dot) dot.className = 'status-dot success';
        if (statusText) statusText.textContent = `✓ ${result.responseTime}ms`;
      } else {
        element.className = 'api-item failed';
        if (dot) dot.className = 'status-dot failed';
        if (statusText) statusText.textContent = '✗ 超时';
      }
    });
  },

  // 获取当前选中的API
  getCurrent() {
    const select = document.getElementById("jk");
    return {
      url: select.value,
      name: select.options[select.selectedIndex].text
    };
  },

  // 设置当前选中的API
  setCurrent(index) {
    const select = document.getElementById("jk");
    select.selectedIndex = index;
    Storage.set('lastApiIndex', index);
  },

  // 检测单个接口
  async checkOne(index) {
    const api = this.list[index];
    const element = document.getElementById(`api-${index}`);
    if (!element) return { success: false, time: 0 };

    const dot = element.querySelector('.status-dot');
    const statusText = element.querySelector('.status-text');
    
    // 设置加载状态
    element.className = 'api-item loading';
    dot.className = 'status-dot loading';
    statusText.textContent = '检测中...';
    
    const startTime = performance.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch(api.url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const responseTime = Math.round(performance.now() - startTime);
      
      // 接口可用
      element.className = 'api-item success';
      dot.className = 'status-dot success';
      statusText.textContent = `✓ ${responseTime}ms`;
      
      return { success: true, time: responseTime, index };
    } catch (error) {
      // 接口不可用
      element.className = 'api-item failed';
      dot.className = 'status-dot failed';
      statusText.textContent = '✗ 超时';
      
      return { success: false, time: 5000, index };
    }
  },

  // 检测所有接口
  async checkAll() {
    console.log('开始检测所有接口...');
    const results = [];
    
    for (let i = 0; i < this.list.length; i++) {
      const result = await this.checkOne(i);
      results.push(result);
      // 错开请求
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // 统计结果
    const availableResults = results.filter(r => r.success);
    const availableCount = availableResults.length;
    const statusBar = document.querySelector('.api-status-bar h3 .status-dot');
    
    if (statusBar) {
      statusBar.className = availableCount > 0 ? 'status-dot success' : 'status-dot failed';
    }
    
    // 自动选择最快的可用接口
    if (availableResults.length > 0) {
      availableResults.sort((a, b) => a.time - b.time);
      const fastestIndex = availableResults[0].index;
      this.setCurrent(fastestIndex);
      console.log(`✓ 自动选择最快接口: ${this.list[fastestIndex].name} (${availableResults[0].time}ms)`);
    }
    
    // 保存检测结果（缓存24小时）
    const checkResults = {
      timestamp: Date.now(),
      results: results.map((r, i) => ({
        index: i,
        name: this.list[i].name,
        available: r.success,
        responseTime: r.time
      }))
    };
    Storage.setWithTTL('apiCheckResults', checkResults, 24 * 60); // 24小时过期
    
    console.log(`检测完成: ${availableCount}/${this.list.length} 个接口可用`);
    return { total: this.list.length, available: availableCount, results: checkResults };
  }
};

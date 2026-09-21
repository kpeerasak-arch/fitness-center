class ApiService {
  static async get(action, params = {}) {
    params.action = action;
    params.token = CONFIG.API_TOKEN;
    
    // ใช้ JSONP เพื่อหลีกเลี่ยงปัญหา CORS และการ Redirect ของ Google Apps Script
    return new Promise((resolve, reject) => {
      const callbackName = 'jsonp_cb_' + Math.round(100000 * Math.random());
      params.callback = callbackName;
      
      const queryString = new URLSearchParams(params).toString();
      const url = `${CONFIG.API_URL}?${queryString}`;
      
      window[callbackName] = function(data) {
        delete window[callbackName];
        document.body.removeChild(script);
        resolve(data);
      };
      
      const script = document.createElement('script');
      script.src = url;
      script.onerror = function(error) {
        delete window[callbackName];
        document.body.removeChild(script);
        console.error('JSONP Error:', error);
        resolve({ status: 'error', message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' });
      };
      
      document.body.appendChild(script);
    });
  }

  static async post(action, payload = {}) {
    payload.action = action;
    payload.token = CONFIG.API_TOKEN;
    
    try {
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API POST Error:', error);
      return { status: 'error', message: 'ไม่สามารถบันทึกข้อมูลได้' };
    }
  }
}

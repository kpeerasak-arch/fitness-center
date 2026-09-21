class ApiService {
  static async get(action, params = {}) {
    params.action = action;
    params.token = CONFIG.API_TOKEN;
    
    const queryString = new URLSearchParams(params).toString();
    const url = `${CONFIG.API_URL}?${queryString}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API GET Error:', error);
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error');
      return null;
    }
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
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
      return null;
    }
  }
}

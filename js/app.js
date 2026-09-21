document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  loadDashboard();
});

function initRouter() {
  const links = document.querySelectorAll('.sidebar-menu a');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      const page = link.getAttribute('data-page');
      handleNavigation(page);
    });
  });
}

async function handleNavigation(page) {
  const container = document.getElementById('contentBody');
  container.innerHTML = `<div style="text-align:center; padding:50px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p>กำลังโหลดข้อมูล...</p></div>`;
  
  if (page === 'dashboard') {
    loadDashboard();
  } else if (page === 'members-register') {
    container.innerHTML = `<h3>ลงทะเบียนผู้รับบริการ</h3><p>แบบฟอร์มลงทะเบียนและคัดกรอง PAR-Q</p>`;
  } else if (page === 'settings') {
    container.innerHTML = `<h3>ตั้งค่าระบบ</h3><p>ตั้งค่ารหัสผ่าน Admin และการเชื่อมต่อ</p>`;
  } else {
    container.innerHTML = `<h3>โมดูล: ${page}</h3><p>กำลังพัฒนาฟังก์ชันเพิ่มเติม</p>`;
  }
}

async function loadDashboard() {
  const container = document.getElementById('contentBody');
  const stats = await ApiService.get('getDashboardStats');
  
  container.innerHTML = `
    <h2>ภาพรวมระบบ (Dashboard)</h2>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px;">
      <div style="background:white; padding:20px; border-radius:8px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
        <h3>สมาชิกทั้งหมด</h3>
        <p style="font-size:24px; font-weight:bold; color:var(--primary-color);">${stats ? stats.totalMembers : 0}</p>
      </div>
      <div style="background:white; padding:20px; border-radius:8px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
        <h3>เช็กอินวันนี้</h3>
        <p style="font-size:24px; font-weight:bold; color:#10b981;">${stats ? stats.todayCheckIns : 0}</p>
      </div>
      <div style="background:white; padding:20px; border-radius:8px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
        <h3>ครุภัณฑ์ทั้งหมด</h3>
        <p style="font-size:24px; font-weight:bold; color:#f59e0b;">${stats ? stats.totalEquipment : 0}</p>
      </div>
    </div>
  `;
}

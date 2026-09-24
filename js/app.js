const App = {
  state: {token:null,user:null, page:'dashboard', qrScanner:null, cache:{}},

  init() {
    this.restoreSession();
    document.getElementById('loginForm').addEventListener('submit', e=>this.login(e));
    document.getElementById('logoutBtn').addEventListener('click', ()=>this.logout());
    document.getElementById('menuBtn').addEventListener('click', ()=>document.getElementById('sidebar').classList.toggle('open'));
    document.getElementById('nav').addEventListener('click', e=>{
      const btn=e.target.closest('button[data-page]'); if(!btn)return;
      this.navigate(btn.dataset.page);
    });
  },

  getToken(){ return this.state.token || localStorage.getItem(CONFIG.SESSION_KEY) || ''; },

  restoreSession() {
    const raw=localStorage.getItem(CONFIG.SESSION_KEY);
    if(raw) {
      try {
        const s=JSON.parse(raw);
        if(s.token && s.expiresAt && Date.now()<Number(s.expiresAt)) {
          this.state.token=s.token; this.state.user=s.user;
          this.showMain(); this.navigate('dashboard'); return;
        }
      } catch(e){}
    }
    this.showLogin();
  },

  async login(e) {
    e.preventDefault();
    const msg=document.getElementById('loginMessage');
    msg.className='message info'; msg.textContent='กำลังตรวจสอบข้อมูล...';
    const username=document.getElementById('loginUsername').value.trim();
    const password=document.getElementById('loginPassword').value;
    const r=await ApiService.post('adminLogin',{username,password});
    if(!r || r.status!=='success') {
      msg.className='message error'; msg.textContent=r?.message || 'เข้าสู่ระบบไม่สำเร็จ'; return;
    }
    this.state.token=r.token; this.state.user=r.user;
    localStorage.setItem(CONFIG.SESSION_KEY,JSON.stringify({token:r.token,user:r.user,expiresAt:r.expiresAt}));
    msg.className='message hidden';
    this.showMain();
    if(r.mustChangePassword) {
      await Swal.fire({icon:'warning',title:'ควรเปลี่ยนรหัสผ่าน',text:'บัญชีเริ่มต้นยังใช้รหัสผ่านเริ่มต้น กรุณาเปลี่ยนในเมนูตั้งค่า',confirmButtonText:'รับทราบ'});
    }
    this.navigate('dashboard');
  },

  async logout() {
    if(!this.getToken()) return this.showLogin();
    await ApiService.post('logout',{token:this.getToken()});
    localStorage.removeItem(CONFIG.SESSION_KEY);
    this.state={token:null,user:null,page:'dashboard',qrScanner:null,cache:{}};
    this.showLogin();
  },

  showLogin() {
    document.getElementById('loginView').classList.remove('hidden');
    document.getElementById('mainView').classList.add('hidden');
  },

  showMain() {
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('mainView').classList.remove('hidden');
    const u=this.state.user||{};
    document.getElementById('userLabel').textContent=`${u.fullName||u.username||'ผู้ดูแลระบบ'} · ${u.role||'admin'}`;
  },

  async navigate(page) {
    if(this.state.qrScanner){try{await this.state.qrScanner.stop();}catch(e){} this.state.qrScanner=null;}
    this.state.page=page;
    document.querySelectorAll('#nav button[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
    document.getElementById('sidebar').classList.remove('open');
    const meta={
      dashboard:['Dashboard','ภาพรวมการดำเนินงาน'],members:['สมาชิก','ลงทะเบียนและจัดการผู้รับบริการ'],
      checkin:['เช็กอิน','บันทึกการเข้าใช้บริการด้วย QR Code'],bookings:['การจอง','ตารางนัดหมายและบริการ'],
      tests:['ทดสอบสมรรถภาพ','บันทึกผลการทดสอบและคำนวณ BMI'],programs:['โปรแกรมออกกำลังกาย','คลังโปรแกรมการฝึก'],
      exercises:['คลังท่าออกกำลังกาย','รายการท่าและวิดีโอ'],equipment:['อุปกรณ์','ติดตามสถานะและยืม-คืน'],
      reports:['รายงาน / CSV','ส่งออกข้อมูลไป Google Drive'],settings:['ตั้งค่า','ชื่อศูนย์และรหัสผ่าน']
    }[page]||[page,''];
    document.getElementById('pageTitle').textContent=meta[0];
    document.getElementById('pageSub').textContent=meta[1];
    const content=document.getElementById('content');
    content.innerHTML='<div class="loading"><div class="spinner"></div><p>กำลังโหลด...</p></div>';
    try {
      const fn=this[`page_${page}`]; if(fn) await fn.call(this,content);
      else content.innerHTML='<div class="card"><h3>ไม่พบโมดูล</h3></div>';
    } catch(e) {
      content.innerHTML=`<div class="card error-card"><h3>เกิดข้อผิดพลาด</h3><p>${Utils.esc(e.message||e)}</p><button class="btn" onclick="App.navigate('${Utils.esc(page)}')">ลองใหม่</button></div>`;
    }
  },

  async page_dashboard(el) {
    const r=await ApiService.get('getDashboardStats'); this.guard(r);
    const c=r.counts||{};
    el.innerHTML=`
      <div class="grid metrics">
        ${metric('สมาชิกทั้งหมด',c.members,'fa-users','blue')}
        ${metric('เช็กอินวันนี้',c.todayCheckIns,'fa-qrcode','green')}
        ${metric('อุปกรณ์',c.equipment,'fa-toolbox','orange')}
        ${metric('ผลทดสอบ',c.tests,'fa-heart-pulse','purple')}
        ${metric('การจองวันนี้',c.todayBookings,'fa-calendar-check','teal')}
      </div>
      <div class="grid two">
        <section class="card"><div class="card-head"><h3>เช็กอินล่าสุด</h3><button class="btn small" onclick="App.navigate('checkin')">ไปหน้าเช็กอิน</button></div>
          ${table(['เวลา','สมาชิก','ประเภท','สถานะ'],(r.recentCheckIns||[]).map(x=>[Utils.date(x.CheckInTime),`${Utils.esc(x.MemberID)} · ${Utils.esc(x.FullName)}`,Utils.esc(x.Type),status(x.Status)]),'ยังไม่มีรายการ')}
        </section>
        <section class="card"><h3>สถานะระบบ</h3><div class="system-list">
          <div><span>Google Apps Script</span><b class="ok">เชื่อมต่อ</b></div>
          <div><span>Google Sheets</span><b class="ok">พร้อมใช้งาน</b></div>
          <div><span>Session</span><b class="ok">ใช้งานอยู่</b></div>
          <div><span>Timezone</span><b>Asia/Bangkok</b></div>
        </div></section>
      </div>`;
  },

  async page_members(el) {
    const r=await ApiService.get('getMembers'); this.guard(r); const rows=r.data||[];
    el.innerHTML=`
      <div class="card"><div class="card-head"><div><h3>สมาชิก</h3><p class="muted">ทั้งหมด ${rows.length.toLocaleString()} ราย</p></div><button class="btn primary" onclick="App.memberForm()"><i class="fa-solid fa-user-plus"></i> ลงทะเบียน</button></div>
      <div class="toolbar"><input id="memberSearch" class="input" placeholder="ค้นหาชื่อ / รหัส / โทรศัพท์" oninput="App.filterTable('memberTable',this.value)"></div>
      <div id="memberTable">${table(['รหัส','ชื่อ-สกุล','เพศ','โทรศัพท์','PAR-Q','QR Code','สร้างเมื่อ'],rows.map(x=>[
        Utils.esc(x.MemberID),Utils.esc(x.FullName),Utils.esc(x.Gender),Utils.esc(x.Phone),Utils.esc(x.PARQ_Status),Utils.esc(x.QRCode),Utils.date(x.CreatedAt)
      ]),'ยังไม่มีสมาชิก')}</div></div>`;
  },

  memberForm() {
    Swal.fire({
      title:'ลงทะเบียนผู้รับบริการ',width:650,showCancelButton:true,confirmButtonText:'บันทึก',
      html:`<div class="swal-form">
        <input id="fName" class="swal2-input" placeholder="ชื่อ-สกุล *">
        <select id="fGender" class="swal2-input"><option value="">เพศ</option><option>ชาย</option><option>หญิง</option><option>อื่น ๆ</option></select>
        <input id="fBirth" type="date" class="swal2-input" placeholder="วันเกิด">
        <input id="fPhone" class="swal2-input" placeholder="โทรศัพท์">
        <input id="fEmail" type="email" class="swal2-input" placeholder="อีเมล">
        <select id="fParq" class="swal2-input"><option>ยังไม่ประเมิน</option><option>ปกติ</option><option>ต้องประเมินเพิ่มเติม</option></select>
        <input id="fQr" class="swal2-input" placeholder="QR Code (ถ้ามี) — ถ้าเว้นว่างใช้ MemberID"> </div>`,
      preConfirm:()=>({
        fullName:document.getElementById('fName').value,
        gender:document.getElementById('fGender').value,birthDate:document.getElementById('fBirth').value,
        phone:document.getElementById('fPhone').value,email:document.getElementById('fEmail').value,
        parqStatus:document.getElementById('fParq').value,qrCode:document.getElementById('fQr').value
      })
    }).then(async res=>{
      if(!res.isConfirmed)return;
      const r=await ApiService.post('registerMember',res.value);
      if(r.status==='success'){await Swal.fire({icon:'success',title:'บันทึกแล้ว',text:`รหัสสมาชิก ${r.member.MemberID}`,confirmButtonText:'ตกลง'});this.navigate('members');}
      else Swal.fire({icon:'error',title:'บันทึกไม่สำเร็จ',text:r.message});
    });
  },

  async page_checkin(el) {
    el.innerHTML=`
      <div class="grid two">
        <section class="card">
          <div class="card-head"><h3>สแกน QR Code</h3><span class="badge">กล้องมือถือ</span></div>
          <div id="reader" class="qr-reader"></div>
          <div class="scan-actions"><button class="btn primary" onclick="App.startQr()"><i class="fa-solid fa-camera"></i> เปิดกล้อง</button><button class="btn" onclick="App.stopQr()">หยุดกล้อง</button></div>
          <div class="divider">หรือกรอกรหัสด้วยตนเอง</div>
          <div class="inline-form"><input id="manualQr" class="input" placeholder="MemberID หรือ QR Code"><button class="btn primary" onclick="App.manualCheckin()">เช็กอิน</button></div>
          <div id="scanResult"></div>
        </section>
        <section class="card"><h3>เช็กอินล่าสุด</h3><div id="checkinRecent">กำลังโหลด...</div></section>
      </div>`;
    const r=await ApiService.get('getCheckIns'); this.guard(r);
    const members=await ApiService.get('getMembers'); this.guard(members);
    const map=Object.fromEntries((members.data||[]).map(m=>[m.MemberID,m.FullName]));
    const recent=(r.data||[]).slice(-20).reverse();
    document.getElementById('checkinRecent').innerHTML=table(['เวลา','รหัส','ชื่อ','ประเภท','สถานะ'],recent.map(x=>[Utils.date(x.CheckInTime),Utils.esc(x.MemberID),Utils.esc(map[x.MemberID]||'-'),Utils.esc(x.Type),status(x.Status)]),'ยังไม่มีรายการ');
  },

  async startQr() {
    if(!window.Html5Qrcode){Swal.fire('ยังโหลดตัวสแกนไม่เสร็จ','กรุณารอสักครู่แล้วลองใหม่','info');return;}
    if(this.state.qrScanner)return;
    this.state.qrScanner=new Html5Qrcode('reader');
    try{
      const cams=await Html5Qrcode.getCameras();
      if(!cams.length)throw new Error('ไม่พบกล้อง');
      const cam=cams.find(c=>/back|rear|environment/i.test(c.label))||cams[0];
      await this.state.qrScanner.start(cam.id,{fps:10,qrbox:{width:250,height:250}},async decoded=>{
        await this.processCheckin(decoded);
      },()=>{});
    }catch(e){this.state.qrScanner=null;Swal.fire('เปิดกล้องไม่ได้',e.message||String(e),'error');}
  },
  async stopQr(){if(this.state.qrScanner){try{await this.state.qrScanner.stop();}catch(e){}this.state.qrScanner=null;}},

  async manualCheckin(){const v=document.getElementById('manualQr').value.trim();if(v)await this.processCheckin(v);},
  async processCheckin(code){
    await this.stopQr();
    const r=await ApiService.post('saveCheckIn',{memberID:code,qrCode:code,type:'QR_Scan'});
    const box=document.getElementById('scanResult');
    if(r.status==='success'){
      box.innerHTML=`<div class="success-panel"><i class="fa-solid fa-circle-check"></i><div><b>เช็กอินสำเร็จ</b><span>${Utils.esc(r.member.FullName)} · ${Utils.esc(r.member.MemberID)}</span><small>${Utils.date(r.checkIn.CheckInTime)}</small></div></div>`;
      await Swal.fire({icon:'success',title:'เช็กอินสำเร็จ',text:`${r.member.FullName}`,timer:1600,showConfirmButton:false});
      setTimeout(()=>this.navigate('checkin'),500);
    }else{
      box.innerHTML=`<div class="message error">${Utils.esc(r.message)}</div>`;
      Swal.fire('เช็กอินไม่สำเร็จ',r.message,'error');
    }
  },

  async page_bookings(el){ await this.simpleDataPage(el,'getBookings','การจอง',['BookingID','MemberID','Service','BookingDate','TimeSlot','Location','Status'], 'bookingForm'); },
  async page_tests(el){ 
    const r=await ApiService.get('getTests');this.guard(r);const rows=r.data||[];
    el.innerHTML=`<div class="card"><div class="card-head"><div><h3>ผลทดสอบสมรรถภาพ</h3><p class="muted">${rows.length} รายการ</p></div><button class="btn primary" onclick="App.testForm()">บันทึกผลทดสอบ</button></div>
    ${table(['รหัสทดสอบ','สมาชิก','วันที่','น้ำหนัก','ส่วนสูง','BMI','WHR','VO2max','ระดับ','ผู้ประเมิน'],rows.map(x=>[Utils.esc(x.TestID),Utils.esc(x.MemberID),Utils.dateOnly(x.TestDate),x.Weight,x.Height,x.BMI,x.WHR,x.VO2max,Utils.esc(x.ResultLevel),Utils.esc(x.Evaluator)]),'ยังไม่มีผลทดสอบ')}</div>`;
  },
  testForm(){
    Swal.fire({title:'บันทึกผลทดสอบสมรรถภาพ',width:650,showCancelButton:true,confirmButtonText:'บันทึก',
      html:`<div class="swal-form"><input id="tMember" class="swal2-input" placeholder="MemberID *"><input id="tWeight" type="number" step="0.1" class="swal2-input" placeholder="น้ำหนัก (kg)"><input id="tHeight" type="number" step="0.1" class="swal2-input" placeholder="ส่วนสูง (cm)"><input id="tWhr" type="number" step="0.01" class="swal2-input" placeholder="WHR"><input id="tVo2" type="number" step="0.1" class="swal2-input" placeholder="VO2max"><select id="tLevel" class="swal2-input"><option>ยังไม่ประเมิน</option><option>ดีมาก</option><option>ดี</option><option>ปานกลาง</option><option>ต่ำ</option></select><input id="tEval" class="swal2-input" value="${Utils.esc(this.state.user?.fullName||'Admin')}" placeholder="ผู้ประเมิน"></div>`,
      preConfirm:()=>({memberID:v('tMember'),weight:v('tWeight'),height:v('tHeight'),whr:v('tWhr'),vo2max:v('tVo2'),resultLevel:v('tLevel'),evaluator:v('tEval')})
    }).then(async x=>{if(!x.isConfirmed)return;const r=await ApiService.post('saveTest',x.value);r.status==='success'?(await Swal.fire('บันทึกแล้ว',`BMI = ${r.test.BMI||'-'}`,'success'),this.navigate('tests')):Swal.fire('ผิดพลาด',r.message,'error');});
  },

  async page_programs(el){await this.simpleDataPage(el,'getPrograms','โปรแกรมออกกำลังกาย',['ProgramID','ProgramName','TargetGoal','Level','Description'],'programForm');},
  async page_exercises(el){await this.simpleDataPage(el,'getExercises','คลังท่าออกกำลังกาย',['ExerciseID','ExerciseName','Category','TargetMuscle','Description','VideoUrl']);},
  async page_equipment(el){
    const r=await ApiService.get('getEquipment');this.guard(r);const rows=r.data||[];
    el.innerHTML=`<div class="card"><div class="card-head"><div><h3>อุปกรณ์</h3><p class="muted">${rows.length} รายการ</p></div><button class="btn" onclick="App.navigate('reports')">ส่งออกรายงาน</button></div>
    ${table(['รหัส','ชื่ออุปกรณ์','หมวดหมู่','สถานะ','QR Code'],rows.map(x=>[Utils.esc(x.EquipmentID),Utils.esc(x.EquipmentName),Utils.esc(x.Category),status(x.Status),Utils.esc(x.QR_Code)]),'ยังไม่มีอุปกรณ์')}</div>`;
  },

  async page_reports(el){
    el.innerHTML=`<div class="grid two">
      <section class="card"><h3>ส่งออก CSV ไป Google Drive</h3><p class="muted">ระบบจะสร้างไฟล์ CSV ในโฟลเดอร์ที่กำหนดใน Google Apps Script</p>
      <div class="form-stack">${['Members','CheckIns','Tests','Bookings','Equipment','EquipmentLoans','Programs'].map(s=>`<button class="report-btn" onclick="App.exportCsv('${s}')"><i class="fa-solid fa-file-csv"></i><span>${s}</span><i class="fa-solid fa-arrow-up-right-from-square"></i></button>`).join('')}</div></section>
      <section class="card"><h3>ข้อมูลระบบ</h3><div id="reportInfo">กำลังโหลด...</div></section>
    </div>`;
    const h=await ApiService.get('health');this.guard(h);
    document.getElementById('reportInfo').innerHTML=`<div class="system-list"><div><span>Spreadsheet</span><b>${Utils.esc(h.spreadsheet||'-')}</b></div><div><span>เวลาเซิร์ฟเวอร์</span><b>${Utils.date(h.timestamp)}</b></div><div><span>Timezone</span><b>${Utils.esc(h.timezone||'-')}</b></div></div>`;
  },
  async exportCsv(sheet){const r=await ApiService.get('exportCsv',{sheet});if(r.status==='success')Swal.fire({icon:'success',title:'สร้างไฟล์แล้ว',html:`<a href="${Utils.esc(r.fileUrl)}" target="_blank" rel="noopener">เปิดไฟล์ ${Utils.esc(r.fileName)}</a>`});else Swal.fire('ส่งออกไม่สำเร็จ',r.message,'error');},

  async page_settings(el){
    const r=await ApiService.get('getSettings');this.guard(r);
    el.innerHTML=`<div class="grid two"><section class="card"><h3>ตั้งค่าศูนย์</h3><form id="settingsForm" class="form-stack"><label>ชื่อศูนย์<input id="gymName" class="input" value="${Utils.esc(r.GymName||'')}"></label><button class="btn primary" type="submit">บันทึก</button></form></section>
    <section class="card"><h3>เปลี่ยนรหัสผ่าน</h3><form id="passwordForm" class="form-stack"><label>รหัสผ่านปัจจุบัน<input id="currentPw" type="password" class="input" required></label><label>รหัสผ่านใหม่<input id="newPw" type="password" class="input" minlength="6" required></label><label>ยืนยันรหัสผ่าน<input id="confirmPw" type="password" class="input" minlength="6" required></label><button class="btn primary" type="submit">เปลี่ยนรหัสผ่าน</button></form></section></div>`;
    document.getElementById('settingsForm').onsubmit=async e=>{e.preventDefault();const x=await ApiService.post('updateSettings',{key:'GymName',value:document.getElementById('gymName').value});Swal.fire(x.status==='success'?'บันทึกแล้ว':'ผิดพลาด',x.message,x.status==='success'?'success':'error');};
    document.getElementById('passwordForm').onsubmit=async e=>{e.preventDefault();if(v('newPw')!==v('confirmPw'))return Swal.fire('ผิดพลาด','รหัสผ่านใหม่ไม่ตรงกัน','error');const x=await ApiService.post('changePassword',{currentPassword:v('currentPw'),newPassword:v('newPw')});if(x.status==='success'){Swal.fire('สำเร็จ',x.message,'success');e.target.reset();}else Swal.fire('ผิดพลาด',x.message,'error');};
  },

  async simpleDataPage(el,action,title,cols,formType){
    const r=await ApiService.get(action);this.guard(r);const rows=r.data||[];
    const headers=cols.map(c=>c).join(',');
    el.innerHTML=`<div class="card"><div class="card-head"><div><h3>${title}</h3><p class="muted">${rows.length} รายการ</p></div>${formType?`<button class="btn primary" onclick="App.${formType==='programForm'?'programForm':'bookingForm'}()"><i class="fa-solid fa-plus"></i> เพิ่ม</button>`:''}</div>
    <div class="table-wrap">${table(cols,rows.map(x=>cols.map(c=>Utils.esc(x[c]))),'ยังไม่มีข้อมูล')}</div></div>`;
  },

  bookingForm(){
    Swal.fire({title:'สร้างการจอง',width:650,showCancelButton:true,confirmButtonText:'บันทึก',
      html:`<div class="swal-form"><input id="bMember" class="swal2-input" placeholder="MemberID *"><input id="bService" class="swal2-input" placeholder="บริการ"><input id="bDate" type="date" class="swal2-input" value="${Utils.today()}"><input id="bTime" class="swal2-input" placeholder="ช่วงเวลา เช่น 09:00-10:00"><input id="bLocation" class="swal2-input" placeholder="สถานที่"></div>`,
      preConfirm:()=>({memberID:v('bMember'),service:v('bService'),bookingDate:v('bDate'),timeSlot:v('bTime'),location:v('bLocation')})
    }).then(async x=>{if(!x.isConfirmed)return;const r=await ApiService.post('saveBooking',x.value);r.status==='success'?(await Swal.fire('บันทึกแล้ว',r.booking.BookingID,'success'),this.navigate('bookings')):Swal.fire('ผิดพลาด',r.message,'error');});
  },

  programForm(){
    Swal.fire({title:'สร้างโปรแกรมออกกำลังกาย',width:650,showCancelButton:true,confirmButtonText:'บันทึก',
      html:`<div class="swal-form"><input id="pName" class="swal2-input" placeholder="ชื่อโปรแกรม *"><input id="pGoal" class="swal2-input" placeholder="เป้าหมาย"><select id="pLevel" class="swal2-input"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select><textarea id="pDesc" class="swal2-textarea" placeholder="รายละเอียด"></textarea></div>`,
      preConfirm:()=>({programName:v('pName'),targetGoal:v('pGoal'),level:v('pLevel'),description:v('pDesc')})
    }).then(async x=>{if(!x.isConfirmed)return;const r=await ApiService.post('saveProgram',x.value);r.status==='success'?(await Swal.fire('บันทึกแล้ว',r.program.ProgramID,'success'),this.navigate('programs')):Swal.fire('ผิดพลาด',r.message,'error');});
  },

  filterTable(id,q){
    const root=document.getElementById(id);if(!root)return;
    root.querySelectorAll('tbody tr').forEach(tr=>tr.style.display=tr.innerText.toLowerCase().includes(q.toLowerCase())?'':'none');
  },

  guard(r){if(!r||r.status==='error'){if(r?.message?.includes('Session')){this.logout();}throw new Error(r?.message||'API error');}}
};

function v(id){return document.getElementById(id)?.value||'';}
function metric(label,value,icon,color){return `<div class="metric card ${color}"><div class="metric-icon"><i class="fa-solid ${icon}"></i></div><div><span>${label}</span><strong>${Utils.number(value)}</strong></div></div>`;}
function status(v){const s=String(v||'-');const cls=/active|available|available|completed|checkedin|booked|returned|ปกติ|พร้อม/i.test(s)?'success':/borrow|pending|รอ|booked/i.test(s)?'warning':'neutral';return `<span class="status ${cls}">${Utils.esc(s)}</span>`;}
function table(headers,rows,empty='ไม่มีข้อมูล'){if(!rows.length)return `<div class="empty">${empty}</div>`;return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c??''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}

document.addEventListener('DOMContentLoaded',()=>App.init());

const Utils = {
  esc(value) {
    return String(value ?? '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  },
  date(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short'}).format(d);
  },
  dateOnly(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return new Intl.DateTimeFormat('th-TH',{dateStyle:'medium'}).format(d);
  },
  number(value) {
    return Number(value || 0).toLocaleString('th-TH');
  },
  money(value) {
    return Number(value || 0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
  },
  today() {
    const d = new Date();
    const tz = new Date(d.toLocaleString('en-US',{timeZone:'Asia/Bangkok'}));
    return `${tz.getFullYear()}-${String(tz.getMonth()+1).padStart(2,'0')}-${String(tz.getDate()).padStart(2,'0')}`;
  },
  downloadText(filename,text,type='text/plain;charset=utf-8') {
    const blob = new Blob([text],{type});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download=filename; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
};

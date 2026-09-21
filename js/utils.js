class Utils {
  static formatDate(dateString) {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  static bahtText(number) {
    // แปลงตัวเลขเป็นคำอ่านภาษาไทย
    return 'จำนวนเงิน ' + Number(number).toLocaleString() + ' บาทถ้วน';
  }
}

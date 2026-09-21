// ============================================================
// APPLICATION
// ============================================================

document.addEventListener(
  'DOMContentLoaded',
  function () {

    initRouter();

    loadDashboard();

  }
);


// ============================================================
// ROUTER
// ============================================================

function initRouter() {

  const links =
    document.querySelectorAll(
      '.sidebar-menu a'
    );


  links.forEach(
    function (link) {

      link.addEventListener(
        'click',
        function (e) {

          e.preventDefault();


          links.forEach(
            function (l) {

              l.classList.remove(
                'active'
              );

            }
          );


          link.classList.add(
            'active'
          );


          const page =
            link.getAttribute(
              'data-page'
            );


          handleNavigation(
            page
          );

        }
      );

    }
  );
}


// ============================================================
// NAVIGATION
// ============================================================

async function handleNavigation(
  page
) {

  const container =
    document.getElementById(
      'contentBody'
    );


  if (!container) {
    return;
  }


  container.innerHTML = `

    <div
      style="
        text-align:center;
        padding:50px;
      "
    >

      <i
        class="fa-solid fa-spinner fa-spin fa-2x"
      ></i>

      <p>
        กำลังโหลดข้อมูล...
      </p>

    </div>

  `;


  if (
    page ===
    'dashboard'
  ) {

    await loadDashboard();


  } else if (
    page ===
    'members-register'
  ) {

    container.innerHTML = `

      <div class="page-card">

        <h3>
          ลงทะเบียนผู้รับบริการ
        </h3>

        <p>
          แบบฟอร์มลงทะเบียนและคัดกรอง PAR-Q
        </p>

      </div>

    `;


  } else if (
    page ===
    'settings'
  ) {

    container.innerHTML = `

      <div class="page-card">

        <h3>
          ตั้งค่าระบบ
        </h3>

        <p>
          ตั้งค่ารหัสผ่าน Admin
          และการเชื่อมต่อระบบ
        </p>

      </div>

    `;


  } else {

    container.innerHTML = `

      <div class="page-card">

        <h3>
          โมดูล: ${escapeHtml(page)}
        </h3>

        <p>
          กำลังพัฒนาฟังก์ชันเพิ่มเติม
        </p>

      </div>

    `;
  }
}


// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {

  const container =
    document.getElementById(
      'contentBody'
    );


  if (!container) {
    return;
  }


  container.innerHTML = `

    <div
      style="
        text-align:center;
        padding:50px;
      "
    >

      <i
        class="fa-solid fa-spinner fa-spin fa-2x"
      ></i>

      <p>
        กำลังเชื่อมต่อระบบ...
      </p>

    </div>

  `;


  const stats =
    await ApiService.get(
      'getDashboardStats'
    );


  // ----------------------------------------------------------
  // API Error
  // ----------------------------------------------------------

  if (
    !stats ||
    stats.status ===
    'error'
  ) {

    container.innerHTML = `

      <div class="page-card">

        <h2>
          ภาพรวมระบบ
        </h2>

        <div
          style="
            margin-top:20px;
            padding:20px;
            background:#fff7ed;
            border:1px solid #fed7aa;
            border-radius:10px;
          "
        >

          <h3>
            ไม่สามารถโหลดข้อมูล Dashboard
          </h3>

          <p>
            กรุณาตรวจสอบการเชื่อมต่อ
            Google Apps Script
            และ Web App URL
          </p>

          <button
            class="btn"
            onclick="loadDashboard()"
          >
            <i
              class="fa-solid fa-rotate"
            ></i>
            ลองใหม่
          </button>

        </div>

      </div>

    `;

    return;
  }


  // ----------------------------------------------------------
  // Dashboard
  // ----------------------------------------------------------

  container.innerHTML = `

    <div class="page-card">

      <h2>
        ภาพรวมระบบ (Dashboard)
      </h2>


      <div
        class="dashboard-grid"
        style="
          display:grid;
          grid-template-columns:
            repeat(
              3,
              minmax(
                0,
                1fr
              )
            );
          gap:20px;
          margin-top:20px;
        "
      >


        <!-- Members -->

        <div
          class="stat-card"
          style="
            background:white;
            padding:20px;
            border-radius:12px;
            box-shadow:
              0 2px 8px
              rgba(0,0,0,0.06);
          "
        >

          <h3>
            สมาชิกทั้งหมด
          </h3>

          <p
            style="
              font-size:32px;
              font-weight:bold;
              color:
                var(--primary-color);
              margin-top:10px;
            "
          >
            ${
              Number(
                stats.totalMembers || 0
              ).toLocaleString()
            }
          </p>

        </div>


        <!-- Check-in -->

        <div
          class="stat-card"
          style="
            background:white;
            padding:20px;
            border-radius:12px;
            box-shadow:
              0 2px 8px
              rgba(0,0,0,0.06);
          "
        >

          <h3>
            เช็กอินวันนี้
          </h3>

          <p
            style="
              font-size:32px;
              font-weight:bold;
              color:#10b981;
              margin-top:10px;
            "
          >
            ${
              Number(
                stats.todayCheckIns || 0
              ).toLocaleString()
            }
          </p>

        </div>


        <!-- Equipment -->

        <div
          class="stat-card"
          style="
            background:white;
            padding:20px;
            border-radius:12px;
            box-shadow:
              0 2px 8px
              rgba(0,0,0,0.06);
          "
        >

          <h3>
            ครุภัณฑ์ทั้งหมด
          </h3>

          <p
            style="
              font-size:32px;
              font-weight:bold;
              color:#f59e0b;
              margin-top:10px;
            "
          >
            ${
              Number(
                stats.totalEquipment || 0
              ).toLocaleString()
            }
          </p>

        </div>

      </div>

    </div>

  `;
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(
  value
) {

  return String(
    value || ''
  )
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );
}

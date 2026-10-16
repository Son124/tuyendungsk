/* =========================================================================
   HỆ THỐNG BỘ LỌC & RENDER VIỆC LÀM TỰ ĐỘNG - SK VIỆT NAM
   Thiết kế bởi: Mai Hồng Nhung & Cong Cớn
   ========================================================================= */

let currentFilterType = 'all';
let currentFilterRegion = 'all';
let currentSearchTerm = '';
let currentOnlyActive = true;
let currentVisibleLimit = 12;

// Khởi chạy khi tải trang xong
function initJobsApp() {
  if (!window.JOBS_DATA || !Array.isArray(window.JOBS_DATA)) {
    console.warn("Chưa tìm thấy dữ liệu window.JOBS_DATA");
    return;
  }
  initTargetCompanySelect();
  updateFilterChipCounts();
  renderJobs();
}

// Cập nhật số lượng công việc hiển thị trên các nút Chip bộ lọc
function updateFilterChipCounts() {
  if (!window.JOBS_DATA) return;
  const allJobs = window.JOBS_DATA;
  const activeJobs = allJobs.filter(j => j.status === 'Đang Tuyển');

  // Đếm theo hình thức
  const countAll = allJobs.length;
  const countThoiVu = allJobs.filter(j => j.type.includes('Thời Vụ')).length;
  const countChinhThuc = allJobs.filter(j => j.type.includes('Chính Thức')).length;

  const countTypeAllEl = document.getElementById('countTypeAll');
  const countTypeThoiVuEl = document.getElementById('countTypeThoiVu');
  const countTypeChinhThucEl = document.getElementById('countTypeChinhThuc');
  const countRegionAllEl = document.getElementById('countRegionAll');

  if (countTypeAllEl) countTypeAllEl.innerText = countAll;
  if (countTypeThoiVuEl) countTypeThoiVuEl.innerText = countThoiVu;
  if (countTypeChinhThucEl) countTypeChinhThucEl.innerText = countChinhThuc;
  if (countRegionAllEl) countRegionAllEl.innerText = countAll;
}

// Lọc theo Hình thức: Tất cả / Thời Vụ / Chính Thức
function filterByType(type) {
  currentFilterType = type;
  currentVisibleLimit = 12; // Reset về 12 việc đầu
  updateActiveFilterChip('#typeFilterChips', type);
  renderJobs();
}

// Lọc theo Khu vực: Tất cả / Hải Phòng / Hà Nội / Hải Dương...
function filterByRegion(region) {
  currentFilterRegion = region;
  currentVisibleLimit = 12; // Reset về 12 việc đầu
  updateActiveFilterChip('#regionFilterChips', region);
  renderJobs();
}

// Tìm kiếm nhanh theo từ khóa
function handleSearchInput() {
  const input = document.getElementById('jobSearchInput');
  currentSearchTerm = input ? input.value.trim().toLowerCase() : '';
  currentVisibleLimit = 12;
  renderJobs();
}

// Bật / tắt chỉ hiện công việc đang tuyển gấp
function toggleOnlyActive(isChecked) {
  currentOnlyActive = isChecked;
  currentVisibleLimit = 12;
  renderJobs();
}

// Đặt lại toàn bộ bộ lọc về trạng thái ban đầu
function resetAllFilters() {
  currentFilterType = 'all';
  currentFilterRegion = 'all';
  currentSearchTerm = '';
  currentOnlyActive = true;
  currentVisibleLimit = 12;

  const searchInput = document.getElementById('jobSearchInput');
  if (searchInput) searchInput.value = '';

  const activeCheck = document.getElementById('onlyActiveJobsCheckbox');
  if (activeCheck) activeCheck.checked = true;

  updateActiveFilterChip('#typeFilterChips', 'all');
  updateActiveFilterChip('#regionFilterChips', 'all');
  renderJobs();
}

// Cập nhật trạng thái active (đổi màu) cho nút Chip được chọn
function updateActiveFilterChip(containerSelector, val) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  const chips = container.querySelectorAll('.filter-chip-btn');
  chips.forEach(btn => {
    const dataVal = btn.getAttribute('data-type') || btn.getAttribute('data-region');
    if (dataVal === val) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Tải thêm 12 công việc tiếp theo
function loadMoreJobs() {
  currentVisibleLimit += 12;
  renderJobs();
}

// Render động danh sách Job Card ra màn hình
function renderJobs() {
  const container = document.getElementById('jobsContainer');
  const countText = document.getElementById('filteredCountText');
  const loadMoreContainer = document.getElementById('loadMoreContainer');
  if (!container || !window.JOBS_DATA) return;

  // Lọc dữ liệu theo các tiêu chí đã chọn
  const filtered = window.JOBS_DATA.filter(job => {
    // 1. Trạng thái
    if (currentOnlyActive && job.status !== 'Đang Tuyển') {
      return false;
    }

    // 2. Hình thức
    if (currentFilterType !== 'all') {
      if (!job.type.includes(currentFilterType)) {
        return false;
      }
    }

    // 3. Khu vực
    if (currentFilterRegion !== 'all') {
      if (job.region !== currentFilterRegion) {
        return false;
      }
    }

    // 4. Tìm kiếm từ khóa
    if (currentSearchTerm) {
      const searchData = `${job.company} ${job.address} ${job.jobDetail} ${job.salary} ${job.region} ${job.bonus} ${job.type}`.toLowerCase();
      if (!searchData.includes(currentSearchTerm)) {
        return false;
      }
    }

    return true;
  });

  // Hiển thị số lượng tìm thấy
  if (countText) {
    countText.innerText = filtered.length;
  }

  // Trường hợp không có kết quả phù hợp
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="no-jobs-found">
        <h4>🔍 Không tìm thấy vị trí việc làm phù hợp</h4>
        <p>Hiện không có công việc nào khớp với bộ lọc bạn đang chọn. Bạn hãy thử bỏ bớt điều kiện lọc hoặc bấm đặt lại nhé!</p>
        <button type="button" class="btn-reset-filters" onclick="resetAllFilters()">
          🔄 Xem tất cả vị trí việc làm
        </button>
      </div>
    `;
    if (loadMoreContainer) loadMoreContainer.style.display = 'none';
    return;
  }

  // Cắt danh sách theo giới hạn hiển thị hiện tại (phân trang mượt mà)
  const displayJobs = filtered.slice(0, currentVisibleLimit);

  let htmlCards = '';
  displayJobs.forEach(job => {
    // Badge loại hình
    let typeBadge = '';
    if (job.type.includes('Chính Thức') && job.type.includes('Thời Vụ')) {
      typeBadge = '<span class="job-badge badge-both">🌟 Chính thức & Thời vụ</span>';
    } else if (job.type.includes('Chính Thức')) {
      typeBadge = '<span class="job-badge badge-chinhthuc">⭐ Chính thức</span>';
    } else {
      typeBadge = '<span class="job-badge badge-thoivu">⚡ Thời vụ</span>';
    }

    // Badge trạng thái
    const statusBadge = (job.status === 'Đang Tuyển')
      ? '<span class="job-badge badge-status-open">🟢 Đang Tuyển Gấp</span>'
      : '<span class="job-badge badge-status-closed">⚪ Tạm Ngừng</span>';

    // Badge khu vực
    const regionBadge = `<span class="job-badge badge-region">📍 ${job.region}</span>`;

    // Khối Thưởng (nếu có)
    let bonusHtml = '';
    if (job.bonus && job.bonus.trim() !== '') {
      const cleanBonus = escapeHtml(job.bonus).replace(/\n/g, '<br>');
      bonusHtml = `
        <div class="job-bonus-tag">
          🎁 <strong>Thưởng hấp dẫn:</strong><br>${cleanBonus}
        </div>
      `;
    }

    // Khối Cơ chế Lương & Phụ cấp
    let salaryHtml = '';
    if (job.salary && job.salary.trim() !== '') {
      const isBlue = job.type.includes('Chính Thức');
      const cleanSalary = escapeHtml(job.salary).replace(/\n/g, '<br>');
      salaryHtml = `
        <div class="job-sub-box ${isBlue ? 'blue' : 'amber'}">
          <div class="job-sub-title">💵 Cơ chế tiền công & Lương:</div>
          <div style="font-size: 14px; line-height: 1.55; color: #334155;">
            ${cleanSalary}
          </div>
        </div>
      `;
    }

    // Link bản đồ vị trí nếu có
    let mapLink = '';
    if (job.mapUrl && job.mapUrl.startsWith('http')) {
      mapLink = ` <a href="${job.mapUrl}" target="_blank" rel="noopener" style="color: #0284c7; font-weight: 700; text-decoration: underline; margin-left: 4px;">[Bản đồ ↗]</a>`;
    }

    // Tên chuẩn dùng để điền tự động vào Form
    const safeJobName = `${job.company} - ${job.type} (${job.region})`;

    htmlCards += `
      <div class="job-card" id="job-card-${job.id}">
        <div class="job-card-header">
          <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
            ${typeBadge}
            ${regionBadge}
            ${statusBadge}
          </div>
        </div>
        <div class="job-card-body">
          <h3 class="job-title" style="margin-bottom: 12px;">
            ${escapeHtml(job.company)}
            <span style="font-size: 15px; font-weight: 600; color: #64748b; display: block; margin-top: 4px;">
              ${job.type} • ${job.region}
            </span>
          </h3>

          <div class="job-info-block">
            <span class="info-label">📍 Địa chỉ làm việc:</span>
            <span class="info-val">${escapeHtml(job.address || 'Khu công nghiệp ' + job.region)}${mapLink}</span>
          </div>

          ${job.jobDetail ? `
            <div class="job-info-block">
              <span class="info-label">⚙️ Công việc chi tiết:</span>
              <span class="info-val">${escapeHtml(job.jobDetail)}</span>
            </div>
          ` : ''}

          <div class="job-info-block">
            <span class="info-label">👤 Yêu cầu ứng viên:</span>
            <span class="info-val">
              ${escapeHtml(job.gender || 'Nam/Nữ')} ${job.age ? '• Độ tuổi: ' + escapeHtml(job.age) : ''}
              ${job.requirements ? '• ' + escapeHtml(job.requirements) : ''}
            </span>
          </div>

          ${bonusHtml}
          ${salaryHtml}

          ${job.support ? `
            <div class="job-info-block">
              <span class="info-label">🚌 Chế độ hỗ trợ:</span>
              <span class="info-val">${escapeHtml(job.support)}</span>
            </div>
          ` : ''}

          <div class="job-info-block">
            <span class="info-label">🕒 Thời gian làm việc:</span>
            <span class="info-val">${escapeHtml(job.workTime || 'Theo ca xoay ngày/đêm')} ${job.interviewTime ? '• Phỏng vấn: ' + escapeHtml(job.interviewTime) : ''}</span>
          </div>

          <div class="job-info-block">
            <span class="info-label">📄 Hồ sơ cần có:</span>
            <span class="info-val">${escapeHtml(job.profile || 'CCCD gắn chip hoặc CCCD bản gốc / VNeID mức 2')}</span>
          </div>
        </div>
        
        <div class="job-card-footer-grid">
          <button type="button" class="btn-apply-card" onclick="selectJobAndScroll('${escapeAttr(safeJobName)}')">
            👉 Ứng Tuyển Vị Trí Này
          </button>
          <a href="https://zalo.me/0972642218" target="_blank" class="btn-zalo-card">
            💬 Nhắn Zalo
          </a>
        </div>
      </div>
    `;
  });

  container.innerHTML = htmlCards;

  // Xử lý nút xem thêm
  if (loadMoreContainer) {
    if (filtered.length > currentVisibleLimit) {
      const remaining = filtered.length - currentVisibleLimit;
      loadMoreContainer.style.display = 'block';
      loadMoreContainer.querySelector('.btn-load-more span').innerText = `Xem thêm các vị trí khác (còn ${remaining} việc) ▾`;
    } else {
      loadMoreContainer.style.display = 'none';
    }
  }
}

// Hàm chống lỗi HTML Injection
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Hàm chống lỗi Escape Attribute trong Javascript onclick
function escapeAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/'/g, "\\'")
    .replace(/"/g, '&quot;');
}

// Đổ toàn bộ danh sách công việc vào ô <select id="targetCompany"> trong Form, gom nhóm theo Tỉnh thành
function initTargetCompanySelect() {
  const select = document.getElementById("targetCompany");
  if (!select || !window.JOBS_DATA) return;

  select.innerHTML = '<option value="">-- Bấm vào đây để chọn công ty muốn ứng tuyển --</option>';

  const regionOrder = ["Hải Phòng", "Hà Nội", "Hải Dương", "Hưng Yên", "Hà Nam", "Bắc Ninh", "Quảng Ninh", "Thái Bình"];
  const regionMap = {};

  window.JOBS_DATA.forEach(job => {
    if (!regionMap[job.region]) regionMap[job.region] = [];
    regionMap[job.region].push(job);
  });

  regionOrder.forEach(reg => {
    if (regionMap[reg] && regionMap[reg].length > 0) {
      const optgroup = document.createElement("optgroup");
      optgroup.label = `📍 Khu Vực: ${reg} (${regionMap[reg].length} vị trí)`;
      regionMap[reg].forEach(job => {
        const opt = document.createElement("option");
        const val = `${job.company} - ${job.type} (${job.region})`;
        opt.value = val;
        opt.textContent = `${job.company} [${job.type}] - ${job.status === 'Đang Tuyển' ? '🟢 Đang tuyển' : '⚪ Tạm ngừng'}`;
        optgroup.appendChild(opt);
      });
      select.appendChild(optgroup);
    }
  });
}

// Khi ứng viên bấm "Ứng tuyển vị trí này" từ bất kỳ card nào: tự động điền vào Form & cuộn xuống
function selectJobAndScroll(jobName) {
  const select = document.getElementById("targetCompany");
  if (select) {
    let matched = false;
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].value === jobName || select.options[i].text.includes(jobName)) {
        select.selectedIndex = i;
        matched = true;
        break;
      }
    }
    if (!matched) {
      const opt = new Option(jobName, jobName, true, true);
      select.add(opt);
      select.value = jobName;
    }
  }

  updateActiveChip(jobName);

  // Mặc định giờ phỏng vấn 08:00 sáng
  if (typeof set24hTime === 'function') {
    set24hTime("08", "00");
  }

  const formBox = document.getElementById("form-dang-ky");
  if (formBox) {
    formBox.scrollIntoView({ behavior: "smooth", block: "start" });
    const box = document.querySelector(".company-select-box");
    if (box) {
      box.classList.add("highlight-pulse");
      setTimeout(() => box.classList.remove("highlight-pulse"), 2000);
    }
  }
}

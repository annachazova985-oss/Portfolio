const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive:true });

  const menuBtn = document.getElementById('menuBtn');
  const mobileNav = document.getElementById('mobileNav');
  function closeMobileNav(){
    if(mobileNav.classList.contains('open')){
      mobileNav.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      unlockBody();
    }
  }
  menuBtn.addEventListener('click', () => {
    const nowOpen = mobileNav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', nowOpen);
    if(nowOpen) lockBody(); else unlockBody();
  });
  mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMobileNav);
  });

  document.querySelectorAll('.hero-title .line span').forEach((el, i) => {
    el.style.animationDelay = (0.15 + i * 0.13) + 's';
  });

  // простое переключение active — только для групп без собственной логики (например, "тема обращения")
  document.querySelectorAll('.format-options').forEach(group=>{
    if(['whenOptions', 'dayOptions', 'rangeOptions'].includes(group.id)) return;
    group.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        group.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  });

  /* ---------------- MODALS (iOS-safe body lock) ---------------- */
  let lastFocused = null;
  let lockedScrollY = 0;
  let openOverlaysCount = 0;

 function lockBody(){
  if(openOverlaysCount === 0){
    lockedScrollY = window.scrollY;
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.classList.add('lock-scroll');
    document.body.classList.add('lock-scroll');
    document.body.style.paddingRight = sbw + 'px';
    document.body.style.width = 'calc(100% - ' + sbw + 'px)';
  }
  openOverlaysCount++;
}
function unlockBody(){
  openOverlaysCount = Math.max(0, openOverlaysCount - 1);
  if(openOverlaysCount === 0){
    document.documentElement.classList.remove('lock-scroll');
    document.body.classList.remove('lock-scroll');
    document.body.style.paddingRight = '';
    document.body.style.width = '';
    window.scrollTo(0, lockedScrollY);
  }
}
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');

  function openModal(){
  lastFocused = document.activeElement;
  modalOverlay.classList.add('open');
  lockBody();
  closeMobileNav();
  formOpenedAt = Date.now();
  bookingNote.style.opacity = 0;
  bookingNote.textContent = '';
  if(typeof refreshDayAvailability === 'function') refreshDayAvailability();
  const first = modalOverlay.querySelector('input');
  if(first) first.focus();
  document.addEventListener('keydown', trapFocusInModal);
}
  function closeModal(){
  modalOverlay.classList.remove('open');
  unlockBody();
  
  document.removeEventListener('keydown', trapFocusInModal);

  // сбрасываем форму, чтобы при следующем открытии она была чистой
  const form = modalOverlay.querySelector('form');
  if(form){
    form.reset();
    form.querySelectorAll('.invalid, .valid, .field-touched').forEach(el=>{
      el.classList.remove('invalid','valid','field-touched');
    });
    form.querySelectorAll('.field-error').forEach(el=>{
      el.textContent = '';
    });
  }
}
function trapFocusInModal(e){
  if(e.key !== 'Tab') return;
  const modal = modalOverlay;
  if(!modal.classList.contains('open')) return;

  const focusable = modal.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if(focusable.length === 0) return;

  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  if(!e.shiftKey && document.activeElement === last){
    e.preventDefault();
    first.focus();
  }
  if(e.shiftKey && document.activeElement === first){
    e.preventDefault();
    last.focus();
  }
}
  document.querySelectorAll('[data-open-modal]').forEach(btn=>btn.addEventListener('click', openModal));
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e=>{ if(e.target === modalOverlay) closeModal(); });

  /* ---------------- PRIVACY POLICY MODAL ---------------- */
  const privacyOverlay = document.getElementById('privacyOverlay');
  const privacyClose = document.getElementById('privacyClose');
  function openPrivacy(){
    lastFocused = document.activeElement;
    privacyOverlay.classList.add('open');
    lockBody();
    privacyClose.focus();
  }
  function closePrivacy(){
    privacyOverlay.classList.remove('open');
    unlockBody();
    if(lastFocused) lastFocused.focus();
  }
  document.getElementById('openPrivacy').addEventListener('click', openPrivacy);
  document.getElementById('openPrivacyFooter').addEventListener('click', openPrivacy);
  privacyClose.addEventListener('click', closePrivacy);
  privacyOverlay.addEventListener('click', e=>{ if(e.target === privacyOverlay) closePrivacy(); });

  /* ---------------- CALLBACK FORM: mask, validation, anti-spam, mailto ---------------- */
  const bookingForm = document.getElementById('bookingForm');
  const bnameInput = document.getElementById('bname');
  const bphoneInput = document.getElementById('bphone');
  const bmsgInput = document.getElementById('bmsg');
  const bnameError = document.getElementById('bnameError');
  const bphoneError = document.getElementById('bphoneError');
  const bmsgError = document.getElementById('bmsgError');
  const bookingSubmit = document.getElementById('bookingSubmit');
  const bookingNote = document.getElementById('bookingNote');
  const bcompanyInput = document.getElementById('bcompany');
  const topicOptions = document.getElementById('topicOptions');
  const bconsentInput = document.getElementById('bconsent');
  const bconsentError = document.getElementById('bconsentError');

  const whenOptions = document.getElementById('whenOptions');
  const dayRow = document.getElementById('dayRow');
  const dayOptions = document.getElementById('dayOptions');
  const bdateInput = document.getElementById('bdate');
  const bdateError = document.getElementById('bdateError');
  const rangeRow = document.getElementById('rangeRow');
  const rangeOptions = document.getElementById('rangeOptions');
  const rangeError = document.getElementById('rangeError');
  const rangeNote = document.getElementById('rangeNote');

  let formOpenedAt = 0;

  function formatPhoneMask(value){
    let digits = value.replace(/\D/g, '');
    if(digits.startsWith('8')) digits = '7' + digits.slice(1);
    if(digits.length && !digits.startsWith('7')) digits = '7' + digits;
    digits = digits.slice(0, 11);
    if(!digits) return '';
    let out = '+7';
    if(digits.length > 1) out += ' ' + digits.slice(1, 4);
    if(digits.length >= 5) out += ' ' + digits.slice(4, 7);
    if(digits.length >= 8) out += '-' + digits.slice(7, 9);
    if(digits.length >= 10) out += '-' + digits.slice(9, 11);
    return out;
  }
  function phoneValid(){
    return bphoneInput.value.replace(/\D/g, '').length === 11;
  }
  function currentTopic(){
    const active = topicOptions.querySelector('button.active');
    return active ? active.dataset.topic : '';
  }
  function currentWhen(){
    const active = whenOptions.querySelector('button.active');
    return active ? active.dataset.when : 'today';
  }
  function currentDay(){
    const active = dayOptions.querySelector('button.active');
    return active ? active.dataset.day : 'today';
  }
  function dayLabel(){
    const d = currentDay();
    if(d === 'today') return 'Сегодня';
    if(d === 'tomorrow') return 'Завтра';
    return bdateInput.value ? bdateInput.value.split('-').reverse().join('.') : '';
  }
  function nowDecimalHours(){
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  }
  function todayISO(){
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  // "сегодня" — это явный пресет "Сегодня", либо вручную выбранная в календаре сегодняшняя дата
  function isEffectivelyToday(){
    const day = currentDay();
    if(day === 'today') return true;
    if(day === 'custom') return bdateInput.value === todayISO();
    return false;
  }

  function markField(input, errorEl, ok, msg){
    input.classList.toggle('invalid', input.classList.contains('field-touched') && !ok);
    input.classList.toggle('valid', ok && input.value.trim() !== '');
    errorEl.textContent = (input.classList.contains('field-touched') && !ok) ? msg : '';
  }

  // если выбран сегодняшний день (пресетом или вручную) — блокируем уже прошедшие диапазоны
  function refreshRangeAvailability(){
    const isToday = isEffectivelyToday();
    const now = nowDecimalHours();
    let anyAvailable = false;
    let activeGotDisabled = false;

    rangeOptions.querySelectorAll('button').forEach(btn => {
      const from = parseFloat(btn.dataset.from);
      const pastDue = isToday && from < now;
      btn.disabled = pastDue;
      if(!pastDue) anyAvailable = true;
      if(pastDue && btn.classList.contains('active')){
        btn.classList.remove('active');
        activeGotDisabled = true;
      }
    });

    rangeNote.hidden = !(isToday && !anyAvailable);
    if(activeGotDisabled){
      rangeError.textContent = 'Невозможно выбрать прошедшее время';
    }
  }

  function refreshDayAvailability(){
  if(currentDay() === 'custom'){
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const d = String(tomorrow.getDate()).padStart(2, '0');
    bdateInput.min = `${y}-${m}-${d}`;
  } else {
    bdateInput.min = todayISO();
  }
  const todayBtn = dayOptions.querySelector('button[data-day="today"]');
  const disable = nowDecimalHours() >= 18;
  todayBtn.disabled = disable;
  if(disable && todayBtn.classList.contains('active')){
    todayBtn.classList.remove('active');
    const tomorrowBtn = dayOptions.querySelector('button[data-day="tomorrow"]');
    tomorrowBtn.classList.add('active');
    bdateInput.hidden = true;
  }
  refreshRangeAvailability();
}
  // переключатель "когда позвонить"
  whenOptions.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      whenOptions.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      rangeRow.hidden = (btn.dataset.when !== 'range');
      updateFormState();
    });
  });
  // переключатель дня
  // переключатель дня
// переключатель дня
dayOptions.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => {
    if(btn.disabled) return;
    dayOptions.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    bdateInput.hidden = (btn.dataset.day !== 'custom');

    if(btn.dataset.day !== 'custom'){
      // выбрали «Сегодня» или «Завтра» — очищаем поле даты
      bdateInput.value = '';
      bdateInput.classList.remove('field-touched', 'invalid');
      bdateError.textContent = '';
    }

    refreshDayAvailability();
updateFormState();
  });
});
  // переключатель диапазона
  rangeOptions.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      if(btn.disabled) return;
      rangeOptions.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateFormState();
    });
  });
  bdateInput.addEventListener('input', () => { refreshRangeAvailability(); updateFormState(); });
  bdateInput.addEventListener('blur', () => { bdateInput.classList.add('field-touched'); updateFormState(); });

  function updateFormState(){
    const when = currentWhen();
    const nameOk = bnameInput.value.trim().length >= 2;
    const phoneOk = phoneValid();
    const msgOk = bmsgInput.value.trim().length >= 3;

    let dayOk = true;
if(currentDay() === 'custom'){
  const val = bdateInput.value.trim();
  if(val === ''){
    dayOk = false;
    markField(bdateInput, bdateError, false, 'Укажите дату');
  } else if(val < todayISO()){
  dayOk = false;
  markField(bdateInput, bdateError, false, 'Невозможно указать прошедшую дату');
} else if(val === todayISO()){
  dayOk = false;
  markField(bdateInput, bdateError, false, 'Выберите завтрашний день или позже');
} else {
    dayOk = true;
    markField(bdateInput, bdateError, true, '');
  }
} else {
  bdateError.textContent = '';
}

    let rangeOk = true;
    if(when === 'range'){
      const activeRange = rangeOptions.querySelector('button.active');
      rangeOk = !!activeRange;
      rangeError.textContent = rangeOk ? '' : 'Выберите удобное время';
    } else {
      rangeError.textContent = '';
    }

    markField(bnameInput, bnameError, nameOk, 'Введите имя');
    markField(bphoneInput, bphoneError, phoneOk, 'Проверьте номер телефона');
    markField(bmsgInput, bmsgError, msgOk, 'Расскажите в двух словах, что нужно');

    const consentOk = bconsentInput.checked;
    bconsentError.textContent = (bconsentInput.classList.contains('field-touched') && !consentOk) ? 'Нужно ваше согласие' : '';

    bookingSubmit.disabled = !(nameOk && phoneOk && msgOk && dayOk && rangeOk && consentOk);
  }
  bconsentInput.addEventListener('change', () => {
    bconsentInput.classList.add('field-touched');
    updateFormState();
  });

  refreshDayAvailability();

  bphoneInput.addEventListener('input', (e)=>{
    const before = e.target.value.length;
    const pos = e.target.selectionStart;
    e.target.value = formatPhoneMask(e.target.value);
    const after = e.target.value.length;
    e.target.selectionStart = e.target.selectionEnd = Math.max(0, pos + (after - before));
    updateFormState();
  });
  [bnameInput, bphoneInput, bmsgInput].forEach(input => {
    input.addEventListener('input', updateFormState);
    input.addEventListener('blur', () => { input.classList.add('field-touched'); updateFormState(); });
  });

  function getSubmitHistory(){
    try{ return JSON.parse(localStorage.getItem('sreda_booking_submits') || '[]'); } catch(e){ return []; }
  }
  function saveSubmitHistory(list){
    try{ localStorage.setItem('sreda_booking_submits', JSON.stringify(list)); } catch(e){}
  }
 function showNote(text, isError){
  bookingNote.style.color = isError ? '#a4573a' : 'var(--ink-faint)';
  bookingNote.style.opacity = 1;
  bookingNote.textContent = text;
  // прокручиваем модалку вниз, чтобы сообщение было видно
  const modalBox = document.getElementById('modalOverlay').querySelector('.modal-box');
  if(modalBox){
    setTimeout(() => { modalBox.scrollTop = modalBox.scrollHeight; }, 50);
  }
}

  bookingForm.addEventListener('submit', e=>{
    e.preventDefault();
    if(bookingSubmit.disabled) return;
    if(bcompanyInput.value.trim() !== '') return; // honeypot: тихо игнорируем
    if(Date.now() - formOpenedAt < 2500){
      showNote('Проверьте форму и отправьте ещё раз через пару секунд.', true);
      return;
    }
    const now = Date.now();
    const history = getSubmitHistory().filter(t => now - t < 60*60*1000);
    if(history.length && now - history[history.length-1] < 60*1000){
      showNote('Заявка уже отправлена. Следующую можно отправить через минуту.', true);
      return;
    }
    if(history.length >= 3){
      showNote('Вы уже отправили несколько заявок — мы обязательно перезвоним, или позвоните нам напрямую.', true);
      return;
    }
    history.push(now);
    saveSubmitHistory(history);

    const topic = currentTopic();
    const when = currentWhen();
    let whenText;
    if(when === 'today') whenText = dayLabel() + ', в течение дня';
    else {
      const activeRange = rangeOptions.querySelector('button.active');
      whenText = dayLabel() + ', с ' + activeRange.dataset.from + ':00 до ' + activeRange.dataset.to + ':00';
    }
const dateObj = new Date();
const dateStr = dateObj.toLocaleString('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});
    const bodyLines = [
       'Дата заявки: ' + dateStr,
      'Тема: ' + topic,
      'Имя: ' + bnameInput.value.trim(),
      'Телефон: ' + bphoneInput.value.trim(),
      'Когда позвонить: ' + whenText,
      '',
      'Комментарий:',
      bmsgInput.value.trim()
    ];
    const mailBody = bodyLines.join('%0D%0A');
    const mailLink = 'mailto:d-tanika@yandex.ru?subject=' + encodeURIComponent(topic + ' — обратный звонок с сайта · ' + dateStr) + '&body=' + mailBody;

   // копируем текст заявки в буфер обмена — на случай, если почтовый клиент не откроется
const plainText = bodyLines.join('\n');
if(navigator.clipboard && navigator.clipboard.writeText){
  navigator.clipboard.writeText(plainText).catch(()=>{});
}

showNote('Проверьте почтовый клиент — если он открылся, отправьте письмо. Либо воспользуйтесь кнопками ниже.', false);
window.location.href = mailLink;

// показываем альтернативные способы связи — если почта не открылась
setTimeout(() => {
  bookingNote.innerHTML = `
    <span style="display:block; margin-bottom:10px;">Текст заявки скопирован. Если почтовый клиент не открылся — вставьте его в письмо или напишите нам напрямую:</span>
    <span style="display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;">
      <a href="https://t.me/+79127839100" target="_blank" rel="noopener" style="display:inline-flex; align-items:center; padding:8px 14px; background:var(--accent-deep); color:var(--paper-light); text-decoration:none; font-size:0.82rem;">Telegram</a>
      <a href="https://m.vk.ru/sreda_st" target="_blank" rel="noopener" style="display:inline-flex; align-items:center; padding:8px 14px; background:var(--accent-deep); color:var(--paper-light); text-decoration:none; font-size:0.82rem;">ВКонтакте</a>
      <a href="https://max.ru/channel_sreda_st" target="_blank" rel="noopener" style="display:inline-flex; align-items:center; padding:8px 14px; background:var(--accent-deep); color:var(--paper-light); text-decoration:none; font-size:0.82rem;">MAX</a>
      <a href="tel:+79127839100" style="display:inline-flex; align-items:center; padding:8px 14px; background:var(--accent-deep); color:var(--paper-light); text-decoration:none; font-size:0.82rem;">Позвонить</a>
    </span>
  `;
  bookingNote.style.opacity = 1;
  const modalBox = modalOverlay.querySelector('.modal-box');
  if(modalBox) modalBox.scrollTop = modalBox.scrollHeight;
}, 800);
    bookingForm.reset();
    [bnameInput, bphoneInput, bmsgInput, bdateInput].forEach(i => i.classList.remove('field-touched', 'invalid', 'valid'));
    bconsentInput.classList.remove('field-touched');
    topicOptions.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    topicOptions.querySelector('button').classList.add('active');
    whenOptions.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    whenOptions.querySelector('button').classList.add('active');
    dayOptions.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    dayOptions.querySelector('button').classList.add('active');
    rangeOptions.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    rangeRow.hidden = true;
    bdateInput.hidden = true;
    refreshDayAvailability();
    bookingSubmit.disabled = true;
  });

  document.addEventListener('keydown', e=>{
  if(e.key === 'Escape'){
    // закрываем только верхнюю модалку — не все сразу
    if(privacyOverlay.classList.contains('open')) { closePrivacy(); return; }
    if(projectOverlay.classList.contains('open')) { closeProject(); return; }
    if(modalOverlay.classList.contains('open')) { closeModal(); return; }
  }
  if(projectOverlay.classList.contains('open') && 
   !privacyOverlay.classList.contains('open') && 
   currentProject && 
   currentProject.photos.length > 1){
  if(e.key === 'ArrowLeft') galPrev.click();
  if(e.key === 'ArrowRight') galNext.click();
}
  });
  /* ---------------- PROJECTS: carousel + lightbox with galleries ---------------- */
  const projectsData = [
    {
      tag:'Квартира', title:'Квартира с латунными акцентами', meta:'Пермь · 65 м² · 2025',
      cover:'images/img-10.jpg',
      photos:[
        { img:'images/img-10.jpg', caption:'Прихожая — латунные ласточки на стене' },
        { img:'images/img-11.jpg', caption:'Прихожая — консоль у зеркала' },
        { img:'images/img-12.jpg', caption:'Коридор со световым акцентом в конце пути' },
        { img:'images/img-13.jpg', caption:'Спальня — ТВ-зона за реечной панелью' },
        { img:'images/img-14.jpg', caption:'Спальня — изголовье из велюра и открытые полки' }
      ],
      desc:'Тёплая нейтральная база, реечные панели и латунная фурнитура связывают прихожую и спальню в единый маршрут светового акцента. Стая латунных ласточек ручной работы — единственный декоративный жест во всей квартире.',
      brief:'«Хочется спокойный тёплый интерьер без лишнего декора — но чтобы в узкой прихожей не было ощущения коробки, а в спальне вечером было по-настоящему тихо и темно».'
    },
    {
      tag:'Гостиная-кухня', title:'Квартира с бордовым диваном', meta:'Пермь · визуализация',
      cover:'images/img-03.jpg',
      photos:[
        { img:'images/img-03.jpg', caption:'Гостиная и кухня единым пространством' }
      ],
      desc:'Компактная студия, где гостиная и кухня объединены в общий сценарий: бордовый диван работает акцентом, круглый обеденный стол из дуба и мраморная панель за телевизором держат баланс тёплого и строгого.',
      brief:'«Нужна современная кухня-гостиная для молодой пары — без острых углов классического минимализма, но и без вычурности. Немного цвета и характера».'
    },
    {
      tag:'Кухня и санузел', title:'Квартира в зелёных тонах', meta:'Пермь · визуализация',
      cover:'images/img-15.jpg',
      photos:[
        { img:'images/img-15.jpg', caption:'Кухня с растительным орнаментом на стенах' },
        { img:'images/img-16.jpg', caption:'Гостевой санузел в той же палитре' }
      ],
      desc:'Кухня и санузел решены в едином природном зелёном — от обоев с растительным рисунком до плитки и текстиля. Пример того, как маленькие помещения выигрывают от цельного сценария, а не набора случайных решений.',
      brief:'«Хочется живой, не скучный интерьер маленькой кухни и санузла — но без резких цветовых контрастов и трендов, которые надоедят через год».'
    },
    {
      tag:'Гостиная', title:'Квартира с изумрудной стеной', meta:'Пермь · визуализация',
      cover:'images/img-17.jpg',
      photos:[
        { img:'images/img-17.jpg', caption:'Гостиная с изумрудной акцентной стеной' }
      ],
      desc:'Гостиная-столовая, где акцентная изумрудная стена с латунными подвесами держит всю комнату, а тёплое дерево реечных панелей смягчает контраст и не даёт интерьеру стать холодным.',
      brief:'«Нужна эффектная гостиная, в которой не стыдно принимать гостей — но чтобы не было холодно и слишком строго».'
    }
  ];

  const carTrack = document.getElementById('carTrack');
carTrack.innerHTML = projectsData.map((p, i) => `
  <article class="car-card" data-index="${i}" tabindex="0" role="button" aria-label="Открыть проект: ${p.title}">
    <div class="field" style="background-image:url('${p.cover}')"></div>
    ${p.photos.length > 1 ? `<span class="soon">${p.photos.length} фото</span>` : ''}
    <span class="tag">${p.tag}</span>
    <span class="view-btn">Смотреть проект</span>
  </article>`).join('');

  document.getElementById('carPrev').addEventListener('click', ()=> carTrack.scrollBy({left:-290, behavior:'smooth'}));
  document.getElementById('carNext').addEventListener('click', ()=> carTrack.scrollBy({left:290, behavior:'smooth'}));

  const projectOverlay = document.getElementById('projectOverlay');
  const projectClose = document.getElementById('projectClose');
  const projMedia = document.getElementById('projMedia');
  const projPhotoCaption = document.getElementById('projPhotoCaption');
  const galPrev = document.getElementById('galPrev');
  const galNext = document.getElementById('galNext');
  const galCounter = document.getElementById('galCounter');
  const projTag = document.getElementById('projTag');
  const projTitle = document.getElementById('projTitle');
  const projMeta = document.getElementById('projMeta');
  const projDesc = document.getElementById('projDesc');
  const projBriefText = document.getElementById('projBriefText');

  let currentProject = null;
  let currentPhoto = 0;

  function renderGalleryPhoto(){
    const photo = currentProject.photos[currentPhoto];
    let img = projMedia.querySelector('img');
    if(!img){
      img = document.createElement('img');
      projMedia.insertBefore(img, projMedia.firstChild);
    }
    img.src = photo.img;
    img.alt = photo.caption;
    projPhotoCaption.textContent = photo.caption;
    const multi = currentProject.photos.length > 1;
    galPrev.classList.toggle('hidden', !multi);
    galNext.classList.toggle('hidden', !multi);
    galCounter.style.display = multi ? 'block' : 'none';
    galCounter.textContent = (currentPhoto+1) + ' / ' + currentProject.photos.length;
  }

  function openProject(index){
  currentProject = projectsData[index];
  currentPhoto = 0;
  lastFocused = document.activeElement;
  renderGalleryPhoto();
  projTag.textContent = currentProject.tag;
  projTitle.textContent = currentProject.title;
  projMeta.textContent = currentProject.meta;
  projDesc.textContent = currentProject.desc;
  projBriefText.textContent = currentProject.brief;
  projectOverlay.classList.add('open');
  lockBody();
  projectClose.focus();
  updateShareLinks(currentProject);
}

/* ---------------- ПОДЕЛИТЬСЯ ПРОЕКТОМ ---------------- */
function updateShareLinks(project){
  // ссылка на страницу проекта — пока это просто страница сайта с якорем
  const pageUrl = 'https://annachazova985-oss.github.io/Portfolio/';
  const shareText = project.title + ' — ' + project.meta + '. Студия дизайна «Среда»';
  
  const tg = document.getElementById('shareTelegram');
  const vk = document.getElementById('shareVK');
  const wa = document.getElementById('shareWhatsApp');
  const copy = document.getElementById('shareCopy');
  
  if(tg) tg.href = 'https://t.me/share/url?url=' + encodeURIComponent(pageUrl) + '&text=' + encodeURIComponent(shareText);
  if(vk) vk.href = 'https://vk.com/share.php?url=' + encodeURIComponent(pageUrl) + '&title=' + encodeURIComponent(shareText);
  if(wa) wa.href = 'https://wa.me/?text=' + encodeURIComponent(shareText + ' ' + pageUrl);
  
  if(copy){
    copy.onclick = function(){
      navigator.clipboard.writeText(shareText + ' ' + pageUrl).then(() => {
        const span = copy.querySelector('span');
        const original = span.textContent;
        span.textContent = 'Скопировано!';
        setTimeout(() => { span.textContent = original; }, 2000);
      }).catch(() => {
        // fallback для старых браузеров
        const ta = document.createElement('textarea');
        ta.value = shareText + ' ' + pageUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        const span = copy.querySelector('span');
        const original = span.textContent;
        span.textContent = 'Скопировано!';
        setTimeout(() => { span.textContent = original; }, 2000);
      });
    };
  }
}
  function closeProject(){
    projectOverlay.classList.remove('open');
    unlockBody();
    if(lastFocused) lastFocused.focus();
  }
  carTrack.addEventListener('click', e=>{
    const card = e.target.closest('.car-card');
    if(card) openProject(parseInt(card.dataset.index, 10));
  });
  carTrack.addEventListener('keydown', e=>{
    if(e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.car-card');
    if(card){ e.preventDefault(); openProject(parseInt(card.dataset.index, 10)); }
  });
  projectClose.addEventListener('click', closeProject);
  projectOverlay.addEventListener('click', e=>{ if(e.target === projectOverlay) closeProject(); });
  galPrev.addEventListener('click', ()=>{
    currentPhoto = (currentPhoto - 1 + currentProject.photos.length) % currentProject.photos.length;
    renderGalleryPhoto();
  });
  galNext.addEventListener('click', ()=>{
    currentPhoto = (currentPhoto + 1) % currentProject.photos.length;
    renderGalleryPhoto();
  });

  /* ---------------- TESTIMONIALS ---------------- */
  const testimonialsData = [
    { quote:'Татьяна услышала то, что мы сами не могли сформулировать про свой дом — и превратила это в пространство, в котором действительно хочется быть.', name:'Семья Ковалёвых', context:'квартира с латунными акцентами', photo:'images/img-10.jpg' },
    { quote:'Работа со студией — это не про выбор мебели по каталогу, а про очень внимательный разговор о том, как мы живём.', name:'М. и Д.', context:'загородный дом', photo:null },
    { quote:'Понравилось, что нам не пытались продать «модный» интерьер — предложили то, что подходит именно нам и нашим привычкам.', name:'Ольга', context:'квартира в зелёных тонах', photo:'images/img-15.jpg' },
    { quote:'Сроки не сдвинулись ни разу, а на площадке всегда было понятно, что происходит и почему.', name:'Артём', context:'гостиная-кухня', photo:null }
  ];

  const testTrack = document.getElementById('testTrack');
  testTrack.innerHTML = testimonialsData.map(t => {
    const initials = t.name.split(' ').map(w=>w[0]).slice(0,2).join('');
    const photoBlock = t.photo ? `<div class="test-photo"><img src="${t.photo}" alt="${t.context}"></div>` : `<div class="test-avatar">${initials}</div>`;
    return `<article class="test-card">
      ${photoBlock}
      <blockquote>${t.quote}</blockquote>
      <p class="quote-attr">${t.name}, ${t.context}</p>
    </article>`;
  }).join('');

  document.getElementById('testPrev').addEventListener('click', ()=> testTrack.scrollBy({left:-360, behavior:'smooth'}));
  document.getElementById('testNext').addEventListener('click', ()=> testTrack.scrollBy({left:360, behavior:'smooth'}));

  /* ---------------- CALCULATOR ---------------- */
  const packageRates = { standard: { name: 'Стандарт', rate: 2500 }, extended: { name: 'Расширенный', rate: 3000 } };

  const packageCols = document.querySelectorAll('#packageCompare .package-col');
  const areaInput = document.getElementById('areaInput');
  const areaPresetBtns = document.querySelectorAll('#areaPresets button');
  const areaMinus = document.getElementById('areaMinus');
  const areaPlus = document.getElementById('areaPlus');
  const calcPackageName = document.getElementById('calcPackageName');
  const calcFigure = document.getElementById('calcFigure');
  const calcSub = document.getElementById('calcSub');

  let currentPackage = 'standard';

  function fmt(n){ return 'от ' + Math.round(n/100)*100 + ' \u20BD'; }

  function clampArea(v){ return Math.min(500, Math.max(5, v || 5)); }

  function setArea(v){
    v = clampArea(v);
    areaInput.value = v;
    areaPresetBtns.forEach(b => b.classList.toggle('active', parseInt(b.dataset.area, 10) === v));
    recalc();
  }

  areaPresetBtns.forEach(btn => btn.addEventListener('click', () => setArea(parseInt(btn.dataset.area, 10))));
  areaMinus.addEventListener('click', () => setArea(parseInt(areaInput.value, 10) - 5));
  areaPlus.addEventListener('click', () => setArea(parseInt(areaInput.value, 10) + 5));
  areaInput.addEventListener('input', () => {
    areaPresetBtns.forEach(b => b.classList.toggle('active', parseInt(b.dataset.area, 10) === parseInt(areaInput.value, 10)));
    recalc();
  });
  areaInput.addEventListener('blur', () => setArea(parseInt(areaInput.value, 10)));

  packageCols.forEach(col => {
    function selectCol(){
      packageCols.forEach(c => c.classList.remove('active'));
      col.classList.add('active');
      currentPackage = col.dataset.package;
      recalc();
    }
    col.addEventListener('click', selectCol);
    col.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); selectCol(); } });
  });

  function recalc(){
  const inputArea = clampArea(parseInt(areaInput.value, 10));
  // минимальная площадь для расчёта — 10 м²
  const calcArea = Math.max(10, inputArea);
  const pkg = packageRates[currentPackage];
  const total = calcArea * pkg.rate;

  calcPackageName.textContent = pkg.name;
  calcFigure.textContent = fmt(total);

  // показываем пользователю: если он ввёл меньше 10 — сообщаем, что считаем как за 10
  if(inputArea < 10){
  calcSub.textContent = 'Помещение меньше 10 м² рассчитывается как 10 м² · от ' + pkg.rate.toLocaleString('ru-RU') + ' \u20BD/м²';
    calcSub.classList.add('calc-sub-warning');
  } else {
    calcSub.textContent = inputArea + ' м² · от ' + pkg.rate.toLocaleString('ru-RU') + ' \u20BD/м²';
    calcSub.classList.remove('calc-sub-warning');
  }
}

  recalc();

  /* ---------------- MOODBOARD ---------------- */
  const selected = { color:null, texture:null, style:[] };
  const boardPreview = document.getElementById('boardPreview');
  const boardCount = document.getElementById('boardCount');
  const sendBtn = document.getElementById('sendMoodBtn');

  // доступность с клавиатуры: каждый свотч — фокусируемая кнопка (Enter/Space активируют клик)
  document.querySelectorAll('.mood-inputs .swatch, .mood-inputs .style-card').forEach(sw => {
    sw.setAttribute('tabindex', '0');
    sw.setAttribute('role', 'button');
    sw.setAttribute('aria-label', sw.dataset.name || '');
    sw.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        sw.click();
      }
    });
  });

  function renderBoard(){
    const items = [];
    if(selected.color) items.push(selected.color);
    if(selected.texture) items.push(selected.texture);
    selected.style.forEach(s => items.push(s));

    boardPreview.innerHTML = '';
    if(items.length === 0){
      boardPreview.innerHTML = '<div class="board-empty">Выберите цвета, фактуры и настроение слева — они появятся здесь.</div>';
      boardCount.textContent = 'Пока ничего не выбрано';
      sendBtn.disabled = true;
      return;
    }
    items.forEach(it=>{
      const chip = document.createElement('div');
      chip.className = 'board-chip';
      chip.innerHTML = `<div class="board-chip-visual">${it.chipHTML}</div><span>${it.name}</span>`;
      boardPreview.appendChild(chip);
    });
    boardCount.textContent = items.length + (items.length === 1 ? ' элемент выбран' : ' элемента(ов) выбрано');
    sendBtn.disabled = false;
  }

  document.querySelectorAll('#colorSwatches .swatch').forEach(sw=>{
    sw.addEventListener('click', ()=>{
      const name = sw.dataset.name;
      const chipHTML = sw.querySelector('.chip').outerHTML;
      document.querySelectorAll('#colorSwatches .swatch').forEach(s=>s.classList.remove('selected'));
      if(selected.color && selected.color.name === name){ selected.color = null; }
      else { sw.classList.add('selected'); selected.color = { name, chipHTML }; }
      renderBoard();
    });
  });

  document.querySelectorAll('#textureSwatches .swatch').forEach(sw=>{
    sw.addEventListener('click', ()=>{
      const name = sw.dataset.name;
      const chipHTML = sw.querySelector('.chip').outerHTML;
      document.querySelectorAll('#textureSwatches .swatch').forEach(s=>s.classList.remove('selected'));
      if(selected.texture && selected.texture.name === name){ selected.texture = null; }
      else { sw.classList.add('selected'); selected.texture = { name, chipHTML }; }
      renderBoard();
    });
  });

  document.querySelectorAll('#styleSwatches .swatch').forEach(sw=>{
    sw.addEventListener('click', ()=>{
      const name = sw.dataset.name;
      const chipHTML = sw.querySelector('.chip').outerHTML;
      const idx = selected.style.findIndex(s=>s.name===name);
      if(idx > -1){
        selected.style.splice(idx,1);
        sw.classList.remove('selected');
      } else {
        if(selected.style.length >= 3){
          const removed = selected.style.shift();
          document.querySelectorAll('#styleSwatches .swatch').forEach(s=>{
            if(s.dataset.name === removed.name) s.classList.remove('selected');
          });
        }
        selected.style.push({name, chipHTML});
        sw.classList.add('selected');
      }
      renderBoard();
    });
  });

  sendBtn.addEventListener('click', ()=>{
    const lines = [];
    if(selected.color) lines.push('Цвет: ' + selected.color.name);
    if(selected.texture) lines.push('Фактура: ' + selected.texture.name);
    if(selected.style.length) lines.push('Настроение: ' + selected.style.map(s=>s.name).join(', '));
    const body = 'Здравствуйте!%0D%0A%0D%0AСобрал(а) мудборд на сайте студии «Среда»:%0D%0A' + lines.join('%0D%0A') + '%0D%0A%0D%0AРасскажу подробнее при встрече.';
    window.location.href = 'mailto:d-tanika@yandex.ru?subject=' + encodeURIComponent('Мудборд с сайта') + '&body=' + body;
  });

  /* ---------------- ACCESSIBILITY WIDGET ---------------- */
  const a11yWidget = document.getElementById('a11yWidget');
  const a11yToggle = document.getElementById('a11yToggle');
  const a11yPanel = document.getElementById('a11yPanel');
  const a11yFsBtns = document.querySelectorAll('#a11yFsBtns button');
  const a11ySpBtns = document.querySelectorAll('#a11ySpBtns button');
  const a11ySchemeBtns = document.querySelectorAll('#a11ySchemeBtns button');
  const a11yImgBtns = document.querySelectorAll('#a11yImgBtns button');

  a11yToggle.addEventListener('click', ()=>{
    const open = a11yPanel.classList.toggle('open');
    a11yToggle.setAttribute('aria-expanded', open);
  });
  document.addEventListener('click', e=>{
    if(!a11yWidget.contains(e.target)) a11yPanel.classList.remove('open');
  });
  document.addEventListener('keydown', e=>{
    if(e.key === 'Escape') a11yPanel.classList.remove('open');
  });

  function setFontSize(level){
    document.documentElement.classList.remove('a11y-fs-1', 'a11y-fs-2');
    if(level === 1) document.documentElement.classList.add('a11y-fs-1');
    if(level === 2) document.documentElement.classList.add('a11y-fs-2');
    a11yFsBtns.forEach(b => b.classList.toggle('active', parseInt(b.dataset.fs, 10) === level));
    try{ localStorage.setItem('sreda_a11y_fs', String(level)); }catch(e){}
  }
  function setSpacing(level){
    document.body.classList.remove('a11y-sp-1', 'a11y-sp-2');
    if(level === 1) document.body.classList.add('a11y-sp-1');
    if(level === 2) document.body.classList.add('a11y-sp-2');
    a11ySpBtns.forEach(b => b.classList.toggle('active', parseInt(b.dataset.sp, 10) === level));
    try{ localStorage.setItem('sreda_a11y_sp', String(level)); }catch(e){}
  }
  function setScheme(n){
    for(let i=1;i<=5;i++) document.body.classList.remove('a11y-scheme-' + i);
    if(n > 0) document.body.classList.add('a11y-scheme-' + n);
    a11ySchemeBtns.forEach(b => b.classList.toggle('active', parseInt(b.dataset.scheme, 10) === n));
    try{ localStorage.setItem('sreda_a11y_scheme', String(n)); }catch(e){}
  }
  function setImageMode(mode){
    document.body.classList.remove('a11y-img-bw', 'a11y-img-hide');
    if(mode === 'bw') document.body.classList.add('a11y-img-bw');
    if(mode === 'hide') document.body.classList.add('a11y-img-hide');
    a11yImgBtns.forEach(b => b.classList.toggle('active', b.dataset.img === mode));
    try{ localStorage.setItem('sreda_a11y_img', mode); }catch(e){}
  }

  a11yFsBtns.forEach(b => b.addEventListener('click', () => setFontSize(parseInt(b.dataset.fs, 10))));
  a11ySpBtns.forEach(b => b.addEventListener('click', () => setSpacing(parseInt(b.dataset.sp, 10))));
  a11ySchemeBtns.forEach(b => b.addEventListener('click', () => setScheme(parseInt(b.dataset.scheme, 10))));
  a11yImgBtns.forEach(b => b.addEventListener('click', () => setImageMode(b.dataset.img)));
  document.getElementById('a11yReset').addEventListener('click', () => {
    setFontSize(0); setSpacing(0); setScheme(0); setImageMode('color');
  });

  (function restoreA11y(){
    try{
      const fs = parseInt(localStorage.getItem('sreda_a11y_fs') || '0', 10);
      const sp = parseInt(localStorage.getItem('sreda_a11y_sp') || '0', 10);
      const scheme = parseInt(localStorage.getItem('sreda_a11y_scheme') || '0', 10);
      const img = localStorage.getItem('sreda_a11y_img') || 'color';
      if(fs) setFontSize(fs);
      if(sp) setSpacing(sp);
      if(scheme) setScheme(scheme);
      if(img !== 'color') setImageMode(img);
    }catch(e){}
  })();
  /* ---------------- АНИМАЦИИ ПОЯВЛЕНИЯ СЕКЦИЙ ---------------- */
(function initReveal(){
  // блоки, которые будут плавно появляться
  const sections = document.querySelectorAll('main > section, footer');
  
  // если браузер старый и не поддерживает IntersectionObserver — просто показываем всё
  if(!('IntersectionObserver' in window)){
    sections.forEach(s => s.classList.add('revealed'));
    return;
  }
  
  // добавляем класс .reveal ко всем секциям
  sections.forEach(s => s.classList.add('reveal'));
  
  // наблюдатель: когда секция попадает в поле зрения — показываем её
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target); // больше не следим за этой секцией
      }
    });
  }, {
    threshold: 0.1,        // срабатывает, когда 10% секции видно
    rootMargin: '0px 0px -80px 0px' // чуть раньше, чтобы не было "прыжка"
  });
  
  sections.forEach(s => observer.observe(s));
})();
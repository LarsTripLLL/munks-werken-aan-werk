const state = {
  screen: 'activate',
  account: { email: '', activationCode: '', password: '' },
  currentStep: 3,
  step1Question: 0,
  step1Answers: {},
  talentConsent: '',
  talentStatus: 'intro',
  cvPart: 0,
  step5Part: 0,
  step5Answers: { sources: [], preferences: [], match: '', reaction: '' },
  step6Part: 0,
  step6Answers: { about: '', fit: '', difficult: '', questions: '' },
  step7Part: 0,
  step7Answers: { directions: [], preparation: '', measurement: {} },
  finalResultReleased: false,
  messages: [
    { sender: 'coach', name: 'Brita', time: '09:18', text: 'Hoi Sam, fijn dat je er bent. Laat gerust weten als je ergens hulp bij wilt.' },
    { sender: 'me', time: '14:05', text: 'Wil je maandag samen met mij naar mijn cv kijken?' },
    { sender: 'coach', name: 'Brita', time: '14:32', text: 'Hoi Sam, natuurlijk. Neem je cv maandag gerust mee, dan kijken we er samen naar.' }
  ],
  cvData: {
    name: 'Sam de Vries', city: 'Zeist', age: '20', phone: '06 12 34 56 78', email: 'sam@email.nl',
    description: '', strengths: '', energy: '', education: '', school: '', educationStatus: '',
    experienceType: '', organization: '', experienceDescription: '', drivingLicense: '', languages: '', certificates: ''
  }
};

try {
  const savedState = JSON.parse(localStorage.getItem('munks-werkt-pilot-state') || 'null');
  if (savedState && typeof savedState === 'object') Object.assign(state, savedState);
} catch (_) { /* De pilot start met de voorbeeldgegevens als lokaal herstel niet lukt. */ }

if (!Array.isArray(state.messages) || state.messages.length === 0 ||
    (state.messages.length === 1 && state.messages[0].text === 'Hoi Sam, fijn dat je er bent. Laat gerust weten als je ergens hulp bij wilt.')) {
  state.messages = [
    { sender: 'coach', name: 'Brita', time: '09:18', text: 'Hoi Sam, fijn dat je er bent. Laat gerust weten als je ergens hulp bij wilt.' },
    { sender: 'me', time: '14:05', text: 'Wil je maandag samen met mij naar mijn cv kijken?' },
    { sender: 'coach', name: 'Brita', time: '14:32', text: 'Hoi Sam, natuurlijk. Neem je cv maandag gerust mee, dan kijken we er samen naar.' }
  ];
}

function persistState() {
  try { localStorage.setItem('munks-werkt-pilot-state', JSON.stringify(state)); } catch (_) { /* Opslag kan in een afgeschermde browser uitstaan. */ }
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[character]);
}

const step1Questions = [
  { title: 'Hoe wil je dat we jou noemen?', help: 'Vul de naam in waarmee je tijdens het traject wilt worden aangesproken.', placeholder: 'Schrijf hier je antwoord...' },
  { title: 'Wat vind je leuk om te doen?', help: 'Denk aan dingen waar je graag tijd aan besteedt. Bijvoorbeeld muziek, sport, gamen, creatief bezig zijn of afspreken met anderen.', placeholder: 'Schrijf hier je antwoord...' },
  { title: 'Waar ben je goed in?', help: 'Denk aan wat je zelf merkt en aan wat anderen weleens over jou zeggen. Bijvoorbeeld goed luisteren, doorzetten, handig zijn, samenwerken of iets creatiefs maken.', placeholder: 'Schrijf op waar jij goed in bent...' },
  { title: 'Als alles mogelijk is, wat voor werk zou je dan het liefst doen?', help: 'Je hoeft nog niet te weten of dit haalbaar is. Denk aan wat je doet, waar je werkt en met wie je werkt.', placeholder: 'Schrijf hier je antwoord...' },
  { title: 'Wat hoop je uit Munks Werkt te halen?', help: 'Bijvoorbeeld ontdekken wat bij je past, een opleiding vinden, werk zoeken en een baan vinden of verdere begeleiding.', placeholder: 'Schrijf hier je antwoord...' },
  { title: 'Wat helpt jou om je prettig te voelen in een groep?', help: 'Bijvoorbeeld rustig beginnen, duidelijke uitleg krijgen of eerst even luisteren.', placeholder: 'Schrijf hier je antwoord...' },
  { type: 'measurement', title: 'Hoe gaat het nu met jou' },
  { title: 'Is er iets wat je begeleiders vooraf moeten weten?', help: 'Je kunt hier iets delen dat helpt om jou goed te begeleiden. Je hoeft niets in te vullen als je dat niet wilt.', placeholder: 'Schrijf hier je antwoord...' }
];

const app = document.querySelector('#app');

function progress(active) {
  return `<div class="progress" aria-label="Stap ${active} van 4">
    ${[1,2,3,4].map(n => `<span class="${n <= active ? 'active' : ''}"></span>`).join('')}
  </div>`;
}

function mountainRoute(currentStep = 3) {
  const positions = [[129,305],[164,265],[207,214],[258,177],[276,130],[303,99],[326,69]];
  const routeProgressByStep = [18, 32, 49, 65, 78, 90, 100];
  const progressPercent = routeProgressByStep[Math.max(1, Math.min(7, currentStep)) - 1];
  const markers = positions.map(([x,y], index) => {
    const step = index + 1;
    if (step < currentStep) return `<g><circle cx="${x}" cy="${y}" r="15" fill="#ff5a00"></circle><text x="${x}" y="${y}" fill="#fff">${step}</text></g>`;
    if (step === currentStep) return `<g><circle cx="${x}" cy="${y}" r="18" fill="#fff" stroke="#ff5a00" stroke-width="3"></circle><text x="${x}" y="${y}" fill="#ff5a00" font-size="17">${step}</text></g>`;
    return `<g><circle cx="${x}" cy="${y}" r="14" fill="#fff"></circle><text x="${x}" y="${y}" fill="#303a3f">${step}</text></g>`;
  }).join('');
  return `<div class="mountain" aria-label="Je bent bij stap ${currentStep} van 7">
    <svg class="waw-landscape" viewBox="0 0 400 340" role="img" aria-label="Route over de grijze berg; stap ${currentStep} is bereikt">
      <image href="assets/Munks-Werkt-bergachtergrond.png" x="0" y="0" width="400" height="340" preserveAspectRatio="xMidYMid slice"></image>
      <path d="M52 340 C62 333 87 329 102 319 C114 312 117 306 129 305 C157 303 136 270 164 265 C184 255 220 242 207 214 C198 194 247 201 258 177 C271 157 253 140 276 130 C296 121 286 106 303 99 C320 89 312 75 326 69 C331 66 325 62 328 59" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"></path>
      <path d="M52 340 C62 333 87 329 102 319 C114 312 117 306 129 305 C157 303 136 270 164 265 C184 255 220 242 207 214 C198 194 247 201 258 177 C271 157 253 140 276 130 C296 121 286 106 303 99 C320 89 312 75 326 69 C331 66 325 62 328 59" pathLength="100" fill="none" stroke="#ff5a00" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${progressPercent} 100"></path>
      <g font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700" text-anchor="middle" dominant-baseline="central">
        ${markers}
      </g>
    </svg>
  </div>`;
}

function introRouteVisual(step) {
  return `<section class="card intro-route-card" aria-label="Voortgang bij stap ${step} van 7">
    ${mountainRoute(step)}
  </section>`;
}

function uiIcon(name) {
  const icons = {
    home: '<path d="M3 10.5 12 3l9 7.5"></path><path d="M5.5 9.5V21h13V9.5M9.5 21v-7h5v7"></path>',
    route: '<circle cx="6" cy="6" r="2.5"></circle><circle cx="18" cy="18" r="2.5"></circle><path d="M8.5 6h4a3 3 0 0 1 0 6h-1a3 3 0 0 0 0 6h4"></path>',
    messages: '<path d="M4 4h16v12H9l-5 4V4Z"></path><path d="M8 9h8M8 12h5"></path>',
    user: '<circle cx="12" cy="8" r="4"></circle><path d="M4.5 21a7.5 7.5 0 0 1 15 0"></path>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M7 3v4M17 3v4M3 10h18M8 14h3M8 17h6"></path>',
    folder: '<path d="M3 6h7l2 3h9v11H3V6Z"></path>',
    target: '<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="5"></circle><circle cx="12" cy="12" r="1"></circle><path d="m15 9 6-6"></path>',
    users: '<circle cx="9" cy="8" r="3"></circle><circle cx="17" cy="9" r="2.5"></circle><path d="M3 20a6 6 0 0 1 12 0M14 15a5 5 0 0 1 7 4.5"></path>'
  };
  return `<svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24">${icons[name] || icons.user}</svg>`;
}

function bottomNavigation(active) {
  return `<nav class="bottom-nav" aria-label="Hoofdnavigatie">
    <button data-screen="home" class="${active === 'home' ? 'active' : ''}">${uiIcon('home')}<span>Home</span></button>
    <button data-screen="route" class="${active === 'route' ? 'active' : ''}">${uiIcon('route')}<span>Traject</span></button>
    <button data-screen="messages" class="${active === 'messages' ? 'active' : ''}">${uiIcon('messages')}<span>Berichten</span></button>
    <button data-screen="environment" class="${active === 'environment' ? 'active' : ''}">${uiIcon('user')}<span>Mijn omgeving</span></button>
  </nav>`;
}

function connectNavigation() {
  document.querySelectorAll('[data-screen]').forEach(button => {
    button.addEventListener('click', () => {
      const next = button.dataset.screen;
      state.screen = next;
      render();
    });
  });
}

function activateScreen() {
  app.innerHTML = `
    ${progress(1)}
    <div class="eyebrow">Eerste keer</div>
    <h1>Activeer je account</h1>
    <p>Je krijgt de activatiecode van je begeleider. Daarna kies je zelf een wachtwoord.</p>
    <form class="card" id="activation-form">
      <div class="field">
        <label for="email">E-mailadres</label>
        <input id="email" type="email" autocomplete="email" required placeholder="jij@voorbeeld.nl">
      </div>
      <div class="field">
        <label for="code">Activatiecode</label>
        <input id="code" inputmode="numeric" required minlength="6" maxlength="8" placeholder="Bijvoorbeeld 482913">
      </div>
      <div class="field">
        <label for="password">Kies een wachtwoord</label>
        <input id="password" type="password" autocomplete="new-password" required minlength="8" placeholder="Minimaal 8 tekens">
        <small>Gebruik minimaal 8 tekens.</small>
      </div>
      <div class="field">
        <label for="password-repeat">Herhaal je wachtwoord</label>
        <input id="password-repeat" type="password" autocomplete="new-password" required minlength="8">
      </div>
      <div id="form-error" class="error" role="alert"></div>
      <button class="button button-primary" type="submit">Verder naar privacy</button>
    </form>
    <button id="existing-account" class="button button-secondary">Ik heb al een account</button>`;

  document.querySelector('#activation-form').addEventListener('submit', event => {
    event.preventDefault();
    const password = document.querySelector('#password').value;
    const repeat = document.querySelector('#password-repeat').value;
    if (password !== repeat) {
      document.querySelector('#form-error').textContent = 'De wachtwoorden zijn niet hetzelfde.';
      return;
    }
    state.account = {
      email: document.querySelector('#email').value,
      activationCode: document.querySelector('#code').value,
      password
    };
    state.screen = 'privacy';
    render();
  });
  document.querySelector('#existing-account').addEventListener('click', () => {
    state.screen = 'login';
    render();
  });
}

function privacyScreen() {
  app.innerHTML = `
    ${progress(2)}
    <div class="eyebrow">Jouw gegevens</div>
    <h1>Privacy en toestemming</h1>
    <p>Lees eerst hoe we met jouw gegevens omgaan en waarvoor je toestemming geeft.</p>
    <section class="card">
      <h2>Jouw privacy</h2>
      <p>Je antwoorden zijn alleen zichtbaar voor jou en de bevoegde begeleiders binnen jouw traject.</p>
      <a class="document-link" href="assets/Munks-Werkt-privacyverklaring.html" target="_blank" rel="noopener">Lees de privacyverklaring</a>
      <label class="notice"><input id="privacy" type="checkbox"> <p>Ik heb de privacyverklaring gelezen en ga akkoord.</p></label>
      <a class="document-link" href="assets/Munks-Werkt-toestemming-concept.html" target="_blank" rel="noopener">Lees de toestemmingsverklaring</a>
      <label class="notice"><input id="consent" type="checkbox"> <p>Ik heb de toestemmingsverklaring gelezen en ga akkoord.</p></label>
    </section>
    <div id="form-error" class="error" role="alert"></div>
    <button id="continue" class="button button-primary">Account activeren</button>
    <button id="back" class="button button-secondary">Terug</button>`;

  document.querySelector('#continue').addEventListener('click', () => {
    if (!document.querySelector('#privacy').checked || !document.querySelector('#consent').checked) {
      document.querySelector('#form-error').textContent = 'Vink beide verklaringen aan om verder te gaan.';
      return;
    }
    state.screen = 'faceid';
    render();
  });
  document.querySelector('#back').addEventListener('click', () => { state.screen = 'activate'; render(); });
}

function faceIdScreen() {
  app.innerHTML = `
    ${progress(3)}
    <div class="eyebrow">Makkelijk inloggen</div>
    <h1>Wil je Face ID gebruiken?</h1>
    <p>Daarmee kun je op deze telefoon sneller en veilig inloggen. Je wachtwoord blijft beschikbaar als alternatief.</p>
    <section class="card">
      <h2>Goed om te weten</h2>
      <p>Munks Werkt ontvangt je gezicht of vingerafdruk niet. Je telefoon controleert alleen dat jij het bent.</p>
    </section>
    <button id="enable-faceid" class="button button-primary">Face ID instellen</button>
    <button id="skip-faceid" class="button button-secondary">Niet nu</button>
    <button id="back" class="button button-secondary">Terug</button>`;

  const finish = () => { state.screen = 'ready'; render(); };
  document.querySelector('#enable-faceid').addEventListener('click', finish);
  document.querySelector('#skip-faceid').addEventListener('click', finish);
  document.querySelector('#back').addEventListener('click', () => { state.screen = 'privacy'; render(); });
}

function readyScreen() {
  app.innerHTML = `
    ${progress(4)}
    <div class="eyebrow">Gelukt</div>
    <h1>Je account is klaar</h1>
    <p>Je kunt nu veilig verder naar Munks Werkt.</p>
    <button id="home" class="button button-orange">Naar Home</button>
    <button id="login" class="button button-secondary">Bekijk het inlogscherm</button>
    <div class="notice"><span aria-hidden="true">i</span><p>Dit is nu een lokale demonstratie. Er worden nog geen echte accountgegevens opgeslagen.</p></div>`;
  document.querySelector('#home').addEventListener('click', () => { state.screen = 'home'; render(); });
  document.querySelector('#login').addEventListener('click', () => { state.screen = 'login'; render(); });
}

function loginScreen() {
  app.innerHTML = `
    <div class="eyebrow">Welkom terug</div>
    <h1>Log in bij Munks Werkt</h1>
    <p>Gebruik Face ID of log in met je e-mailadres en wachtwoord.</p>
    <button id="faceid-login" class="button button-primary">Inloggen met Face ID</button>
    <form class="card" id="login-form">
      <div class="field">
        <label for="login-email">E-mailadres</label>
        <input id="login-email" type="email" autocomplete="email" required placeholder="jij@voorbeeld.nl">
      </div>
      <div class="field">
        <label for="login-password">Wachtwoord</label>
        <input id="login-password" type="password" autocomplete="current-password" required>
      </div>
      <button class="button button-primary" type="submit">Inloggen</button>
    </form>
    <button id="forgot-password" class="button button-secondary">Wachtwoord vergeten</button>
    <button id="first-time" class="button button-secondary">Eerste keer? Activeer je account</button>`;

  document.querySelector('#login-form').addEventListener('submit', event => {
    event.preventDefault();
    state.screen = 'home';
    render();
  });
  document.querySelector('#faceid-login').addEventListener('click', () => alert('Face ID wordt gekoppeld zodra de beveiligde authenticatie actief is.'));
  document.querySelector('#forgot-password').addEventListener('click', () => alert('Wachtwoordherstel wordt gekoppeld aan de beveiligde authenticatie.'));
  document.querySelector('#first-time').addEventListener('click', () => { state.screen = 'activate'; render(); });
}

function homeScreen() {
  const homeStepTitles = ['Kennismaken', 'Ontdek je talenten', 'Maak je cv', 'Bespreek je cv', 'Werk zoeken en reageren', 'Bereid een gesprek voor', 'Bekijk je mogelijkheden'];
  app.innerHTML = `
    <section class="intro home-intro">
      <h1>Fijn dat je er bent</h1>
      <p>Wat wil je vandaag doen voor jouw toekomst?</p>
    </section>
    <section class="card home-card">
      <div class="eyebrow">Je huidige stap</div>
      <h2>${homeStepTitles[state.currentStep - 1]}</h2>
      ${mountainRoute(state.currentStep)}
    </section>
    <button id="view-route" class="button button-orange">Bekijk mijn route →</button>
    <section class="home-grid">
      <button class="wide-tile" data-home-screen="appointments"><span class="tile-icon">${uiIcon('calendar')}</span><div><small>VOLGENDE AFSPRAAK</small><strong>Maandag 12 mei</strong><span>10.00 – 11.00 uur</span></div><b>›</b></button>
      <button class="tile" data-home-screen="fit"><span class="tile-icon">${uiIcon('user')}</span><strong>Wat bij mij past</strong><b>›</b></button>
      <button class="tile" data-home-screen="documents"><span class="tile-icon purple">${uiIcon('folder')}</span><strong>Mijn documenten</strong><b>›</b></button>
      <button class="tile" data-home-screen="appointments"><span class="tile-icon green">${uiIcon('calendar')}</span><strong>Mijn afspraken</strong><b>›</b></button>
      <button class="tile" data-home-screen="goals"><span class="tile-icon blue">${uiIcon('target')}</span><strong>Mijn doelen</strong><b>›</b></button>
      <button class="wide-tile support-tile" data-home-screen="messages"><span class="tile-icon">${uiIcon('users')}</span><div><strong>Je staat er niet alleen voor</strong><span>Je begeleider is er om jou te helpen.</span></div><b>›</b></button>
    </section>
    ${bottomNavigation('home')}`;
  document.querySelector('#view-route').addEventListener('click', () => { state.screen = 'route'; render(); });
  document.querySelectorAll('[data-home-screen]').forEach(button => button.addEventListener('click', () => {
    state.screen = button.dataset.homeScreen;
    render();
  }));
  connectNavigation();
}

function routeScreen() {
  const steps = [
    'Kennismaken', 'Ontdek je talenten', 'Maak je cv', 'Bespreek je cv',
    'Werk zoeken en reageren', 'Bereid een gesprek voor', 'Bekijk je mogelijkheden'
  ];
  app.innerHTML = `
    <section class="intro">
      <div class="eyebrow">Jouw traject</div>
      <h1>Jouw route</h1>
      <p>Hier zie je waar je bent en welke stappen nog voor je liggen.</p>
    </section>
    <section class="card route-card">${mountainRoute(state.currentStep)}</section>
    <section class="step-list">
      ${steps.map((title, index) => {
        const step = index + 1;
        const status = step < state.currentStep ? 'Klaar' : step === state.currentStep ? 'Hier ben je nu' : 'Later';
        return `<button class="step-row ${step === state.currentStep ? 'current' : ''}"><span>${step}</span><div><strong>${title}</strong><small>${status}</small></div><b>›</b></button>`;
      }).join('')}
    </section>
    ${bottomNavigation('route')}`;
  document.querySelectorAll('.step-row').forEach((button, index) => button.addEventListener('click', () => {
    if (index === 0) {
      state.screen = 'step1-intro';
      render();
    } else if (index === 1) {
      state.screen = state.talentStatus === 'released' ? 'step2-released' : state.talentStatus === 'completed' ? 'step2-completed' : 'step2-intro';
      render();
    } else if (index === 2) {
      state.screen = 'step3-intro';
      render();
    } else if (index === 3) {
      state.screen = 'step4-group';
      render();
    } else if (index === 4) {
      state.screen = 'step5-intro';
      render();
    } else if (index === 5) {
      state.screen = 'step6-intro';
      render();
    } else if (index === 6) {
      state.screen = state.finalResultReleased ? 'step7-result' : 'step7-intro';
      render();
    } else {
      alert(`Stap ${index + 1} wordt hierna inhoudelijk gekoppeld.`);
    }
  }));
  connectNavigation();
}

function messagesScreen() {
  app.innerHTML = `
    <section class="intro">
      <div class="eyebrow">Contact</div>
      <h1>Berichten</h1>
      <p>Stuur een bericht aan je begeleiders als je een vraag hebt of ergens hulp bij wilt.</p>
    </section>
    <section class="card message-card">
      <div class="message-person">
        <span class="message-avatar">B</span>
        <div><strong>Je begeleiders</strong><small>Antwoorden je uiterlijk binnen twee werkdagen</small></div>
      </div>
      <div class="message-list">
        ${state.messages.map(message => `<article class="message-item ${message.sender === 'me' ? 'message-item-me' : 'message-item-coach'}">
          <div class="message-meta"><strong>${message.sender === 'me' ? 'Jij' : escapeHtml(message.name || 'Begeleider')}</strong><time>${escapeHtml(message.time || '')}</time></div>
          <div class="message-bubble ${message.sender === 'me' ? 'message-me' : 'message-coach'}">${escapeHtml(message.text)}</div>
        </article>`).join('')}
      </div>
      <label class="field-label">Jouw bericht
        <textarea id="message-text" placeholder="Schrijf hier je bericht..."></textarea>
      </label>
      <div class="visibility-note">${uiIcon('users')}<span>Alleen jij en je begeleiders kunnen deze berichten zien.</span></div>
      <button id="send-message" class="button button-primary">Bericht versturen</button>
    </section>
    ${bottomNavigation('messages')}`;
  document.querySelector('#send-message').addEventListener('click', () => {
    const field = document.querySelector('#message-text');
    const text = field.value.trim();
    if (!text) return;
    const time = new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    state.messages.push({ sender: 'me', time, text });
    persistState();
    messagesScreen();
  });
  connectNavigation();
}

function environmentScreen() {
  app.innerHTML = `
    <section class="intro">
      <div class="eyebrow">Persoonlijk</div>
      <h1>Mijn omgeving</h1>
      <p>Hier vind je jouw gegevens en de belangrijkste informatie over de app.</p>
    </section>
    <section class="card profile-card">
      <div class="profile-heading"><span class="profile-avatar">S</span><div><h2>Sam de Vries</h2><p>Traject Munks Werkt</p></div></div>
      <dl class="profile-details">
        <div><dt>E-mailadres</dt><dd>${state.cvData.email}</dd></div>
        <div><dt>Woonplaats</dt><dd>${state.cvData.city}</dd></div>
        <div><dt>Huidige stap</dt><dd>Stap ${state.currentStep} van 7</dd></div>
      </dl>
    </section>
    <section class="settings-list">
      <a class="settings-row" href="assets/Munks-Werkt-privacyverklaring.html" target="_blank"><span>Privacyverklaring</span><b>›</b></a>
      <a class="settings-row" href="assets/Munks-Werkt-toestemming-concept.html" target="_blank"><span>Toestemmingsverklaring</span><b>›</b></a>
      <button id="environment-login" class="settings-row"><span>Uitloggen</span><b>›</b></button>
    </section>
    ${bottomNavigation('environment')}`;
  document.querySelector('#environment-login').addEventListener('click', () => { state.screen = 'login'; render(); });
  connectNavigation();
}

function overviewHeader(eyebrow, title, text) {
  return `<section class="intro"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${text}</p></section>`;
}

function overviewFooter() {
  return `<button id="overview-home" class="button button-secondary">Terug naar Home</button>${bottomNavigation('home')}`;
}

function connectOverview() {
  document.querySelector('#overview-home').addEventListener('click', () => { state.screen = 'home'; render(); });
  connectNavigation();
}

function fitScreen() {
  const preferredWork = state.step1Answers[3] || 'Werk waarbij je praktisch bezig bent en contact hebt met mensen.';
  const strengths = state.cvData.strengths || state.step1Answers[2] || 'Goed luisteren, samenwerken en doorzetten.';
  app.innerHTML = `
    ${overviewHeader('Persoonlijk', 'Wat bij mij past', 'Hier verzamelen we wat je over jezelf, werk en opleidingen ontdekt.')}
    <section class="card overview-card">
      <article><span class="overview-icon">${uiIcon('user')}</span><div><h2>Hier ben ik goed in</h2><p>${escapeHtml(strengths)}</p></div></article>
      <article><span class="overview-icon">${uiIcon('target')}</span><div><h2>Werk dat mij aanspreekt</h2><p>${escapeHtml(preferredWork)}</p></div></article>
      <article><span class="overview-icon">${uiIcon('route')}</span><div><h2>Mijn talententest</h2><p>${state.talentStatus === 'released' ? 'De besproken uitkomsten zijn beschikbaar bij Mijn documenten.' : 'Na de bespreking met je begeleider worden de uitkomsten hier toegevoegd.'}</p></div></article>
      ${visibilityNote(false).replace('dit antwoord', 'deze informatie')}
    </section>
    ${overviewFooter()}`;
  connectOverview();
}

function documentsScreen() {
  const resultStatus = state.talentStatus === 'released' ? 'Beschikbaar' : 'Na de bespreking beschikbaar';
  app.innerHTML = `
    ${overviewHeader('Overzicht', 'Mijn documenten', 'Hier staan documenten die bij jouw traject horen.')}
    <section class="document-list">
      <button id="documents-cv" class="document-row"><span class="overview-icon purple">${uiIcon('folder')}</span><div><strong>Mijn cv</strong><small>Bekijken of downloaden</small></div><b>›</b></button>
      <button id="documents-results" class="document-row"><span class="overview-icon">${uiIcon('target')}</span><div><strong>Uitkomsten talententest</strong><small>${resultStatus}</small></div><b>›</b></button>
      <a class="document-row" href="assets/Munks-Werkt-privacyverklaring.html" target="_blank"><span class="overview-icon">${uiIcon('user')}</span><div><strong>Privacyverklaring</strong><small>Lees hoe we met gegevens omgaan</small></div><b>›</b></a>
    </section>
    ${overviewFooter()}`;
  document.querySelector('#documents-cv').addEventListener('click', () => { state.cvPart = 5; state.screen = 'step3-part'; render(); });
  document.querySelector('#documents-results').addEventListener('click', () => {
    if (state.talentStatus === 'released') { state.screen = 'step2-released'; render(); }
    else alert('De uitkomsten worden beschikbaar nadat je ze met je begeleider hebt besproken.');
  });
  connectOverview();
}

function appointmentsScreen() {
  app.innerHTML = `
    ${overviewHeader('Planning', 'Mijn afspraken', 'Bekijk wanneer en waar je volgende afspraken zijn.')}
    <section class="card appointment-list">
      <article><div class="appointment-date"><strong>12</strong><span>MEI</span></div><div><h2>Kijken naar jouw cv</h2><p>Maandag, 10.00 – 11.00 uur</p><small>Met Brita · Munks Werkt</small></div></article>
      <article><div class="appointment-date"><strong>15</strong><span>MEI</span></div><div><h2>Groepsbijeenkomst</h2><p>Donderdag, 09.30 – 11.30 uur</p><small>Met de groep · Trainingsruimte</small></div></article>
    </section>
    ${overviewFooter()}`;
  connectOverview();
}

function goalsScreen() {
  app.innerHTML = `
    ${overviewHeader('Vooruitkijken', 'Mijn doelen', 'Dit zijn de doelen waar jij tijdens het traject aan werkt.')}
    <section class="card goal-list">
      <article><span class="goal-status done">✓</span><div><h2>Ontdekken wat bij mij past</h2><p>Je hebt hierover al informatie verzameld.</p></div></article>
      <article><span class="goal-status current">2</span><div><h2>Een cv maken dat bij mij past</h2><p>Hier ben je nu mee bezig.</p></div></article>
      <article><span class="goal-status later">3</span><div><h2>Gericht kijken naar werk of een opleiding</h2><p>Dit komt later in het traject aan bod.</p></div></article>
      ${visibilityNote(false).replace('dit antwoord', 'deze doelen')}
    </section>
    ${overviewFooter()}`;
  connectOverview();
}

function step1IntroScreen() {
  app.innerHTML = `
    <section class="intro">
      <div class="eyebrow">Stap 1 · Kennismaken</div>
      <h1>Over jezelf en voor jezelf</h1>
      <p>Met deze vragen bereid je je rustig voor op de kennismaking met de groep.</p>
    </section>
    ${introRouteVisual(1)}
    <section class="card intro-card">
      <h2>Goed om te weten</h2>
      <ul class="plain-list">
        <li><span>◷</span><p>Je bent ongeveer 5 minuten bezig.</p></li>
        <li><span>▢</span><p>Iedere vraag staat op een apart scherm.</p></li>
        <li><svg class="eye-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path><circle cx="12" cy="12" r="2.75"></circle></svg><p>Alleen jij en de begeleiders kunnen je antwoorden zien.</p></li>
        <li><span>✓</span><p>Er zijn geen goede of foute antwoorden.</p></li>
      </ul>
    </section>
    <button id="start-step1" class="button button-primary">Begin met de vragen</button>
    <button id="back-route" class="button button-secondary">Terug naar mijn route</button>`;
  document.querySelector('#start-step1').addEventListener('click', () => { state.step1Question = 0; state.screen = 'step1-question'; render(); });
  document.querySelector('#back-route').addEventListener('click', () => { state.screen = 'route'; render(); });
}

function visibilityNote(isMeasurement = false) {
  return `<div class="visibility-note"><svg class="eye-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path><circle cx="12" cy="12" r="2.75"></circle></svg><span>${isMeasurement ? 'Jij, je begeleiders en de RSD kunnen deze antwoorden zien.' : 'Alleen jij en de begeleiders kunnen dit antwoord zien.'}</span></div>`;
}

function measurementFields(answer = {}) {
  const subjects = [
    'Vertrouwen in de ondersteuning en dienstverlening',
    'Vertrouwen in jezelf',
    'Motivatie',
    'Inzicht in jouw toekomst',
    'Werknemersvaardigheden'
  ];
  return `<div class="measurement-list">${subjects.map((subject, subjectIndex) => `
    <fieldset><legend>${subject}</legend><div class="score-row">
      ${[1,2,3,4,5,6,7,8,9,10].map(score => `<label><input type="radio" name="score-${subjectIndex}" value="${score}" ${String(answer[subjectIndex]) === String(score) ? 'checked' : ''}><span>${score}</span></label>`).join('')}
    </div></fieldset>`).join('')}</div>`;
}

function step1QuestionScreen() {
  const index = state.step1Question;
  const question = step1Questions[index];
  const isMeasurement = question.type === 'measurement';
  const last = index === step1Questions.length - 1;
  app.innerHTML = `
    <section class="intro compact-intro">
      <div class="eyebrow">Stap 1 · Kennismaken</div>
      <h1>${isMeasurement ? 'Hoe gaat het nu met jou' : 'Over jezelf en voor jezelf'}</h1>
      <p>${isMeasurement ? 'Kies bij iedere vraag een cijfer dat het beste past.' : 'Neem rustig de tijd. Er zijn geen foute antwoorden.'}</p>
    </section>
    <section class="card question-card">
      <div class="question-count">${isMeasurement ? 'WAAR STA JE NU' : `VRAAG ${index + 1} VAN 8`}</div>
      <h2>${isMeasurement ? 'Kies een cijfer van 1 tot 10' : question.title}</h2>
      ${isMeasurement
        ? `<p>1 is helemaal niet en 10 is helemaal wel. Er zijn geen goede of foute antwoorden.</p>${measurementFields(state.step1Answers[index] || {})}`
        : `<p>${question.help}</p><textarea id="answer" placeholder="${question.placeholder}">${state.step1Answers[index] || ''}</textarea>`}
      ${visibilityNote(isMeasurement)}
    </section>
    <button id="next-question" class="button button-primary">${last ? 'Voorbereiding afronden' : isMeasurement ? 'Opslaan en naar vraag 8' : 'Volgende vraag'}</button>
    ${!isMeasurement ? '<button id="skip-question" class="button button-link">Deze vraag overslaan</button>' : ''}
    <button id="back-question" class="button button-secondary">${index === 0 ? 'Terug naar uitleg' : 'Vorige vraag'}</button>`;

  const save = () => {
    if (isMeasurement) {
      const result = {};
      for (let subject = 0; subject < 5; subject += 1) {
        const selected = document.querySelector(`input[name="score-${subject}"]:checked`);
        if (selected) result[subject] = Number(selected.value);
      }
      state.step1Answers[index] = result;
    } else {
      state.step1Answers[index] = document.querySelector('#answer').value;
    }
  };
  document.querySelector('#next-question').addEventListener('click', () => {
    save();
    if (last) { state.screen = 'step1-done'; }
    else { state.step1Question += 1; }
    render();
  });
  const skip = document.querySelector('#skip-question');
  if (skip) skip.addEventListener('click', () => {
    state.step1Answers[index] = '';
    if (last) state.screen = 'step1-done'; else state.step1Question += 1;
    render();
  });
  document.querySelector('#back-question').addEventListener('click', () => {
    save();
    if (index === 0) state.screen = 'step1-intro'; else state.step1Question -= 1;
    render();
  });
}

function step1DoneScreen() {
  app.innerHTML = `
    <section class="intro">
      <div class="eyebrow">Stap 1 · Kennismaken</div>
      <h1>Je bent voorbereid</h1>
      <p>Je antwoorden zijn opgeslagen in deze demonstratie. Je kunt ze tijdens de kennismaking gebruiken.</p>
    </section>
    <section class="card"><h2>Fijn dat je dit hebt gedaan</h2><p>Je hoeft je antwoorden niet met de groep te delen. Jij bepaalt wat je tijdens de kennismaking vertelt.</p></section>
    <button id="finish-step1" class="button button-orange">Terug naar mijn route</button>
    <button id="review-step1" class="button button-secondary">Mijn antwoorden bekijken</button>`;
  document.querySelector('#finish-step1').addEventListener('click', () => { state.screen = 'route'; render(); });
  document.querySelector('#review-step1').addEventListener('click', () => { state.step1Question = 0; state.screen = 'step1-question'; render(); });
}

function step2IntroScreen() {
  app.innerHTML = `
    <section class="intro">
      <div class="eyebrow">Stap 2 · Ontdek je talenten</div>
      <h1>Jouw talententest</h1>
      <p>Met deze talententest ontdek je wat bij je past. Er zijn geen goede of foute antwoorden.</p>
    </section>
    ${introRouteVisual(2)}
    <section class="card">
      <div class="test-meta"><span>☷ Talententest</span><span>◷ Ongeveer 60 minuten</span></div>
      <ul class="plain-list test-info">
        <li><span>1</span><p>Kies steeds het antwoord dat het beste bij jou past.</p></li>
        <li><span>2</span><p>Neem rustig de tijd en kies wat voor jou goed voelt.</p></li>
        <li><span>3</span><p>Je begeleiders bespreken de uitkomsten eerst met je. Daarna krijg je de uitkomsten te zien.</p></li>
        <li><span>4</span><p>De uitslag is geen automatisch oordeel en bepaalt niet zelfstandig jouw advies.</p></li>
      </ul>
      <div class="consent-box">
        <h2>Wil je de talententest doen?</h2>
        <p>Je begeleiders kunnen de uitkomsten zien om ze met jou te bespreken. De RSD krijgt niet automatisch je volledige test of ruwe antwoorden.</p>
        <label><input type="radio" name="talent-consent" value="yes" ${state.talentConsent === 'yes' ? 'checked' : ''}> <span>Ik begrijp de uitleg en ga akkoord.</span></label>
        <label><input type="radio" name="talent-consent" value="discuss" ${state.talentConsent === 'discuss' ? 'checked' : ''}> <span>Ik wil dit eerst bespreken met mijn begeleider.</span></label>
      </div>
    </section>
    <div id="talent-error" class="error" role="alert"></div>
    <button id="open-talent-test" class="button button-primary">Open de talententest</button>
    <p class="external-note">De talententest opent in een nieuw venster. Als je klaar bent, sluit je de talententest en open je Munks Werkt opnieuw.</p>
    <button id="simulate-complete" class="button button-secondary">Demonstratie: test is afgerond</button>
    <button id="back-route" class="button button-secondary">Terug naar mijn route</button>`;

  document.querySelectorAll('input[name="talent-consent"]').forEach(input => input.addEventListener('change', () => { state.talentConsent = input.value; }));
  document.querySelector('#open-talent-test').addEventListener('click', () => {
    const choice = document.querySelector('input[name="talent-consent"]:checked');
    if (!choice) {
      document.querySelector('#talent-error').textContent = 'Kies eerst of je akkoord gaat of dit wilt bespreken.';
      return;
    }
    state.talentConsent = choice.value;
    if (choice.value === 'discuss') {
      document.querySelector('#talent-error').textContent = 'Bespreek dit eerst met je begeleider. De test wordt nog niet geopend.';
      return;
    }
    alert('Hier wordt later de persoonlijke link van de externe leverancier geopend.');
  });
  document.querySelector('#simulate-complete').addEventListener('click', () => { state.talentStatus = 'completed'; state.screen = 'step2-completed'; render(); });
  document.querySelector('#back-route').addEventListener('click', () => { state.screen = 'route'; render(); });
}

function step2CompletedScreen() {
  app.innerHTML = `
    <section class="intro">
      <div class="eyebrow">Stap 2 · Ontdek je talenten</div>
      <h1>Mooi, deze stap is klaar</h1>
      <p>Je hebt de talententest afgerond.</p>
    </section>
    <section class="card completion-card">
      <h2>Eerst samen bespreken</h2>
      <p>Binnen deze stap bekijk je samen met je begeleider wat de uitkomsten over jou vertellen.</p>
      <div class="notice"><span aria-hidden="true">□</span><p>Je bespreekt de uitkomsten rustig met je begeleider. Daarna zijn de uitkomsten voor je beschikbaar.</p></div>
    </section>
    <button id="view-route" class="button button-orange">Bekijk mijn route</button>
    <button id="simulate-release" class="button button-secondary">Demonstratie: gesprek is geweest</button>
    <button id="back-step2" class="button button-secondary">Terug naar stap 2</button>`;
  document.querySelector('#view-route').addEventListener('click', () => { state.screen = 'route'; render(); });
  document.querySelector('#simulate-release').addEventListener('click', () => { state.talentStatus = 'released'; state.screen = 'step2-released'; render(); });
  document.querySelector('#back-step2').addEventListener('click', () => { state.screen = 'step2-intro'; render(); });
}

function step2ReleasedScreen() {
  app.innerHTML = `
    <section class="intro">
      <div class="eyebrow">Stap 2 · Ontdek je talenten</div>
      <h1>Jouw uitkomsten zijn beschikbaar</h1>
      <p>Je hebt de uitkomsten samen met je begeleider besproken. Je kunt ze nu rustig terugkijken.</p>
    </section>
    <section class="card completion-card">
      <h2>Jouw persoonlijke uitkomsten</h2>
      <p>De talententest en het gesprek horen samen bij stap 2.</p>
      <div class="result-preview">
        <article><strong>Praktisch ingesteld</strong><span>Je leert graag door iets te doen.</span></article>
        <article><strong>Goed samenwerken</strong><span>Je luistert en helpt graag mee.</span></article>
        <article><strong>Contact met anderen</strong><span>Werk met mensen kan goed bij je passen.</span></article>
      </div>
    </section>
    <button id="view-results" class="button button-primary">Bekijk mijn uitkomsten</button>
    <button id="back-route" class="button button-secondary">Terug naar mijn route</button>`;
  document.querySelector('#view-results').addEventListener('click', () => alert('Hier wordt later het vrijgegeven persoonlijke rapport geopend.'));
  document.querySelector('#back-route').addEventListener('click', () => { state.screen = 'route'; render(); });
}

function step3IntroScreen() {
  app.innerHTML = `
    <section class="intro">
      <div class="eyebrow">Stap 3 · Maak je cv</div>
      <h1>Maak jouw cv</h1>
      <p>Je interesses, opleiding en ervaring kunnen allemaal op je cv.</p>
    </section>
    ${introRouteVisual(3)}
    <section class="card intro-card">
      <h2>We doen dit in zes onderdelen</h2>
      <ol class="part-list"><li>Jouw gegevens</li><li>Dit ben ik</li><li>Opleiding en leren</li><li>Mijn ervaring</li><li>Extra informatie</li><li>Bekijk jouw cv</li></ol>
      ${visibilityNote(false).replace('dit antwoord', 'deze gegevens')}
    </section>
    <button id="start-cv" class="button button-primary">Begin met mijn cv</button>
    <button id="back-route" class="button button-secondary">Terug naar mijn route</button>`;
  document.querySelector('#start-cv').addEventListener('click', () => { state.cvPart = 0; state.screen = 'step3-part'; render(); });
  document.querySelector('#back-route').addEventListener('click', () => { state.screen = 'route'; render(); });
}

function inputField(label, key, type = 'text') {
  const value = state.cvData[key] || '';
  if (type === 'textarea') return `<label class="field-label">${label}<textarea data-cv="${key}">${value}</textarea></label>`;
  return `<label class="field-label">${label}<input data-cv="${key}" type="${type}" value="${value}"></label>`;
}

function selectField(label, key, options) {
  return `<label class="field-label">${label}<select data-cv="${key}"><option value="">Kies wat bij jou past</option>${options.map(option => `<option ${state.cvData[key] === option ? 'selected' : ''}>${option}</option>`).join('')}</select></label>`;
}

function saveCvFields() {
  document.querySelectorAll('[data-cv]').forEach(field => { state.cvData[field.dataset.cv] = field.value; });
}

function cvPartContent(part) {
  if (part === 0) return { heading: 'Jouw gegevens', sub: 'De basis van je cv.', label: 'JOUW CV', question: 'Kloppen jouw gegevens?', help: 'Een aantal velden zijn al ingevuld. Wil je kijken of deze kloppen en waar nodig de gegevens aanpassen of aanvullen.', fields: inputField('Voor- en achternaam','name') + inputField('Woonplaats','city') + inputField('Leeftijd','age','number') + inputField('Telefoonnummer','phone','tel') + inputField('E-mailadres','email','email') };
  if (part === 1) return { heading: 'Dit ben ik', sub: 'Laat zien wie jij bent en wat bij jou past.', label: 'OVER JEZELF', question: 'Vertel iets over jezelf', help: 'Met een paar korte antwoorden maken we straks een persoonlijke tekst voor je cv.', fields: inputField('Hoe zou je jezelf omschrijven?','description','textarea') + inputField('Waar ben je goed in?','strengths','textarea') + inputField('Wat vind je leuk en waar krijg je energie van?','energy','textarea') };
  if (part === 2) return { heading: 'Opleiding en leren', sub: 'Laat zien wat je hebt geleerd.', label: 'OPLEIDING', question: 'Voeg je opleiding toe', help: 'Ook een opleiding die je niet hebt afgerond kan op je cv.', fields: inputField('Naam van de opleiding of richting','education') + inputField('School of opleider','school') + selectField('Wat is de status?','educationStatus',['Diploma behaald','Nog mee bezig','Niet afgerond']), skip: 'Ik heb geen opleiding om toe te voegen' };
  if (part === 3) return { heading: 'Mijn ervaring', sub: 'Laat zien wat je al hebt gedaan.', label: 'ERVARING', question: 'Voeg je ervaring toe', help: 'Werk, een bijbaan, stage en vrijwilligerswerk kunnen allemaal op je cv.', fields: selectField('Soort ervaring','experienceType',['Werk','Bijbaan','Stage','Vrijwilligerswerk']) + inputField('Bedrijf of organisatie','organization') + inputField('Wat deed je daar?','experienceDescription','textarea'), skip: 'Ik heb nog geen ervaring om toe te voegen' };
  return { heading: 'Extra informatie', sub: 'Voeg toe wat nog belangrijk is voor jouw cv.', label: 'AANVULLEN', question: 'Wil je nog iets toevoegen?', help: 'Dit onderdeel is niet verplicht. Vul alleen in wat voor jou van toepassing is.', fields: selectField('Rijbewijs','drivingLicense',['Geen rijbewijs','Rijbewijs AM','Rijbewijs B']) + inputField('Talen','languages') + inputField('Certificaten','certificates'), skip: 'Dit onderdeel overslaan' };
}

function step3PartScreen() {
  if (state.cvPart === 5) { step3PreviewScreen(); return; }
  const content = cvPartContent(state.cvPart);
  app.innerHTML = `
    <section class="intro compact-intro"><div class="eyebrow">Stap 3 · Onderdeel ${state.cvPart + 1} van 6</div><h1>${content.heading}</h1><p>${content.sub}</p></section>
    <section class="card question-card"><div class="question-count">${content.label}</div><h2>${content.question}</h2><p>${content.help}</p><div class="cv-fields">${content.fields}</div>${visibilityNote(false).replace('dit antwoord', 'deze gegevens')}</section>
    <button id="cv-next" class="button button-primary">${state.cvPart === 4 ? 'Opslaan en bekijk mijn cv' : 'Opslaan en verder'}</button>
    ${content.skip ? `<button id="cv-skip" class="button button-link">${content.skip}</button>` : ''}
    <button id="cv-back" class="button button-secondary">${state.cvPart === 0 ? 'Terug naar uitleg' : 'Vorig onderdeel'}</button>`;
  document.querySelector('#cv-next').addEventListener('click', () => { saveCvFields(); state.cvPart += 1; render(); });
  const skip = document.querySelector('#cv-skip');
  if (skip) skip.addEventListener('click', () => { state.cvPart += 1; render(); });
  document.querySelector('#cv-back').addEventListener('click', () => { saveCvFields(); if (state.cvPart === 0) state.screen = 'step3-intro'; else state.cvPart -= 1; render(); });
}

function cvIntroduction() {
  const parts = [state.cvData.description, state.cvData.strengths, state.cvData.energy].filter(Boolean);
  return parts.length ? parts.join(' ') : 'Vul bij “Dit ben ik” iets over jezelf in om hier een persoonlijke introductie te maken.';
}

function step3PreviewScreen() {
  const data = state.cvData;
  app.innerHTML = `
    <section class="intro compact-intro"><div class="eyebrow">Stap 3 · Onderdeel 6 van 6</div><h1>Bekijk jouw cv</h1><p>Controleer rustig of alles klopt.</p></section>
    <section class="card"><div class="question-count">JOUW CV</div><div class="cv-preview"><h2>${data.name || 'Jouw naam'}</h2><p>${[data.city, data.age ? `${data.age} jaar` : '', data.phone, data.email].filter(Boolean).join(' · ')}</p><h3>Over mij</h3><p>${cvIntroduction()}</p><h3>Opleiding</h3><p>${[data.education, data.school, data.educationStatus].filter(Boolean).join(' · ') || 'Nog niet ingevuld'}</p><h3>Ervaring</h3><p>${[data.experienceType, data.organization, data.experienceDescription].filter(Boolean).join(' · ') || 'Nog niet ingevuld'}</p><h3>Extra</h3><p>${[data.drivingLicense, data.languages, data.certificates].filter(Boolean).join(' · ') || 'Nog niet ingevuld'}</p></div>${visibilityNote(false).replace('dit antwoord', 'jouw cv')}<div class="notice"><span aria-hidden="true">i</span><p>Wil je hulp met de tekst? Laat de AI-assistent meekijken voordat je jouw cv opslaat.</p></div></section>
    <button id="download-cv" class="button button-primary">Download mijn cv</button>
    <button id="ai-cv" class="button button-secondary">Laat de AI-assistent meekijken</button>
    <button id="edit-cv" class="button button-secondary">Gegevens aanpassen</button>
    <button id="back-route" class="button button-secondary">Terug naar mijn route</button>`;
  document.querySelector('#download-cv').addEventListener('click', downloadCvDemo);
  document.querySelector('#ai-cv').addEventListener('click', () => alert('De AI-assistent voor cv-feedback wordt later aan dit scherm gekoppeld.'));
  document.querySelector('#edit-cv').addEventListener('click', () => { state.cvPart = 0; render(); });
  document.querySelector('#back-route').addEventListener('click', () => { state.screen = 'route'; render(); });
}

function downloadCvDemo() {
  const d = state.cvData;
  const content = `${d.name}\n${d.city} · ${d.age ? `${d.age} jaar` : ''} · ${d.phone} · ${d.email}\n\nOVER MIJ\n${cvIntroduction()}\n\nOPLEIDING\n${d.education} · ${d.school} · ${d.educationStatus}\n\nERVARING\n${d.experienceType} · ${d.organization}\n${d.experienceDescription}\n\nEXTRA\n${d.drivingLicense} · ${d.languages} · ${d.certificates}`;
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'mijn-cv-demonstratie.txt'; link.click(); URL.revokeObjectURL(url);
}

function step4GroupScreen() {
  app.innerHTML = `
    <section class="intro">
      <div class="eyebrow">Stap 4 · Bespreek je cv</div>
      <h1>Samen naar je cv kijken</h1>
      <p>Je cv is klaar voor de groepsbijeenkomst.</p>
    </section>
    ${introRouteVisual(4)}
    <section class="card">
      <p>Tijdens de groepsbijeenkomst bekijken jullie de cv’s en krijg je tips waarmee je jouw cv sterker kunt maken.</p>
      <div class="meeting-list">
        <article><span class="meeting-icon">✓</span><div><strong>Bekijk je cv vooraf</strong><p>Controleer nog één keer of alles klopt.</p></div></article>
        <article><svg class="eye-icon meeting-eye" aria-hidden="true" viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path><circle cx="12" cy="12" r="2.75"></circle></svg><div><strong>Jij kiest wat je bespreekt</strong><p>Je bepaalt zelf wat je tijdens de bijeenkomst wilt laten zien.</p></div></article>
        <article><span class="meeting-icon">↻</span><div><strong>Verwerk de tips</strong><p>Na de bijeenkomst kun je jouw cv nog aanpassen.</p></div></article>
      </div>
    </section>
    <button id="step4-view-cv" class="button button-primary">Bekijk mijn cv</button>
    <button id="step4-edit-cv" class="button button-secondary">Mijn cv aanpassen</button>
    <button id="step4-route" class="button button-secondary">Terug naar mijn route</button>`;
  document.querySelector('#step4-view-cv').addEventListener('click', () => { state.cvPart = 5; state.screen = 'step3-part'; render(); });
  document.querySelector('#step4-edit-cv').addEventListener('click', () => { state.cvPart = 0; state.screen = 'step3-part'; render(); });
  document.querySelector('#step4-route').addEventListener('click', () => { state.screen = 'route'; render(); });
}

const workSources = [
  ['Websites met banen', 'Zoek op werk, plaats en het aantal uren.'],
  ['Bij een werkgever', 'Kijk op de website of loop eens binnen.'],
  ['Uitzendbureau', 'Een uitzendbureau kan met je meedenken.'],
  ['Via mensen die je kent', 'Vraag familie, vrienden of bekenden of zij iets weten.']
];

function toggleChoice(key, value) {
  const answers = key === 'directions' ? state.step7Answers : state.step5Answers;
  const values = answers[key];
  answers[key] = values.includes(value) ? values.filter(item => item !== value) : [...values, value];
  render();
}

function step5IntroScreen() {
  app.innerHTML = `
    <section class="intro"><div class="eyebrow">Stap 5 · Werk zoeken en reageren</div><h1>Zo vind je werk dat bij je past</h1><p>Je ontdekt waar je werk kunt vinden, waar je op kunt letten en hoe je kunt reageren.</p></section>
    ${introRouteVisual(5)}
    <section class="card intro-card"><h2>Dit ga je doen</h2><ul class="plain-list">
      <li><span>1</span><p>Ontdekken waar je werk kunt vinden.</p></li>
      <li><span>2</span><p>Bekijken wat voor werk en welk bedrijf bij jou passen.</p></li>
      <li><span>3</span><p>Een voorbeeld bekijken en een reactie voorbereiden.</p></li>
    </ul><div class="notice"><span aria-hidden="true">i</span><p>Je hoeft in deze stap nog niet echt te solliciteren. Als je een passende baan vindt, kan dat natuurlijk wel.</p></div></section>
    <button id="step5-start" class="button button-primary">Begin met deze stap</button><button id="step5-route" class="button button-secondary">Terug naar mijn route</button>`;
  document.querySelector('#step5-start').onclick = () => { state.step5Part = 0; state.screen = 'step5-part'; render(); };
  document.querySelector('#step5-route').onclick = () => { state.screen = 'route'; render(); };
}

function choiceCards(items, selected, key) {
  return `<div class="choice-list">${items.map(([title, text]) => `<button class="choice-card ${selected.includes(title) ? 'selected' : ''}" data-choice="${title}" data-key="${key}"><span class="choice-check">${selected.includes(title) ? '✓' : ''}</span><div><strong>${title}</strong><p>${text}</p></div></button>`).join('')}</div>`;
}

function vacancyCard() {
  return `<article class="vacancy-card"><div class="question-count">VOORBEELD VAN EEN BAAN</div><h3>Verkoopmedewerker kledingwinkel</h3><p class="vacancy-company">Kledingwinkel · Zeist · 24–32 uur</p><dl><div><dt>Wat ga je doen?</dt><dd>Klanten helpen, kleding netjes houden en achter de kassa werken.</dd></div><div><dt>Wat vragen ze?</dt><dd>Je bent vriendelijk, helpt graag mensen en vindt samenwerken prettig.</dd></div><div><dt>Het bedrijf</dt><dd>Een middelgrote winkel met een jong team en een informele sfeer.</dd></div></dl></article>`;
}

function step5PartScreen() {
  const part = state.step5Part;
  let body = '';
  if (part === 0) body = `<section class="intro compact-intro"><div class="eyebrow">Stap 5 · 1 van 6</div><h1>Waar kun je werk vinden?</h1><p>Er zijn verschillende manieren. Kies wat jij zou willen proberen.</p></section><section class="card question-card">${choiceCards(workSources, state.step5Answers.sources, 'sources')}${visibilityNote()}</section>`;
  if (part === 1) body = `<section class="intro compact-intro"><div class="eyebrow">Stap 5 · 2 van 6</div><h1>Wat past bij jou?</h1><p>Waar wil jij op letten als je naar werk kijkt?</p></section><section class="card question-card">${choiceCards([
    ['Het werk past bij mij', 'De taken lijken mij leuk en passen bij wat ik kan.'],
    ['De plek is goed bereikbaar', 'Ik kan er zonder veel gedoe komen.'],
    ['De uren passen bij mij', 'Het aantal uren en de werktijden passen bij mijn situatie.'],
    ['Het bedrijf past bij mij', 'De grootte, sfeer en manier van samenwerken voelen goed.']
  ], state.step5Answers.preferences, 'preferences')}${visibilityNote()}</section>`;
  if (part === 2) body = `<section class="intro compact-intro"><div class="eyebrow">Stap 5 · 3 van 6</div><h1>Een baan bekijken</h1><p>Lees rustig wat het werk inhoudt en wat het bedrijf zoekt.</p></section><section class="card">${vacancyCard()}</section>`;
  if (part === 3) body = `<section class="intro compact-intro"><div class="eyebrow">Stap 5 · 4 van 6</div><h1>Past deze baan bij mij?</h1><p>Denk aan het werk én aan het bedrijf.</p></section><section class="card question-card">${vacancyCard()}<label class="field-label">Wat denk jij?<select id="match-answer"><option value="">Kies een antwoord</option><option ${state.step5Answers.match === 'Ja' ? 'selected' : ''}>Ja</option><option ${state.step5Answers.match === 'Misschien' ? 'selected' : ''}>Misschien</option><option ${state.step5Answers.match === 'Nee' ? 'selected' : ''}>Nee</option></select></label>${visibilityNote()}</section>`;
  if (part === 4) body = `<section class="intro compact-intro"><div class="eyebrow">Stap 5 · 5 van 6</div><h1>Hoe kun je reageren?</h1><p>Een reactie mag kort, duidelijk en persoonlijk zijn.</p></section><section class="card"><div class="reaction-example"><div class="question-count">VOORBEELD</div><p>Hoi, de baan als verkoopmedewerker in jullie kledingwinkel lijkt mij heel leuk en past denk ik goed bij mij. Ik help graag mensen en zou graag kennismaken.</p><p>Groet,<br>Sam</p></div><div class="notice"><span aria-hidden="true">i</span><p>Je kunt reageren via een formulier, e-mail, telefoon of door langs te gaan. Kijk wat het bedrijf vraagt.</p></div></section>`;
  if (part === 5) body = `<section class="intro compact-intro"><div class="eyebrow">Stap 5 · 6 van 6</div><h1>Jouw reactie voorbereiden</h1><p>Schrijf hoe jij op deze baan zou kunnen reageren.</p></section><section class="card question-card"><label class="field-label">Jouw reactie<textarea id="reaction-answer" placeholder="Schrijf hier jouw reactie...">${state.step5Answers.reaction}</textarea></label>${visibilityNote()}<div class="ai-helper"><strong>Hulp van de AI-assistent</strong><p>Laat je reactie controleren of vraag hulp bij het schrijven.</p><button id="step5-ai" class="button button-secondary">Vraag de AI-assistent</button></div></section>`;
  app.innerHTML = `${body}<button id="step5-next" class="button button-primary">${part === 5 ? 'Rond deze stap af' : 'Volgende'}</button><button id="step5-back" class="button button-secondary">${part === 0 ? 'Terug naar uitleg' : 'Vorige'}</button>`;
  document.querySelectorAll('.choice-card').forEach(button => button.onclick = () => toggleChoice(button.dataset.key, button.dataset.choice));
  const match = document.querySelector('#match-answer'); if (match) match.onchange = () => { state.step5Answers.match = match.value; };
  const reaction = document.querySelector('#reaction-answer'); if (reaction) reaction.oninput = () => { state.step5Answers.reaction = reaction.value; };
  const ai = document.querySelector('#step5-ai'); if (ai) ai.onclick = () => alert('De AI-assistent wordt later aan dit onderdeel gekoppeld.');
  document.querySelector('#step5-next').onclick = () => { if (part === 5) state.screen = 'step5-done'; else state.step5Part += 1; render(); };
  document.querySelector('#step5-back').onclick = () => { if (part === 0) state.screen = 'step5-intro'; else state.step5Part -= 1; render(); };
}

function step5DoneScreen() {
  state.currentStep = Math.max(state.currentStep, 6);
  app.innerHTML = `<section class="intro"><div class="eyebrow">Stap 5 · Klaar</div><h1>Je weet hoe je werk kunt zoeken en reageren</h1><p>Je kunt nu gerichter kijken welke baan en welk bedrijf bij jou passen.</p></section><section class="card completion-card"><h2>Mooi gedaan</h2><p>Heb je een baan gevonden waarop je echt wilt reageren? Bespreek dit met je begeleider of gebruik de AI-assistent om je reactie verder af te maken.</p>${visibilityNote()}</section><button id="step5-route" class="button button-orange">Terug naar mijn route</button>`;
  document.querySelector('#step5-route').onclick = () => { state.screen = 'route'; render(); };
}

const interviewQuestions = [
  ['Vertel eens iets over jezelf', 'Wie ben je en wat vind je leuk om te doen?'],
  ['Waarom past dit werk bij jou?', 'Wat spreekt je aan en wat kun je goed?'],
  ['Kun je een lastig moment beschrijven?', 'Wat gebeurde er, wat deed jij en wat heb je geleerd?'],
  ['Heb jij nog vragen?', 'Bedenk vooraf wat jij over het werk of bedrijf wilt weten.']
];

function step6IntroScreen() {
  app.innerHTML = `
    <section class="intro"><div class="eyebrow">Stap 6 · Een gesprek voorbereiden</div><h1>Bereid je gesprek rustig voor</h1><p>Je bekijkt welke vragen je kunt krijgen en denkt alvast na over jouw antwoorden.</p></section>
    ${introRouteVisual(6)}
    <section class="card intro-card"><h2>Goed om te weten</h2><ul class="plain-list">
      <li><span>1</span><p>Je hoeft nog geen perfecte antwoorden te geven.</p></li>
      <li><span>2</span><p>Je kunt de AI-assistent gebruiken om je antwoorden voor te bereiden.</p></li>
      <li><span>3</span><p>Het gesprek zelf oefen je tijdens de groepsbijeenkomst.</p></li>
    </ul>${visibilityNote()}</section>
    <button id="step6-start" class="button button-primary">Bekijk de vragen</button><button id="step6-route" class="button button-secondary">Terug naar mijn route</button>`;
  document.querySelector('#step6-start').onclick = () => { state.step6Part = 0; state.screen = 'step6-part'; render(); };
  document.querySelector('#step6-route').onclick = () => { state.screen = 'route'; render(); };
}

function interviewQuestionOverview() {
  return `<div class="interview-list">${interviewQuestions.map(([title, text], index) => `<article><span>${index + 1}</span><div><strong>${title}</strong><p>${text}</p></div></article>`).join('')}</div>`;
}

function step6AnswerCard(label, title, help, key, placeholder) {
  return `<section class="card question-card"><div class="question-count">${label}</div><h2>${title}</h2><p>${help}</p><label class="field-label"><textarea id="step6-answer" placeholder="${placeholder}">${state.step6Answers[key]}</textarea></label>${visibilityNote()}<div class="ai-helper"><strong>Hulp van de AI-assistent</strong><p>Vraag om een voorbeeld, tips of hulp om jouw antwoord duidelijker te maken.</p><button id="step6-ai" class="button button-secondary">Vraag de AI-assistent</button></div></section>`;
}

function step6PartScreen() {
  const part = state.step6Part;
  let body = '';
  if (part === 0) body = `<section class="intro compact-intro"><div class="eyebrow">Stap 6 · 1 van 5</div><h1>Welke vragen kun je krijgen?</h1><p>Deze vragen komen vaak voor in een gesprek over werk.</p></section><section class="card">${interviewQuestionOverview()}</section>`;
  if (part === 1) body = `<section class="intro compact-intro"><div class="eyebrow">Stap 6 · 2 van 5</div><h1>Vertel iets over jezelf</h1><p>Wat zou jij graag over jezelf willen vertellen?</p></section>${step6AnswerCard('JOUW VOORBEREIDING', 'Wie ben jij?', 'Denk bijvoorbeeld aan wat je leuk vindt, waar je goed in bent en wat voor werk je zoekt.', 'about', 'Schrijf hier wat je wilt vertellen...')}`;
  if (part === 2) body = `<section class="intro compact-intro"><div class="eyebrow">Stap 6 · 3 van 5</div><h1>Waarom past dit werk bij jou?</h1><p>Leg de verbinding tussen jezelf en het werk.</p></section>${step6AnswerCard('JOUW VOORBEREIDING', 'Wat past goed?', 'Denk aan de taken, jouw kwaliteiten en waarom je dit werk graag wilt doen.', 'fit', 'Schrijf hier jouw antwoord...')}`;
  if (part === 3) body = `<section class="intro compact-intro"><div class="eyebrow">Stap 6 · 4 van 5</div><h1>Een lastig moment bespreken</h1><p>Een werkgever kan vragen hoe jij met een lastige situatie omging.</p></section>${step6AnswerCard('JOUW VOORBEREIDING', 'Welke situatie kun jij noemen?', 'Vertel kort wat er gebeurde, wat jij deed en wat je ervan hebt geleerd. Dit mag ook een voorbeeld van school, stage of thuis zijn.', 'difficult', 'Beschrijf hier een situatie...')}`;
  if (part === 4) body = `<section class="intro compact-intro"><div class="eyebrow">Stap 6 · 5 van 5</div><h1>Welke vragen wil jij stellen?</h1><p>Een gesprek is ook bedoeld om te ontdekken of het werk en het bedrijf bij jou passen.</p></section>${step6AnswerCard('JOUW VRAGEN', 'Wat wil jij graag weten?', 'Denk aan de taken, het team, de werktijden, begeleiding of hoe een werkdag eruitziet.', 'questions', 'Schrijf hier jouw vragen...')}`;
  app.innerHTML = `${body}<button id="step6-next" class="button button-primary">${part === 4 ? 'Rond de voorbereiding af' : 'Volgende'}</button><button id="step6-back" class="button button-secondary">${part === 0 ? 'Terug naar uitleg' : 'Vorige'}</button>`;
  const answer = document.querySelector('#step6-answer');
  if (answer) {
    const keys = { 1: 'about', 2: 'fit', 3: 'difficult', 4: 'questions' };
    answer.oninput = () => { state.step6Answers[keys[part]] = answer.value; };
  }
  const ai = document.querySelector('#step6-ai'); if (ai) ai.onclick = () => alert('De AI-assistent voor gespreksvoorbereiding wordt later aan dit scherm gekoppeld.');
  document.querySelector('#step6-next').onclick = () => { if (part === 4) state.screen = 'step6-done'; else state.step6Part += 1; render(); };
  document.querySelector('#step6-back').onclick = () => { if (part === 0) state.screen = 'step6-intro'; else state.step6Part -= 1; render(); };
}

function step6DoneScreen() {
  state.currentStep = Math.max(state.currentStep, 7);
  app.innerHTML = `<section class="intro"><div class="eyebrow">Stap 6 · Voorbereiding klaar</div><h1>Je bent voorbereid op het oefenen</h1><p>Tijdens de groepsbijeenkomst ga je samen met de anderen een gesprek oefenen.</p></section><section class="card completion-card"><h2>Neem jouw voorbereiding mee</h2><p>Je kunt jouw antwoorden tijdens het oefenen gebruiken. Ze zijn een hulpmiddel; je hoeft ze niet uit je hoofd te leren.</p><div class="notice"><span aria-hidden="true">i</span><p>Na het oefenen kun je je antwoorden altijd nog aanpassen.</p></div>${visibilityNote()}</section><button id="step6-review" class="button button-secondary">Bekijk mijn antwoorden</button><button id="step6-route" class="button button-orange">Terug naar mijn route</button>`;
  document.querySelector('#step6-review').onclick = () => { state.step6Part = 1; state.screen = 'step6-part'; render(); };
  document.querySelector('#step6-route').onclick = () => { state.screen = 'route'; render(); };
}

function step7IntroScreen() {
  app.innerHTML = `<section class="intro"><div class="eyebrow">Stap 7 · Mogelijkheden en afronding</div><h1>Bekijk waar jij naartoe wilt</h1><p>Je kijkt vooruit en bereidt het afsluitende gesprek met je begeleider voor.</p></section>${introRouteVisual(7)}<section class="card intro-card"><h2>In deze laatste stap</h2><ul class="plain-list"><li><span>1</span><p>Kies welke richtingen je wilt bespreken.</p></li><li><span>2</span><p>Bereid het gesprek met je begeleider voor.</p></li><li><span>3</span><p>Vul opnieuw in waar je nu staat.</p></li><li><span>4</span><p>Na het gesprek komt jouw volgende stap in de app.</p></li></ul></section><button id="step7-start" class="button button-primary">Bekijk mijn mogelijkheden</button><button id="step7-route" class="button button-secondary">Terug naar mijn route</button>`;
  document.querySelector('#step7-start').onclick = () => { state.step7Part = 0; state.screen = 'step7-part'; render(); };
  document.querySelector('#step7-route').onclick = () => { state.screen = 'route'; render(); };
}

function saveEndMeasurement() {
  document.querySelectorAll('.measurement-list fieldset').forEach((fieldset, index) => {
    const checked = fieldset.querySelector('input:checked');
    if (checked) state.step7Answers.measurement[index] = checked.value;
  });
}

function step7PartScreen() {
  const part = state.step7Part;
  let body = '';
  if (part === 0) body = `<section class="intro compact-intro"><div class="eyebrow">Stap 7 · 1 van 3</div><h1>Welke richting wil je bespreken?</h1><p>Je mag meer dan één richting kiezen.</p></section><section class="card question-card">${choiceCards([
    ['Werk', 'Een baan vinden die bij mij past.'],
    ['Opleiding', 'Verder leren via een opleiding, BOL of BBL.'],
    ['Werk én opleiding', 'Werken combineren met leren.'],
    ['Verdere begeleiding', 'Eerst extra ondersteuning bij mijn volgende stap.'],
    ['Iets anders', 'Een andere passende route bespreken.']
  ], state.step7Answers.directions, 'directions')}${visibilityNote()}</section>`;
  if (part === 1) body = `<section class="intro compact-intro"><div class="eyebrow">Stap 7 · 2 van 3</div><h1>Bereid je gesprek voor</h1><p>Hierna bespreek je samen met je begeleider wat een passende volgende stap is.</p></section><section class="card question-card"><div class="question-count">JOUW GESPREK</div><h2>Wat wil jij zeker bespreken?</h2><p>Denk aan wat je graag wilt, waarover je twijfelt en welke hulp je misschien nodig hebt.</p><label class="field-label"><textarea id="step7-preparation" placeholder="Schrijf hier wat je wilt bespreken...">${state.step7Answers.preparation}</textarea></label>${visibilityNote()}</section>`;
  if (part === 2) body = `<section class="intro compact-intro"><div class="eyebrow">Stap 7 · 3 van 3</div><h1>Waar sta je nu?</h1><p>Kies voor ieder onderwerp een cijfer van 1 tot 10. 1 is helemaal niet en 10 is helemaal wel.</p></section><section class="card question-card">${measurementFields(state.step7Answers.measurement)}${visibilityNote(true)}</section>`;
  app.innerHTML = `${body}<button id="step7-next" class="button button-primary">${part === 2 ? 'Opslaan en verder' : 'Volgende'}</button><button id="step7-back" class="button button-secondary">${part === 0 ? 'Terug naar uitleg' : 'Vorige'}</button>`;
  document.querySelectorAll('.choice-card').forEach(button => button.onclick = () => toggleChoice(button.dataset.key, button.dataset.choice));
  const preparation = document.querySelector('#step7-preparation'); if (preparation) preparation.oninput = () => { state.step7Answers.preparation = preparation.value; };
  document.querySelector('#step7-next').onclick = () => { if (part === 2) { saveEndMeasurement(); state.screen = 'step7-waiting'; } else state.step7Part += 1; render(); };
  document.querySelector('#step7-back').onclick = () => { if (part === 0) state.screen = 'step7-intro'; else state.step7Part -= 1; render(); };
}

function step7WaitingScreen() {
  app.innerHTML = `<section class="intro"><div class="eyebrow">Stap 7 · Voorbereiding klaar</div><h1>Je bent klaar voor het eindgesprek</h1><p>Je bespreekt samen met je begeleider welke volgende stap bij jou past.</p></section><section class="card completion-card"><h2>Na het gesprek</h2><p>Je begeleider zet de afspraken en het uitstroomadvies in de app. Daarna verschijnt hier jouw volgende stap en kun je deze rustig teruglezen.</p>${visibilityNote(true)}<div class="notice"><span aria-hidden="true">i</span><p>Het advies wordt door je begeleiders opgesteld. De AI-assistent neemt hierover geen beslissingen.</p></div></section><button id="step7-demo-release" class="button button-secondary">Demo: eindgesprek is afgerond</button><button id="step7-route" class="button button-orange">Terug naar mijn route</button>`;
  document.querySelector('#step7-demo-release').onclick = () => { state.finalResultReleased = true; state.screen = 'step7-result'; render(); };
  document.querySelector('#step7-route').onclick = () => { state.screen = 'route'; render(); };
}

function step7ResultScreen() {
  state.currentStep = 7;
  app.innerHTML = `<section class="intro"><div class="eyebrow">Jouw traject · Afgerond</div><h1>Dit is jouw volgende stap</h1><p>Deze afspraken hebben jij en je begeleider samen gemaakt.</p></section><section class="card final-result"><div class="question-count">JOUW RICHTING</div><h2>Werken en leren combineren</h2><p>Je gaat op zoek naar een BBL-plek in de verkoop of dienstverlening.</p><h3>Jouw eerste stap</h3><p>Je bekijkt samen met je begeleider twee passende opleidingen en neemt contact op met één leerbedrijf.</p><h3>Wie helpt je?</h3><p>Je begeleider helpt bij het kiezen van de opleiding en bij het eerste contact.</p><h3>Afspraak</h3><p>Donderdag 22 mei om 10.00 uur.</p>${visibilityNote(true).replace('deze antwoorden', 'deze uitkomst')}</section><button id="step7-download" class="button button-secondary">Download mijn overzicht</button><button id="step7-home" class="button button-orange">Terug naar Home</button>`;
  document.querySelector('#step7-download').onclick = () => {
    const text = 'JOUW VOLGENDE STAP\n\nRichting: Werken en leren combineren\nEerste stap: Twee opleidingen bekijken en contact opnemen met één leerbedrijf.\nAfspraak: Donderdag 22 mei om 10.00 uur.';
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'mijn-volgende-stap.txt'; link.click(); URL.revokeObjectURL(url);
  };
  document.querySelector('#step7-home').onclick = () => { state.screen = 'home'; render(); };
}

function render() {
  persistState();
  if (state.screen === 'privacy') privacyScreen();
  else if (state.screen === 'faceid') faceIdScreen();
  else if (state.screen === 'ready') readyScreen();
  else if (state.screen === 'login') loginScreen();
  else if (state.screen === 'home') homeScreen();
  else if (state.screen === 'route') routeScreen();
  else if (state.screen === 'messages') messagesScreen();
  else if (state.screen === 'environment') environmentScreen();
  else if (state.screen === 'fit') fitScreen();
  else if (state.screen === 'documents') documentsScreen();
  else if (state.screen === 'appointments') appointmentsScreen();
  else if (state.screen === 'goals') goalsScreen();
  else if (state.screen === 'step1-intro') step1IntroScreen();
  else if (state.screen === 'step1-question') step1QuestionScreen();
  else if (state.screen === 'step1-done') step1DoneScreen();
  else if (state.screen === 'step2-intro') step2IntroScreen();
  else if (state.screen === 'step2-completed') step2CompletedScreen();
  else if (state.screen === 'step2-released') step2ReleasedScreen();
  else if (state.screen === 'step3-intro') step3IntroScreen();
  else if (state.screen === 'step3-part') step3PartScreen();
  else if (state.screen === 'step4-group') step4GroupScreen();
  else if (state.screen === 'step5-intro') step5IntroScreen();
  else if (state.screen === 'step5-part') step5PartScreen();
  else if (state.screen === 'step5-done') step5DoneScreen();
  else if (state.screen === 'step6-intro') step6IntroScreen();
  else if (state.screen === 'step6-part') step6PartScreen();
  else if (state.screen === 'step6-done') step6DoneScreen();
  else if (state.screen === 'step7-intro') step7IntroScreen();
  else if (state.screen === 'step7-part') step7PartScreen();
  else if (state.screen === 'step7-waiting') step7WaitingScreen();
  else if (state.screen === 'step7-result') step7ResultScreen();
  else activateScreen();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

app.addEventListener('input', persistState);
app.addEventListener('change', persistState);
render();

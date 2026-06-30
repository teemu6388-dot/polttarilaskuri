// Sovelluksen globaali data-rakenne
let appData = {
    theme: 'light',
    participants: [],
    activities: [],
    car: { distance: 100, consumption: 6.5, fuelPrice: 1.95, payers: 1 },
    notes: ''
};

// Alustus kun sivu latautuu
window.addEventListener('DOMContentLoaded', () => {
    const savedData = localStorage.getItem('reissubudjetti_data');
    if (savedData) {
        appData = JSON.parse(savedData);
        if(!appData.participants) appData.participants = [];
        if(!appData.activities) appData.activities = [];
    }
    
    // Asetetaan teema
    document.documentElement.setAttribute('data-theme', appData.theme);
    document.getElementById('themeToggle').innerText = appData.theme === 'dark' ? 'Vaalea teema' : 'Tumma teema';
    
    // Täytetään autolaskurin kentät ja muistiinpanot tallennetusta datasta
    document.getElementById('carDistance').value = appData.car.distance || 100;
    document.getElementById('carConsumption').value = appData.car.consumption || 6.5;
    document.getElementById('carFuelPrice').value = appData.car.fuelPrice || 1.95;
    document.getElementById('carPayers').value = appData.car.payers || 1;
    document.getElementById('notesArea').value = appData.notes || '';

    // Kuuntelijat syötteille
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('addParticipantBtn').addEventListener('click', addParticipant);
    document.getElementById('addActivityBtn').addEventListener('click', addActivity);
    document.getElementById('notesArea').addEventListener('input', saveData);
    
    ['carDistance', 'carConsumption', 'carFuelPrice', 'carPayers'].forEach(id => {
        document.getElementById(id).addEventListener('input', calculateCar);
    });

    // Ensimmäinen renderöinti
    renderParticipants();
    renderActivities();
    calculateCar();
});

function saveData() {
    appData.notes = document.getElementById('notesArea').value;
    appData.car.distance = parseFloat(document.getElementById('carDistance').value) || 0;
    appData.car.consumption = parseFloat(document.getElementById('carConsumption').value) || 0;
    appData.car.fuelPrice = parseFloat(document.getElementById('carFuelPrice').value) || 0;
    appData.car.payers = parseInt(document.getElementById('carPayers').value) || 1;
    
    localStorage.setItem('reissubudjetti_data', JSON.stringify(appData));
}

function toggleTheme() {
    appData.theme = appData.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', appData.theme);
    document.getElementById('themeToggle').innerText = appData.theme === 'dark' ? 'Vaalea teema' : 'Tumma teema';
    saveData();
}

// --- OSALLISTUJAT ---
function addParticipant() {
    const nameInput = document.getElementById('newParticipantName');
    const name = nameInput.value.trim();
    if (!name) return;

    appData.participants.push({
        id: Date.now(),
        name: name,
        isExempt: false,
        activityParticipation: {} 
    });

    nameInput.value = '';
    renderParticipants();
    renderActivities();
    saveData();
}

function removeParticipant(id) {
    appData.participants = appData.participants.filter(p => p.id !== id);
    renderParticipants();
    renderActivities();
    saveData();
}

function toggleExempt(pId) {
    const p = appData.participants.find(x => x.id === pId);
    if (p) {
        p.isExempt = !p.isExempt;
        if (p.isExempt) {
            Object.keys(p.activityParticipation).forEach(actId => {
                p.activityParticipation[actId].pays = false;
            });
        }
        renderParticipants();
        renderActivities();
        saveData();
    }
}

function toggleActivityStatus(pId, actId, field) {
    const p = appData.participants.find(x => x.id === pId);
    if (!p) return;
    
    if (!p.activityParticipation[actId]) {
        p.activityParticipation[actId] = { participates: false, pays: false };
    }

    if (field === 'pays' && p.isExempt) return;

    p.activityParticipation[actId][field] = !p.activityParticipation[actId][field];
    
    if (field === 'participates' && p.activityParticipation[actId].participates && !p.isExempt) {
        p.activityParticipation[actId].pays = true;
    }

    renderParticipants();
    renderActivities();
    saveData();
}

function renderParticipants() {
    const list = document.getElementById('participantsList');
    list.innerHTML = '';

    appData.participants.forEach(p => {
        const row = document.createElement('div');
        row.className = 'participant-row';
        
        let activityControls = '';
        appData.activities.forEach(act => {
            const partStatus = p.activityParticipation[act.id] || { participates: false, pays: false };
            activityControls += `
                <div>
                    <strong>${act.name}:</strong>
                    <button class="toggle-btn" style="background-color: ${partStatus.participates ? '#28a745' : ''}" onclick="window.toggleActivityStatus(${p.id}, ${act.id}, 'participates')">Mukana</button>
                    <button class="toggle-btn" style="background-color: ${partStatus.pays ? '#ffc107' : ''}" ${p.isExempt ? 'disabled' : ''} onclick="window.toggleActivityStatus(${p.id}, ${act.id}, 'pays')">Maksaa</button>
                </div>
            `;
        });

        row.innerHTML = `
            <div>
                <strong>${p.name}</strong> 
                <button class="toggle-btn" style="background-color: ${p.isExempt ? '#6c757d' : ''}" onclick="window.toggleExempt(${p.id})">
                    ${p.isExempt ? 'Vapautettu maksuista' : 'Vapauta maksuista'}
                </button>
                <button class="danger" style="padding: 2px 8px; font-size: 0.8em;" onclick="window.removeParticipant(${p.id})">X</button>
            </div>
            <div class="participant-controls">${activityControls}</div>
        `;
        list.appendChild(row);
    });
}

// --- AKTIVITEETIT ---
function addActivity() {
    const nameInput = document.getElementById('activityName');
    const costInput = document.getElementById('activityCost');
    const name = nameInput.value.trim();
    const cost = parseFloat(costInput.value) || 0;

    if (!name) return;

    appData.activities.push({
        id: Date.now(),
        name: name,
        totalCost: cost
    });

    nameInput.value = '';
    costInput.value = '';
    renderActivities();
    renderParticipants();
    saveData();
}

function removeActivity(id) {
    appData.activities = appData.activities.filter(a => a.id !== id);
    appData.participants.forEach(p => {
        delete p.activityParticipation[id];
    });
    renderActivities();
    renderParticipants();
    saveData();
}

function renderActivities() {
    const list = document.getElementById('activitiesList');
    list.innerHTML = '';
    let combinedCost = 0;

    appData.activities.forEach(act => {
        let participantsCount = 0;
        let payersCount = 0;

        appData.participants.forEach(p => {
            const part = p.activityParticipation[act.id];
            if (part) {
                if (part.participates) participantsCount++;
                if (part.pays && !p.isExempt) payersCount++;
            }
        });

        const costPerPayer = payersCount > 0 ? (act.totalCost / payersCount).toFixed(2) : 0;
        combinedCost += act.totalCost;

        const div = document.createElement('div');
        div.className = 'participant-row';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${act.name}</strong> - Kustannus: ${act.totalCost.toFixed(2)} €
                </div>
                <button class="danger" onclick="window.removeActivity(${act.id})">Poista</button>
            </div>
            <div>
                <span class="status-badge">Osallistujia: ${participantsCount}</span>
                <span class="status-badge">Maksajia: ${payersCount}</span>
                <span class="status-badge" style="background-color: var(--accent-color); color:white;">Kustannus / maksaja: ${costPerPayer} €</span>
            </div>
        `;
        list.appendChild(div);
    });

    document.getElementById('totalActivitiesCost').innerText = `Aktiviteetit yhteensä: ${combinedCost.toFixed(2)} €`;
}

// --- AUTOLASKURI ---
function calculateCar() {
    const distance = parseFloat(document.getElementById('carDistance').value) || 0;
    const consumption = parseFloat(document.getElementById('carConsumption').value) || 0;
    const fuelPrice = parseFloat(document.getElementById('carFuelPrice').value) || 0;
    const payers = parseInt(document.getElementById('carPayers').value) || 1;

    const totalCost = (distance * (consumption / 100)) * fuelPrice;
    const costPerPayer = totalCost / (payers > 0 ? payers : 1);

    document.getElementById('carTotalCost').innerText = totalCost.toFixed(2);
    document.getElementById('carCostPerPayer').innerText = costPerPayer.toFixed(2);
    
    saveData();
}

// Tehdään HTML-napeista kutsuttavat funktiot globaaleiksi
window.toggleActivityStatus = toggleActivityStatus;
window.toggleExempt = toggleExempt;
window.removeParticipant = removeParticipant;
window.removeActivity = removeActivity;

// PWA: Rekisteröidään service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log("SW registration failed", err));
}

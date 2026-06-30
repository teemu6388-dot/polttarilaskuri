let appData = {
    theme: 'light',
    participants: [],
    activities: [],
    cars: [],
    notes: ''
};

window.addEventListener('DOMContentLoaded', () => {
    const savedData = localStorage.getItem('reissubudjetti_data');
    if (savedData) {
        appData = JSON.parse(savedData);
        if(!appData.participants) appData.participants = [];
        if(!appData.activities) appData.activities = [];
        if(!appData.cars) appData.cars = [];
    }
    
    document.documentElement.setAttribute('data-theme', appData.theme);
    document.getElementById('themeToggle').innerText = appData.theme === 'dark' ? 'Vaalea teema' : 'Tumma teema';
    document.getElementById('notesArea').value = appData.notes || '';

    // Tapahtumankuuntelijat
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('addParticipantBtn').addEventListener('click', addParticipant);
    document.getElementById('addActivityBtn').addEventListener('click', addActivity);
    document.getElementById('addCarBtn').addEventListener('click', addCar);
    document.getElementById('notesArea').addEventListener('input', saveData);
    
    renderParticipants();
    renderActivities();
    renderCars();
});

function saveData() {
    appData.notes = document.getElementById('notesArea').value;
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
        activityParticipation: {}, // actId -> { participates: bool, pays: bool }
        carParticipation: {}       // carId -> { pays: bool }
    });

    nameInput.value = '';
    updateEverything();
}

function removeParticipant(id) {
    appData.participants = appData.participants.filter(p => p.id !== id);
    updateEverything();
}

function toggleExempt(pId) {
    const p = appData.participants.find(x => x.id === pId);
    if (p) {
        p.isExempt = !p.isExempt;
        if (p.isExempt) {
            Object.keys(p.activityParticipation).forEach(id => p.activityParticipation[id].pays = false);
            Object.keys(p.carParticipation).forEach(id => p.carParticipation[id].pays = false);
        }
        updateEverything();
    }
}

function toggleActivityStatus(pId, actId, field) {
    const p = appData.participants.find(x => x.id === pId);
    if (!p) return;
    if (!p.activityParticipation[actId]) p.activityParticipation[actId] = { participates: false, pays: false };
    if (field === 'pays' && p.isExempt) return;

    p.activityParticipation[actId][field] = !p.activityParticipation[actId][field];
    
    if (field === 'participates' && p.activityParticipation[actId].participates && !p.isExempt) {
        p.activityParticipation[actId].pays = true;
    }
    updateEverything();
}

function toggleCarStatus(pId, carId) {
    const p = appData.participants.find(x => x.id === pId);
    if (!p) return;
    if (!p.carParticipation[carId]) p.carParticipation[carId] = { pays: false };
    if (p.isExempt) return;

    p.carParticipation[carId].pays = !p.carParticipation[carId].pays;
    updateEverything();
}

function renderParticipants() {
    const list = document.getElementById('participantsList');
    list.innerHTML = '';

    appData.participants.forEach(p => {
        const row = document.createElement('div');
        row.className = 'participant-row';
        
        // Aktiviteettinapit osallistujalle
        let activityControls = '<div><strong>Aktiviteetit:</strong> ';
        appData.activities.forEach(act => {
            const status = p.activityParticipation[act.id] || { participates: false, pays: false };
            activityControls += `
                <span style="margin-right:10px;">${act.name}: 
                    <button class="toggle-btn" style="background-color: ${status.participates ? '#28a745' : ''}" onclick="window.toggleActivityStatus(${p.id}, ${act.id}, 'participates')">Mukana</button>
                    <button class="toggle-btn" style="background-color: ${status.pays ? '#ffc107' : ''}" ${p.isExempt ? 'disabled' : ''} onclick="window.toggleActivityStatus(${p.id}, ${act.id}, 'pays')">Maksaa</button>
                </span>`;
        });
        activityControls += '</div>';

        // Autonapit osallistujalle
        let carControls = '<div style="margin-top:5px;"><strong>Autot (Maksaja):</strong> ';
        appData.cars.forEach(car => {
            const status = p.carParticipation[car.id] || { pays: false };
            carControls += `
                <button class="toggle-btn" style="background-color: ${status.pays ? '#3a7bd5' : ''}" ${p.isExempt ? 'disabled' : ''} onclick="window.toggleCarStatus(${p.id}, ${car.id})">
                    ${car.name}
                </button> `;
        });
        carControls += '</div>';

        row.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${p.name}</strong>
                    <button class="toggle-btn" style="background-color: ${p.isExempt ? '#6c757d' : ''}" onclick="window.toggleExempt(${p.id})">
                        ${p.isExempt ? 'Vapautettu' : 'Vapauta maksuista'}
                    </button>
                </div>
                <button class="danger" style="padding: 2px 8px; font-size: 0.8em;" onclick="window.removeParticipant(${p.id})">X</button>
            </div>
            <div class="participant-controls">${activityControls}${carControls}</div>
        `;
        list.appendChild(row);
    });
}

// --- AKTIVITEETIT ---
function addActivity() {
    const nameInput = document.getElementById('activityName');
    const costInput = document.getElementById('activityCost');
    const name = nameInput.value.trim();
    const costPerPerson = parseFloat(costInput.value) || 0;

    if (!name) return;

    appData.activities.push({
        id: Date.now(),
        name: name,
        costPerPerson: costPerPerson
    });

    nameInput.value = '';
    costInput.value = '';
    updateEverything();
}

function removeActivity(id) {
    appData.activities = appData.activities.filter(a => a.id !== id);
    appData.participants.forEach(p => delete p.activityParticipation[id]);
    updateEverything();
}

function renderActivities() {
    const list = document.getElementById('activitiesList');
    list.innerHTML = '';
    let grandTotal = 0;

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

        // Kokonaiskustannus = (Mukana olevien määrä) * (Hinta / pää)
        const totalCost = participantsCount * act.costPerPerson;
        // Kustannus per maksaja = Kokonaiskustannus / Maksajien määrä
        const costPerPayer = payersCount > 0 ? (totalCost / payersCount).toFixed(2) : 0;
        grandTotal += totalCost;

        const div = document.createElement('div');
        div.className = 'participant-row';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${act.name}</strong> — ${act.costPerPerson.toFixed(2)} € / pää (Koko kulu: ${totalCost.toFixed(2)} €)
                </div>
                <button class="danger" onclick="window.removeActivity(${act.id})">Poista</button>
            </div>
            <div>
                <span class="status-badge">Osallistujia: ${participantsCount}</span>
                <span class="status-badge">Maksajia: ${payersCount}</span>
                <span class="status-badge" style="background-color: var(--accent-color); color:white;">Maksajalle: ${costPerPayer} €</span>
            </div>
        `;
        list.appendChild(div);
    });

    document.getElementById('totalActivitiesCost').innerText = `Aktiviteetit yhteensä: ${grandTotal.toFixed(2)} €`;
}

// --- AUTOT ---
function addCar() {
    const nameInput = document.getElementById('carName');
    const distInput = document.getElementById('carDistance');
    const consInput = document.getElementById('carConsumption');
    const priceInput = document.getElementById('carFuelPrice');

    const name = nameInput.value.trim() || `Auto ${appData.cars.length + 1}`;
    const distance = parseFloat(distInput.value) || 0;
    const consumption = parseFloat(consInput.value) || 0;
    const fuelPrice = parseFloat(priceInput.value) || 0;

    appData.cars.push({
        id: Date.now(),
        name: name,
        distance: distance,
        consumption: consumption,
        fuelPrice: fuelPrice
    });

    nameInput.value = '';
    updateEverything();
}

function removeCar(id) {
    appData.cars = appData.cars.filter(c => c.id !== id);
    appData.participants.forEach(p => delete p.carParticipation[id]);
    updateEverything();
}

function renderCars() {
    const list = document.getElementById('carsList');
    list.innerHTML = '';
    let grandCarTotal = 0;

    appData.cars.forEach(car => {
        let payersCount = 0;
        appData.participants.forEach(p => {
            const part = p.carParticipation[car.id];
            if (part && part.pays && !p.isExempt) payersCount++;
        });

        const totalCost = (car.distance * (car.consumption / 100)) * car.fuelPrice;
        const costPerPayer = payersCount > 0 ? (totalCost / payersCount).toFixed(2) : 0;
        grandCarTotal += totalCost;

        const div = document.createElement('div');
        div.className = 'participant-row';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${car.name}</strong> (${car.distance} km, ${car.consumption} l/100km) — Kulu: ${totalCost.toFixed(2)} €
                </div>
                <button class="danger" onclick="window.removeCar(${car.id})">Poista</button>
            </div>
            <div>
                <span class="status-badge">Maksajia autossa: ${payersCount}</span>
                <span class="status-badge" style="background-color: #3a7bd5; color:white;">Maksajalle: ${costPerPayer} €</span>
            </div>
        `;
        list.appendChild(div);
    });

    document.getElementById('totalCarsCost').innerText = `Polttoainekulut yhteensä: ${grandCarTotal.toFixed(2)} €`;
}

function updateEverything() {
    renderParticipants();
    renderActivities();
    renderCars();
    saveData();
}

// Globaalit ikkunafunktiot HTML:ää varten
window.toggleActivityStatus = toggleActivityStatus;
window.toggleCarStatus = toggleCarStatus;
window.toggleExempt = toggleExempt;
window.removeParticipant = removeParticipant;
window.removeActivity = removeActivity;
window.removeCar = removeCar;

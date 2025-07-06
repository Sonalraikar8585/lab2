// ===== Firebase Initialization =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBrqtnu4N5VWBHeHgyJyHTKxi1e9hZ54T4",
  authDomain: "abhyasika-aa210.firebaseapp.com",
  databaseURL: "https://abhyasika-aa210-default-rtdb.firebaseio.com",
  projectId: "abhyasika-aa210",
  storageBucket: "abhyasika-aa210.appspot.com",
  messagingSenderId: "1020147836926",
  appId: "1:1020147836926:web:435a4f416899d52cd7c2af",
  measurementId: "G-6RPJ4NV84E"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ===== Utility Functions =====
function formatDateToDDMMYY(dateStr) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear().toString().slice(-2)}`;
}

function getNextMonthDate(dateStr) {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + 1);
  return date;
}

function isDue(paidDateStr) {
  const paidDate = new Date(paidDateStr);
  const nextDue = new Date(paidDate);
  nextDue.setMonth(nextDue.getMonth() + 1);
  const dueCheck = new Date(nextDue.setDate(nextDue.getDate() - 1));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today >= dueCheck;
}

// ===== Firebase Helpers =====
async function getData(path) {
  const snap = await get(ref(db, path));
  return snap.exists() ? snap.val() : null;
}

async function setData(path, data) {
  return await set(ref(db, path), data);
}

// ===== Fees Logic =====
window.displayFees = async function () {
  const tbody = document.querySelector('#feesTable tbody');
  if (!tbody) return;
  const data = await getData('feesData') || [];
  tbody.innerHTML = '';

  data.forEach((item, index) => {
    const paidDateFormatted = formatDateToDDMMYY(item.paidDate);
    const nextDateFormatted = formatDateToDDMMYY(getNextMonthDate(item.paidDate));
    const due = isDue(item.paidDate);

    const tr = document.createElement('tr');
    if (item.isEditing) {
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td><input id="edit-name-${index}" value="${item.name}" /></td>
        <td><input id="edit-timing-${index}" value="${item.timing}" /></td>
        <td><input type="date" id="edit-date-${index}" value="${item.paidDate}" /></td>
        <td>${nextDateFormatted}</td>
        <td colspan="2">
          <button onclick="saveEdit(${index})">Save</button>
          <button onclick="cancelEdit(${index})">Cancel</button>
        </td>`;
    } else {
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.name}</td>
        <td>${item.timing}</td>
        <td>${paidDateFormatted}</td>
        <td class="${due ? 'red-text' : ''}">${nextDateFormatted}${due ? '<br><span class="alert">Fees to be collected!</span>' : ''}</td>
        <td>${!item.paid ? `<input type="checkbox" onchange="markAsPaid(${index})" />` : '✅ Paid'}</td>
        <td><button onclick="editFee(${index})">Update</button><button onclick="removeFee(${index})">Remove</button></td>`;
    }
    tbody.appendChild(tr);
  });
};

window.removeFee = async function (index) {
  const data = await getData('feesData') || [];
  data.splice(index, 1);
  await setData('feesData', data);
  displayFees();
};

window.editFee = async function (index) {
  const data = await getData('feesData') || [];
  data[index].isEditing = true;
  await setData('feesData', data);
  displayFees();
};

window.cancelEdit = async function (index) {
  const data = await getData('feesData') || [];
  delete data[index].isEditing;
  await setData('feesData', data);
  displayFees();
};

window.saveEdit = async function (index) {
  const name = document.getElementById(`edit-name-${index}`).value;
  const timing = document.getElementById(`edit-timing-${index}`).value;
  const paidDate = document.getElementById(`edit-date-${index}`).value;
  if (!name || !timing || !paidDate) return alert("Please fill all fields.");
  const data = await getData('feesData') || [];
  data[index] = { name, timing, paidDate, paid: false };
  await setData('feesData', data);
  displayFees();
};

window.markAsPaid = async function (index) {
  const data = await getData('feesData') || [];
  const entry = data[index];
  const history = await getData('feesHistory') || {};
  if (!history[entry.name]) history[entry.name] = [];
  history[entry.name].push({ paidDate: new Date().toISOString().split('T')[0], timing: entry.timing });
  data[index].paidDate = getNextMonthDate(entry.paidDate).toISOString().split('T')[0];
  data[index].paid = true;
  await setData('feesData', data);
  await setData('feesHistory', history);
  displayFees();
  displayHistory();
};

window.displayHistory = async function () {
  const container = document.getElementById("historyContainer");
  if (!container) return;
  container.innerHTML = "";
  const history = await getData('feesHistory') || {};
  for (const name in history) {
    const div = document.createElement("div");
    div.className = "history-block";
    div.innerHTML = `<h3>${name}</h3><ul>` +
      history[name].map((r, idx) => `<li>Paid on: ${formatDateToDDMMYY(r.paidDate)} | Timing: ${r.timing} <button onclick="removeHistoryEntry('${name}', ${idx})">Remove</button></li>`).join('') + `</ul>`;
    container.appendChild(div);
  }
};

window.removeHistoryEntry = async function (name, index) {
  const history = await getData('feesHistory') || {};
  if (history[name]) {
    history[name].splice(index, 1);
    if (history[name].length === 0) delete history[name];
    await setData('feesHistory', history);
    displayHistory();
  }
};

document.getElementById('feesForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const timing = document.getElementById('timing').value.trim();
  const paidDate = document.getElementById('paidDate').value;
  if (!name || !timing || !paidDate) return;
  const data = await getData('feesData') || [];
  data.push({ name, timing, paidDate, paid: false });
  await setData('feesData', data);
  e.target.reset();
  displayFees();
});

// ===== Seat Allocation (Morning & Afternoon) =====
// ===== Slot Fetch + Initialize =====
async function fetchSlots() {
  const snap = await get(ref(db, "slots"));
  let data = snap.exists() ? snap.val() : null;

  // Ensure both morning and afternoon arrays exist
  if (!data || !data.morning || !data.afternoon) {
    data = {
      morning: data?.morning ?? Array(80).fill(null),
      afternoon: data?.afternoon ?? Array(80).fill(null),
    };
    await set(ref(db, "slots"), data);
  }

  return data;
}

// ===== Save Slot Safely =====
async function saveSlots(updatedSlots) {
  // Re-fetch current slots to ensure no overwrite
  const currentSlots = await fetchSlots();
  const merged = {
    morning: updatedSlots.morning ?? currentSlots.morning,
    afternoon: updatedSlots.afternoon ?? currentSlots.afternoon
  };
  await set(ref(db, "slots"), merged);
}



window.displaySeats = async function () {
  const slots = await fetchSlots();

  ["morning", "afternoon"].forEach(slot => {
    
    const container = document.getElementById(slot + "Table");

    if (!container) return;

    container.innerHTML = "";

    for (let i = 0; i < 80; i++) {
      const student = slots[slot][i];
      const seat = document.createElement("div");
      seat.className = "seat";

      if (student) {
        seat.classList.add("occupied");
        seat.innerHTML = `
          <strong>${i + 1}</strong><br>${student}<br>
          <button onclick="removeSeat('${slot}', ${i})">Remove</button>`;
      } else {
        seat.innerHTML = `<strong>${i + 1}</strong><br><em>Empty</em>`;
      }

      container.appendChild(seat);
    }
  });
};

window.assignSeat = async function (event, slot) {
  event.preventDefault();

  const seatInput = document.getElementById(`${slot}Seat`);
  const nameInput = document.getElementById(`${slot}Name`);

  if (!seatInput || !nameInput) {
    alert("Form input not found.");
    return;
  }

  const seatNo = parseInt(seatInput.value) - 1;
  const name = nameInput.value.trim();

  if (isNaN(seatNo) || seatNo < 0 || seatNo >= 80 || !name) {
    alert("Invalid input.");
    return;
  }

  const slots = await fetchSlots();

  if (slots[slot][seatNo]) {
    alert("Seat already taken!");
    return;
  }

  slots[slot][seatNo] = name;
  await saveSlots(slots);
  await displaySeats();

  seatInput.value = "";
  nameInput.value = "";
};

window.removeSeat = async function (slot, index) {
  const slots = await fetchSlots();
  slots[slot][index] = null;
  await saveSlots(slots);
  await displaySeats();
};

// ===== Page Load Handler =====
window.addEventListener("DOMContentLoaded", () => {
  displayFees();
  displayHistory();
  displaySeats();
});
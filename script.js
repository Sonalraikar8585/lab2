// ---------- FEES PAGE ----------
// ---------- FEES PAGE ----------
function formatDateToDDMMYY(dateStr) {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}-${mm}-${yy}`;
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueCheck = new Date(nextDue.setDate(nextDue.getDate() - 1));
  return today >= dueCheck;
}

function getFeesData() {
  return JSON.parse(localStorage.getItem('feesData')) || [];
}

function saveFeesData(data) {
  localStorage.setItem('feesData', JSON.stringify(data));
}

function getHistoryData() {
  return JSON.parse(localStorage.getItem('feesHistory')) || {};
}

function saveHistoryData(history) {
  localStorage.setItem('feesHistory', JSON.stringify(history));
}

function displayFees() {
  const feesTable = document.getElementById('feesTable')?.querySelector('tbody');
  if (!feesTable) return;

  feesTable.innerHTML = '';
  const data = getFeesData();

  data.forEach((item, index) => {
    const paidDateFormatted = formatDateToDDMMYY(item.paidDate);
    const nextDate = getNextMonthDate(item.paidDate);
    const nextDateFormatted = formatDateToDDMMYY(nextDate);
    const due = isDue(item.paidDate);

    const tr = document.createElement('tr');

    if (item.isEditing) {
      tr.innerHTML = `
        <td><input type="text" value="${item.name}" id="edit-name-${index}" /></td>
        <td><input type="text" value="${item.timing}" id="edit-timing-${index}" /></td>
        <td><input type="date" value="${item.paidDate}" id="edit-date-${index}" /></td>
        <td>${nextDateFormatted}</td>
        <td colspan="2">
          <button onclick="saveEdit(${index})">Save</button>
          <button onclick="cancelEdit(${index})">Cancel</button>
        </td>
      `;
    } else {
      tr.innerHTML = `
        <td>${item.name}</td>
        <td>${item.timing}</td>
        <td>${paidDateFormatted}</td>
        <td class="${due ? 'red-text' : ''}">
          ${nextDateFormatted}
          ${due ? '<br><span class="alert"> Fees to be collected!</span>' : ''}
        </td>
        <td>
          ${!item.paid ? `<input type="checkbox" onchange="markAsPaid(${index})" />` : ' Paid'}
        </td>
        <td>
          <button onclick="editFee(${index})">Update</button>
          <button onclick="removeFee(${index})">Remove</button>
        </td>
      `;
    }

    feesTable.appendChild(tr);
  });
}

function removeFee(index) {
  const data = getFeesData();
  data.splice(index, 1);
  saveFeesData(data);
  displayFees();
}

function editFee(index) {
  const data = getFeesData();
  data[index].isEditing = true;
  saveFeesData(data);
  displayFees();
}

function cancelEdit(index) {
  const data = getFeesData();
  delete data[index].isEditing;
  saveFeesData(data);
  displayFees();
}

function saveEdit(index) {
  const name = document.getElementById(`edit-name-${index}`).value;
  const timing = document.getElementById(`edit-timing-${index}`).value;
  const paidDate = document.getElementById(`edit-date-${index}`).value;

  if (!name || !timing || !paidDate) {
    alert("Please fill all fields.");
    return;
  }

  const data = getFeesData();
  data[index] = { name, timing, paidDate, paid: false };
  saveFeesData(data);
  displayFees();
}

function markAsPaid(index) {
  const data = getFeesData();
  const entry = data[index];

  // Save current record to history
  const history = getHistoryData();
  if (!history[entry.name]) history[entry.name] = [];
  history[entry.name].push({
    paidDate: entry.paidDate,
    timing: entry.timing
  });

  // Update paidDate to next month
  const nextDate = getNextMonthDate(entry.paidDate);
  data[index].paidDate = nextDate.toISOString().split('T')[0];
  data[index].paid = true;

  saveFeesData(data);
  saveHistoryData(history);

  displayFees();
  displayHistory();
}

function displayHistory() {
  const container = document.getElementById("historyContainer");
  if (!container) return;

  container.innerHTML = "";

  const history = getHistoryData();
  Object.keys(history).forEach(name => {
    const div = document.createElement("div");
    div.className = "history-block";
    div.innerHTML = `<h3>${name}</h3><ul>` +
      history[name].map(
        (r) => `<li>Paid on: ${formatDateToDDMMYY(r.paidDate)} | Timing: ${r.timing}</li>`
      ).join('') +
      `</ul>`;
    container.appendChild(div);
  });
}

document.getElementById('feesForm')?.addEventListener('submit', function (e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const timing = document.getElementById('timing').value.trim();
  const paidDate = document.getElementById('paidDate').value;

  if (!name || !timing || !paidDate) return;

  const data = getFeesData();
  data.push({ name, timing, paidDate, paid: false });
  saveFeesData(data);
  this.reset();
  displayFees();
});

displayFees();
displayHistory();

// ---------- SLOTS PAGE ----------
function initializeSlotsIfNeeded() {
  let slots = JSON.parse(localStorage.getItem('slots'));
  if (!slots) {
    slots = {
      morning: Array(80).fill(null),
      afternoon: Array(80).fill(null)
    };
    localStorage.setItem('slots', JSON.stringify(slots));
  }
}

function getSlots() {
  initializeSlotsIfNeeded();
  return JSON.parse(localStorage.getItem('slots'));
}

function saveSlots(data) {
  localStorage.setItem('slots', JSON.stringify(data));
}

function displaySeats() {
  const slots = getSlots();
  ['morning', 'afternoon'].forEach(slot => {
    const container = document.getElementById(slot + 'Table');
    container.innerHTML = '';
    for (let i = 0; i < 80; i++) {
      const student = slots[slot][i];
      const seat = document.createElement('div');
      seat.className = 'seat';
      if (student) {
        seat.classList.add('occupied');
        seat.innerHTML = `
          <strong>${i + 1}</strong><br>${student}<br>
          <button onclick="removeSeat('${slot}', ${i})">Remove</button>
        `;
      } else {
        seat.innerHTML = `<strong>${i + 1}</strong><br><em>Empty</em>`;
      }
      container.appendChild(seat);
    }
  });
}

function assignSeat(event, slot) {
  event.preventDefault();
  const seatNo = parseInt(document.getElementById(slot + 'Seat').value, 10) - 1;
  const name = document.getElementById(slot + 'Name').value.trim();

  if (seatNo < 0 || seatNo >= 80 || !name) {
    alert('Invalid input');
    return;
  }

  const slots = getSlots();
  if (slots[slot][seatNo]) {
    alert('Seat already taken!');
    return;
  }

  slots[slot][seatNo] = name;
  saveSlots(slots);
  displaySeats();
  document.getElementById(slot + 'Seat').value = '';
  document.getElementById(slot + 'Name').value = '';
}

function removeSeat(slot, index) {
  const slots = getSlots();
  slots[slot][index] = null;
  saveSlots(slots);
  displaySeats();
}

initializeSlotsIfNeeded();
displaySeats();

const LS_KEY = "tasks";
const taskList = document.getElementById("taskList");
const taskTpl = document.getElementById("taskItemTpl");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const addTaskBtn = document.getElementById("addTaskBtn");
const cancelBtn = document.getElementById("cancelBtn");
const taskForm = document.getElementById("taskForm");
const createPanel = document.getElementById("createPanel");

let tasks = JSON.parse(localStorage.getItem(LS_KEY) || "[]");

// ✅ Ask for notification permission when page loads
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(tasks));
  render();
}

function addTask(data) {
  tasks.push({
    id: Date.now(),
    title: data.title,
    notes: data.notes,
    priority: data.priority,
    due: data.due,
    done: false,
    reminded: false // 👈 new flag
  });
  save();
}

function updateTask(id, data) {
  let t = tasks.find(x => x.id === id);
  if (t) Object.assign(t, data);
  save();
}

function deleteTask(id) {
  tasks = tasks.filter(x => x.id !== id);
  save();
}

function render() {
  taskList.innerHTML = "";
  let done = tasks.filter(t => t.done).length;
  tasks.forEach(task => {
    const node = taskTpl.content.cloneNode(true);
    const li = node.querySelector(".task-item");
    li.querySelector(".titleText").textContent = task.title;
    li.querySelector(".badge").textContent = task.priority;
    li.querySelector(".subText").textContent =
      (task.due ? "Due: " + task.due : "") +
      (task.notes ? " | " + task.notes : "");
    const chk = li.querySelector(".completeCheckbox");
    chk.checked = task.done;
    chk.onchange = () => updateTask(task.id, { done: chk.checked });
    li.querySelector(".editBtn").onclick = () => openEdit(task);
    li.querySelector(".deleteBtn").onclick = () => deleteTask(task.id);
    taskList.appendChild(node);
  });
  progressText.textContent = `${done} / ${tasks.length} done`;
  progressFill.style.width = tasks.length
    ? (done / tasks.length) * 100 + "%"
    : "0%";
}

// ✅ Reminder check (runs every minute)
function checkReminders() {
  const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
  tasks.forEach(task => {
    if (
      task.due &&
      !task.done &&
      !task.reminded &&
      task.due <= today
    ) {
      notifyUser(task.title, task.due);
      task.reminded = true; // only remind once
      save();
    }
  });
}

function notifyUser(title, due) {
  const message = `Task "${title}" is due (Date: ${due})!`;
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Task Reminder", { body: message });
  } else {
    alert(message);
  }
}

function openEdit(task) {
  document.getElementById("taskId").value = task.id;
  document.getElementById("title").value = task.title;
  document.getElementById("notes").value = task.notes || "";
  document.getElementById("priority").value = task.priority;
  document.getElementById("due").value = task.due || "";
  createPanel.classList.remove("hidden");
}

addTaskBtn.onclick = () => {
  taskForm.reset();
  document.getElementById("taskId").value = "";
  createPanel.classList.remove("hidden");
};

cancelBtn.onclick = () => {
  createPanel.classList.add("hidden");
  taskForm.reset();
};

taskForm.onsubmit = e => {
  e.preventDefault();
  const id = document.getElementById("taskId").value;
  const data = {
    title: document.getElementById("title").value.trim(),
    notes: document.getElementById("notes").value.trim(),
    priority: document.getElementById("priority").value,
    due: document.getElementById("due").value
  };
  if (!data.title) return alert("Title required");
  if (id) updateTask(Number(id), data);
  else addTask(data);
  createPanel.classList.add("hidden");
  taskForm.reset();
};

render();
setInterval(checkReminders, 60000); // check every minute
checkReminders(); // run once immediately

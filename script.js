const durations = {
  focus: 25 * 60,
  break: 5 * 60,
};

const timerDisplay = document.querySelector("#timer-display");
const timerRing = document.querySelector("#timer-ring");
const timerCaption = document.querySelector("#timer-caption");
const timerStatus = document.querySelector("#timer-status");
const sessionTag = document.querySelector("#session-tag");
const startButton = document.querySelector("#start-button");
const startIcon = document.querySelector("#start-icon");
const startLabel = document.querySelector("#start-label");
const resetButton = document.querySelector("#reset-button");
const modeButtons = document.querySelectorAll(".mode-button");

let mode = "focus";
let secondsRemaining = durations[mode];
let endTime = 0;
let timerInterval = null;
let isRunning = false;
let statusMessage = "Ready when you are.";

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function renderTimer() {
  const totalSeconds = durations[mode];
  const progress = ((totalSeconds - secondsRemaining) / totalSeconds) * 100;
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  timerDisplay.textContent = formatTime(secondsRemaining);
  timerRing.style.setProperty("--progress", `${progress}%`);
  timerRing.setAttribute(
    "aria-label",
    `${minutes} minutes and ${seconds} seconds remaining`,
  );
  timerCaption.textContent = mode === "focus" ? "TIME TO FOCUS" : "TAKE A BREATHER";
  sessionTag.textContent = mode === "focus" ? "01 / FOCUS" : "02 / BREAK";
  timerStatus.textContent = statusMessage;
  startIcon.textContent = isRunning ? "Ⅱ" : "▶";
  startLabel.textContent = isRunning
    ? "Pause session"
    : secondsRemaining === 0
      ? "Start again"
      : mode === "focus"
        ? "Start focus"
        : "Start break";
}

function stopTimer() {
  window.clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
}

function tick() {
  secondsRemaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));

  if (secondsRemaining === 0) {
    stopTimer();
    statusMessage = mode === "focus"
      ? "Focus session complete. Well done!"
      : "Break complete. Ready to focus again?";
  }

  renderTimer();
}

function startTimer() {
  if (secondsRemaining === 0) {
    secondsRemaining = durations[mode];
  }

  endTime = Date.now() + secondsRemaining * 1000;
  isRunning = true;
  statusMessage = mode === "focus" ? "You’re in a focus session." : "Take a moment to recharge.";
  timerInterval = window.setInterval(tick, 250);
  renderTimer();
}

startButton.addEventListener("click", () => {
  if (isRunning) {
    secondsRemaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    stopTimer();
    statusMessage = "Paused. Pick up whenever you’re ready.";
    renderTimer();
    return;
  }

  startTimer();
});

resetButton.addEventListener("click", () => {
  stopTimer();
  secondsRemaining = durations[mode];
  statusMessage = "Session reset. Ready when you are.";
  renderTimer();
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    stopTimer();
    mode = button.dataset.mode;
    secondsRemaining = durations[mode];
    statusMessage = mode === "focus" ? "Ready when you are." : "A short pause can help.";

    modeButtons.forEach((modeButton) => {
      const isActive = modeButton === button;
      modeButton.classList.toggle("is-active", isActive);
      modeButton.setAttribute("aria-pressed", String(isActive));
    });

    document.body.classList.toggle("break-mode", mode === "break");
    renderTimer();
  });
});

const storageKey = "study-timer-tasks";
const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const taskCount = document.querySelector("#task-count");
const taskSummary = document.querySelector("#task-summary");
const taskProgress = document.querySelector("#task-progress");
const taskFeedback = document.querySelector("#task-feedback");
const emptyState = document.querySelector("#empty-state");

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(storageKey);

    if (!savedTasks) {
      return [];
    }

    const parsedTasks = JSON.parse(savedTasks);
    if (
      !Array.isArray(parsedTasks) ||
      parsedTasks.some((task) =>
        !task ||
        typeof task.id !== "string" ||
        typeof task.text !== "string" ||
        typeof task.done !== "boolean"
      )
    ) {
      throw new TypeError("Saved tasks have an unexpected format.");
    }

    return parsedTasks;
  } catch (error) {
    console.error("Could not load saved study tasks.", error);
    taskFeedback.textContent = "Saved tasks couldn’t be loaded in this browser.";
    return [];
  }
}

let tasks = loadTasks();

function saveTasks() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error("Could not save study tasks.", error);
    taskFeedback.textContent = "Your browser couldn’t save this change.";
    return false;
  }
}

function renderTasks() {
  taskList.replaceChildren();

  tasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = "task-item";
    item.classList.toggle("is-complete", task.done);

    const checkbox = document.createElement("input");
    checkbox.className = "task-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute(
      "aria-label",
      `${task.done ? "Mark incomplete" : "Mark complete"}: ${task.text}`,
    );
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      item.classList.toggle("is-complete", task.done);
      checkbox.setAttribute(
        "aria-label",
        `${task.done ? "Mark incomplete" : "Mark complete"}: ${task.text}`,
      );
      if (saveTasks()) {
        taskFeedback.textContent = task.done ? "Task completed." : "Task marked as in progress.";
      }
      renderTaskSummary();
    });

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-task";
    deleteButton.type = "button";
    deleteButton.textContent = "Remove";
    deleteButton.setAttribute("aria-label", `Remove task: ${task.text}`);
    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter((savedTask) => savedTask.id !== task.id);
      if (saveTasks()) {
        taskFeedback.textContent = "Task removed.";
      }
      renderTasks();
    });

    item.append(checkbox, text, deleteButton);
    taskList.append(item);
  });

  renderTaskSummary();
}

function renderTaskSummary() {
  const completedTasks = tasks.filter((task) => task.done).length;
  const totalTasks = tasks.length;
  const progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

  taskCount.textContent = `${completedTasks} / ${totalTasks}`;
  taskProgress.style.width = `${progress}%`;
  emptyState.hidden = totalTasks > 0;
  taskSummary.textContent = totalTasks === 0
    ? "Start with one small win."
    : completedTasks === totalTasks
      ? "Everything checked off. Nicely done!"
      : `${totalTasks - completedTasks} ${totalTasks - completedTasks === 1 ? "task" : "tasks"} left—keep your focus on what matters.`;
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();

  if (!text) {
    taskInput.focus();
    return;
  }

  tasks.push({
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
    text,
    done: false,
  });

  if (saveTasks()) {
    taskFeedback.textContent = "Task added to your list.";
  }
  taskInput.value = "";
  taskInput.focus();
  renderTasks();
});

renderTimer();
renderTasks();
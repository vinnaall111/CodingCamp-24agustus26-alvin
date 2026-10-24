/* ============================================================
   My Dashboard — Vanilla JS Personal Dashboard
   Features: Greeting, Focus Timer, To-Do List, Quick Links
   Challenges: Custom name in greeting, Prevent duplicate tasks,
               Sort tasks
   Storage: Browser Local Storage
   ============================================================ */

(function () {
    "use strict";

    /* ===== Storage Helpers ===== */
    const Storage = {
        get(key, fallback) {
            try {
                const raw = localStorage.getItem(key);
                return raw ? JSON.parse(raw) : fallback;
            } catch (e) {
                console.warn("Storage read error:", e);
                return fallback;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.warn("Storage write error:", e);
            }
        },
    };

    /* ===== Constants ===== */
    const STORAGE_KEYS = {
        name: "dashboard_user_name",
        todos: "dashboard_todos",
        links: "dashboard_quick_links",
    };

    const TIMER_MINUTES = 25; // Fixed Pomodoro duration
    const TIMER_TOTAL_SECONDS = TIMER_MINUTES * 60;

    /* ===== State ===== */
    let todos = Storage.get(STORAGE_KEYS.todos, []);
    let links = Storage.get(STORAGE_KEYS.links, []);
    let userName = Storage.get(STORAGE_KEYS.name, "");

    let timerInterval = null;
    let timerSecondsLeft = TIMER_TOTAL_SECONDS;
    let timerIsRunning = false;

    /* ===== DOM References ===== */
    // Greeting
    const greetingText = document.getElementById("greeting-text");
    const currentTimeEl = document.getElementById("current-time");
    const currentDateEl = document.getElementById("current-date");
    const nameInput = document.getElementById("name-input");
    const saveNameBtn = document.getElementById("save-name-btn");
    const nameHint = document.getElementById("name-hint");

    // Timer
    const timerDisplay = document.getElementById("timer-display");
    const timerStartBtn = document.getElementById("timer-start");
    const timerStopBtn = document.getElementById("timer-stop");
    const timerResetBtn = document.getElementById("timer-reset");
    const timerStatus = document.getElementById("timer-status");

    // To-Do
    const todoInput = document.getElementById("todo-input");
    const todoAddBtn = document.getElementById("todo-add-btn");
    const todoListEl = document.getElementById("todo-list");
    const todoEmpty = document.getElementById("todo-empty");
    const todoFeedback = document.getElementById("todo-feedback");
    const todoSortSelect = document.getElementById("todo-sort");

    // Quick Links
    const linkNameInput = document.getElementById("link-name");
    const linkUrlInput = document.getElementById("link-url");
    const linkAddBtn = document.getElementById("link-add-btn");
    const quickLinksEl = document.getElementById("quick-links");
    const linksEmpty = document.getElementById("links-empty");
    const linkFeedback = document.getElementById("link-feedback");

    /* ============================================================
       GREETING
       ============================================================ */
    function updateGreeting() {
        const now = new Date();
        const hours = now.getHours();

        let greeting;
        if (hours < 12) {
            greeting = "Good morning";
        } else if (hours < 18) {
            greeting = "Good afternoon";
        } else {
            greeting = "Good evening";
        }

        const name = userName ? `, ${userName}` : "";
        greetingText.textContent = `${greeting}${name}!`;

        // Time — HH:MM:SS
        const h = String(now.getHours()).padStart(2, "0");
        const m = String(now.getMinutes()).padStart(2, "0");
        const s = String(now.getSeconds()).padStart(2, "0");
        currentTimeEl.textContent = `${h}:${m}:${s}`;

        // Date — full format
        const dateOptions = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        };
        currentDateEl.textContent = now.toLocaleDateString(undefined, dateOptions);
    }

    function saveName() {
        const value = nameInput.value.trim();
        if (value.length === 0) {
            nameHint.textContent = "Please enter a name.";
            nameHint.style.color = "rgba(255,255,255,0.7)";
            return;
        }
        userName = value;
        Storage.set(STORAGE_KEYS.name, userName);
        nameHint.textContent = `Name saved!`;
        nameHint.style.color = "rgba(255,255,255,0.9)";
        updateGreeting();
        setTimeout(() => {
            nameHint.textContent = "";
        }, 2500);
    }

    /* ============================================================
       FOCUS TIMER (Pomodoro)
       ============================================================ */
    function formatTime(totalSeconds) {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    function renderTimer() {
        timerDisplay.textContent = formatTime(timerSecondsLeft);
        timerDisplay.classList.remove("running", "paused");
        if (timerIsRunning) {
            timerDisplay.classList.add("running");
        } else if (timerSecondsLeft < TIMER_TOTAL_SECONDS) {
            timerDisplay.classList.add("paused");
        }
    }

    function timerTick() {
        timerSecondsLeft--;
        renderTimer();
        if (timerSecondsLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            timerIsRunning = false;
            timerDisplay.classList.remove("running", "paused");
            timerStartBtn.disabled = false;
            timerStopBtn.disabled = true;
            timerStatus.textContent = "Time's up! Great focus session. \u23F0";
            // Subtle audio alert
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 880;
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
                osc.start();
                osc.stop(ctx.currentTime + 0.6);
            } catch (e) {
                /* AudioContext may not be available */
            }
        }
    }

    function timerStart() {
        if (timerIsRunning || timerSecondsLeft <= 0) return;
        timerIsRunning = true;
        timerInterval = setInterval(timerTick, 1000);
        timerStartBtn.disabled = true;
        timerStopBtn.disabled = false;
        timerStatus.textContent = "Focusing... stay on task!";
        renderTimer();
    }

    function timerStop() {
        if (!timerIsRunning) return;
        clearInterval(timerInterval);
        timerInterval = null;
        timerIsRunning = false;
        timerStartBtn.disabled = false;
        timerStopBtn.disabled = true;
        timerStatus.textContent = "Paused. Press Start to continue.";
        renderTimer();
    }

    function timerReset() {
        clearInterval(timerInterval);
        timerInterval = null;
        timerIsRunning = false;
        timerSecondsLeft = TIMER_TOTAL_SECONDS;
        timerStartBtn.disabled = false;
        timerStopBtn.disabled = true;
        timerStatus.textContent = "Ready to focus";
        renderTimer();
    }

    /* ============================================================
       TO-DO LIST
       ============================================================ */

    // Challenge: Prevent duplicate tasks (case-insensitive)
    function isDuplicateTask(text) {
        const normalized = text.trim().toLowerCase();
        return todos.some(
            (t) => t.text.trim().toLowerCase() === normalized
        );
    }

    function addTodo() {
        const text = todoInput.value.trim();
        if (text.length === 0) {
            showFeedback(todoFeedback, "Please enter a task.", "error");
            return;
        }
        if (isDuplicateTask(text)) {
            showFeedback(todoFeedback, "That task already exists!", "error");
            todoInput.focus();
            return;
        }

        const todo = {
            id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
            text: text,
            done: false,
            createdAt: Date.now(),
        };
        todos.push(todo);
        Storage.set(STORAGE_KEYS.todos, todos);
        todoInput.value = "";
        showFeedback(todoFeedback, "Task added!", "success");
        renderTodos();
    }

    function toggleTodo(id) {
        const todo = todos.find((t) => t.id === id);
        if (todo) {
            todo.done = !todo.done;
            Storage.set(STORAGE_KEYS.todos, todos);
            renderTodos();
        }
    }

    function deleteTodo(id) {
        todos = todos.filter((t) => t.id !== id);
        Storage.set(STORAGE_KEYS.todos, todos);
        renderTodos();
    }

    function editTodo(id, spanEl) {
        const todo = todos.find((t) => t.id === id);
        if (!todo) return;

        const input = document.createElement("input");
        input.type = "text";
        input.className = "edit-input";
        input.value = todo.text;
        input.maxLength = 100;

        const actionsEl = spanEl.parentElement.querySelector(".todo-item-actions");
        actionsEl.style.display = "none";
        spanEl.replaceWith(input);
        input.focus();
        input.select();

        const saveEdit = () => {
            const newText = input.value.trim();
            if (newText.length === 0) {
                // Don't allow empty — revert
                input.replaceWith(spanEl);
                actionsEl.style.display = "";
                return;
            }
            // Check for duplicates (excluding the one being edited)
            const normalized = newText.toLowerCase();
            const dupe = todos.some(
                (t) => t.id !== id && t.text.trim().toLowerCase() === normalized
            );
            if (dupe) {
                showFeedback(todoFeedback, "Another task already has that text!", "error");
                input.replaceWith(spanEl);
                actionsEl.style.display = "";
                return;
            }
            todo.text = newText;
            Storage.set(STORAGE_KEYS.todos, todos);
            renderTodos();
            showFeedback(todoFeedback, "Task updated!", "success");
        };

        input.addEventListener("blur", saveEdit);
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                input.blur();
            }
            if (e.key === "Escape") {
                input.replaceWith(spanEl);
                actionsEl.style.display = "";
            }
        });
    }

    // Challenge: Sort tasks
    function getSortedTodos() {
        const sortBy = todoSortSelect.value;
        const copy = [...todos];

        switch (sortBy) {
            case "alpha":
                copy.sort((a, b) => a.text.localeCompare(b.text, undefined, { sensitivity: "base" }));
                break;
            case "status":
                // Incomplete first, then done
                copy.sort((a, b) => {
                    if (a.done !== b.done) return a.done ? 1 : -1;
                    return a.createdAt - b.createdAt;
                });
                break;
            case "created":
            default:
                copy.sort((a, b) => a.createdAt - b.createdAt);
                break;
        }
        return copy;
    }

    function renderTodos() {
        const sorted = getSortedTodos();
        todoListEl.innerHTML = "";

        if (sorted.length === 0) {
            todoEmpty.style.display = "block";
            return;
        }
        todoEmpty.style.display = "none";

        sorted.forEach((todo) => {
            const li = document.createElement("li");
            li.className = "todo-item" + (todo.done ? " done" : "");

            // Checkbox
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "todo-checkbox";
            checkbox.checked = todo.done;
            checkbox.addEventListener("change", () => toggleTodo(todo.id));

            // Text span
            const span = document.createElement("span");
            span.className = "todo-item-text";
            span.textContent = todo.text;

            // Actions container
            const actions = document.createElement("div");
            actions.className = "todo-item-actions";

            // Edit button
            const editBtn = document.createElement("button");
            editBtn.className = "icon-btn";
            editBtn.innerHTML = "&#9998;"; // pencil
            editBtn.title = "Edit";
            editBtn.addEventListener("click", () => editTodo(todo.id, span));

            // Delete button
            const delBtn = document.createElement("button");
            delBtn.className = "icon-btn delete-btn";
            delBtn.innerHTML = "&#128465;"; // wastebasket
            delBtn.title = "Delete";
            delBtn.addEventListener("click", () => deleteTodo(todo.id));

            actions.appendChild(editBtn);
            actions.appendChild(delBtn);

            li.appendChild(checkbox);
            li.appendChild(span);
            li.appendChild(actions);
            todoListEl.appendChild(li);
        });
    }

    /* ============================================================
       QUICK LINKS
       ============================================================ */
    function normalizeUrl(url) {
        url = url.trim();
        if (!url) return "";
        // Add https:// if no protocol
        if (!/^https?:\/\//i.test(url)) {
            url = "https://" + url;
        }
        return url;
    }

    function addLink() {
        const name = linkNameInput.value.trim();
        const rawUrl = linkUrlInput.value.trim();

        if (name.length === 0 || rawUrl.length === 0) {
            showFeedback(linkFeedback, "Please enter both a name and a URL.", "error");
            return;
        }

        const url = normalizeUrl(rawUrl);
        const link = {
            id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
            name: name,
            url: url,
        };
        links.push(link);
        Storage.set(STORAGE_KEYS.links, links);
        linkNameInput.value = "";
        linkUrlInput.value = "";
        showFeedback(linkFeedback, "Link added!", "success");
        renderLinks();
    }

    function deleteLink(id) {
        links = links.filter((l) => l.id !== id);
        Storage.set(STORAGE_KEYS.links, links);
        renderLinks();
    }

    function renderLinks() {
        quickLinksEl.innerHTML = "";

        if (links.length === 0) {
            linksEmpty.style.display = "block";
            return;
        }
        linksEmpty.style.display = "none";

        links.forEach((link) => {
            const anchor = document.createElement("a");
            anchor.className = "link-button";
            anchor.href = link.url;
            anchor.target = "_blank";
            anchor.rel = "noopener noreferrer";
            anchor.textContent = link.name;

            const delBtn = document.createElement("button");
            delBtn.className = "link-delete";
            delBtn.innerHTML = "&times;";
            delBtn.title = "Remove link";
            delBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteLink(link.id);
            });

            anchor.appendChild(delBtn);
            quickLinksEl.appendChild(anchor);
        });
    }

    /* ============================================================
       UI Helpers
       ============================================================ */
    function showFeedback(el, message, type) {
        el.textContent = message;
        el.classList.remove("success", "error");
        if (type) el.classList.add(type);
        clearTimeout(el._timeout);
        el._timeout = setTimeout(() => {
            el.textContent = "";
            el.classList.remove("success", "error");
        }, 2500);
    }

    /* ============================================================
       Event Wiring & Init
       ============================================================ */
    function init() {
        // --- Greeting ---
        updateGreeting();
        setInterval(updateGreeting, 1000);

        if (userName) {
            nameInput.value = userName;
        }
        saveNameBtn.addEventListener("click", saveName);
        nameInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") saveName();
        });

        // --- Timer ---
        renderTimer();
        timerStartBtn.addEventListener("click", timerStart);
        timerStopBtn.addEventListener("click", timerStop);
        timerResetBtn.addEventListener("click", timerReset);

        // --- To-Do ---
        renderTodos();
        todoAddBtn.addEventListener("click", addTodo);
        todoInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") addTodo();
        });
        todoSortSelect.addEventListener("change", renderTodos);

        // --- Quick Links ---
        renderLinks();
        linkAddBtn.addEventListener("click", addLink);
        linkNameInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") linkUrlInput.focus();
        });
        linkUrlInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") addLink();
        });
    }

    // Run when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();

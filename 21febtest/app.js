import { fetchTasks, createTask, updateTask, deleteTask } from "./api.js";

/* ================= STATE ================= */
let state = {
    tasks: [],
    filters: { search: "", status: "all", priority: "all", tag: "all", sort: "newest" },
    loading: false
};

/* ================= UTILITIES ================= */

// ID generator (closure)
const generateId = (() => {
    let id = Date.now();
    return () => `gupio_${id++}`;
})();

// Debounce (closure)
const debounce = (fn, delay = 300) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
};

// Error handling helper
function handleUIError(err) {
    const el = document.getElementById("globalError");
    el.innerText = `⚠️ ${err.message}`;
    el.style.display = "block";
    setTimeout(() => el.style.display = "none", 4000);
}

/* ================= ANALYTICS ================= */
function updateAnalytics() {
    const { tasks } = state;
    const now = new Date();

    const stats = {
        total: tasks.length,
        todo: tasks.filter(t => t.status === "todo").length,
        progress: tasks.filter(t => t.status === "in-progress").length,
        done: tasks.filter(t => t.status === "done").length,
        overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now.setHours(0, 0, 0, 0) && t.status !== "done").length,
    };

    // Calculate most used tag
    const tagFreq = {};
    tasks.forEach(t => t.tags.forEach(tag => tagFreq[tag] = (tagFreq[tag] || 0) + 1));
    const topTag = Object.entries(tagFreq).sort((a, b) => b[1] - a[1])[0];

    // DOM Updates
    document.getElementById("totalCount").textContent = stats.total;
    document.getElementById("todoCount").textContent = stats.todo;
    document.getElementById("progressCount").textContent = stats.progress;
    document.getElementById("doneCount").textContent = stats.done;
    document.getElementById("overdueCount").textContent = stats.overdue;
    document.getElementById("topTag").textContent = topTag ? `#${topTag[0]}` : "-";

    // Dynamic Tag Filter Update
    updateTagFilterSelector(Object.keys(tagFreq));
}

function updateTagFilterSelector(tags) {
    const select = document.getElementById("filterTag");
    const currentValue = state.filters.tag;
    select.innerHTML = '<option value="all">All Tags</option>';
    tags.sort().forEach(tag => {
        const opt = document.createElement("option");
        opt.value = tag;
        opt.textContent = tag;
        if (tag === currentValue) opt.selected = true;
        select.appendChild(opt);
    });
}

/* ================= FILTERING & SORTING ================= */
function getProcessedTasks() {
    let filtered = [...state.tasks];
    const f = state.filters;

    // Search
    if (f.search) {
        const s = f.search.toLowerCase();
        filtered = filtered.filter(t =>
            t.title.toLowerCase().includes(s) ||
            t.description.toLowerCase().includes(s)
        );
    }

    // Filters
    if (f.status !== "all") filtered = filtered.filter(t => t.status === f.status);
    if (f.priority !== "all") filtered = filtered.filter(t => t.priority === f.priority);
    if (f.tag !== "all") filtered = filtered.filter(t => t.tags.includes(f.tag));

    // Sort
    const priorityMap = { High: 3, Medium: 2, Low: 1 };
    if (f.sort === "newest") filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (f.sort === "dueDate") filtered.sort((a, b) => (a.dueDate || "9999-12-31") > (b.dueDate || "9999-12-31") ? 1 : -1);
    if (f.sort === "priority") filtered.sort((a, b) => priorityMap[b.priority] - priorityMap[a.priority]);

    return filtered;
}

/* ================= RENDER ================= */
function render() {
    const list = document.getElementById("taskList");
    const tasks = getProcessedTasks();

    if (state.loading) {
        list.innerHTML = '<div class="loading-state">Synchronizing with Gupio Core...</div>';
        return;
    }

    if (tasks.length === 0) {
        list.innerHTML = '<div class="loading-state">No matching tasks found.</div>';
        return;
    }

    list.innerHTML = "";
    tasks.forEach(t => {
        const card = document.createElement("div");
        card.className = `task-card ${t.priority.toLowerCase()}`;
        card.dataset.id = t.id;

        card.innerHTML = `
            <div class="task-header">
                <h3>${t.title}</h3>
                <span class="badge">${t.priority}</span>
            </div>
            <p class="description">${t.description || "<i>No description provided.</i>"}</p>
            <div class="tag-list">
                ${t.tags.map(tag => `<span class="badge">#${tag}</span>`).join("")}
            </div>
            <div class="task-meta">
                <span>Due: ${t.dueDate || "No Date"}</span>
                <span>Created: ${new Date(t.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="task-actions">
                <select class="status-dropdown">
                    <option value="todo" ${t.status === "todo" ? "selected" : ""}>Todo</option>
                    <option value="in-progress" ${t.status === "in-progress" ? "selected" : ""}>In Progress</option>
                    <option value="done" ${t.status === "done" ? "selected" : ""}>Done</option>
                </select>
                <button class="btn secondary edit-btn">Edit</button>
                <button class="btn danger delete-btn">Delete</button>
            </div>
        `;
        list.appendChild(card);
    });

    updateAnalytics();
}

/* ================= VALIDATION ================= */
function validate(data) {
    if (!data.title || data.title.trim().length < 3) return "Title must be at least 3 characters.";
    if (data.description.length > 200) return "Description exceeds 200 characters.";
    if (data.dueDate && new Date(data.dueDate) < new Date().setHours(0, 0, 0, 0)) return "Due date cannot be in the past.";
    return null;
}

/* ================= EVENT HANDLERS ================= */

// FORM SUBMIT
document.getElementById("taskForm").addEventListener("submit", async e => {
    e.preventDefault();
    const taskIdEl = document.getElementById("taskId");
    const titleEl = document.getElementById("title");
    const descEl = document.getElementById("description");
    const priorityEl = document.getElementById("priority");
    const tagsEl = document.getElementById("tags");
    const dueEl = document.getElementById("dueDate");
    const statusEl = document.getElementById("status");

    // Process tags: unique and trimmed
    const rawTags = tagsEl.value.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
    const uniqueTags = [...new Set(rawTags)];

    const data = {
        title: titleEl.value.trim(),
        description: descEl.value.trim(),
        priority: priorityEl.value,
        tags: uniqueTags,
        dueDate: dueEl.value,
        status: statusEl.value,
    };

    const error = validate(data);
    if (error) {
        document.getElementById("formError").textContent = error;
        return;
    }
    document.getElementById("formError").textContent = "";

    try {
        state.loading = true;
        render();
        if (taskIdEl.value) {
            const updated = await updateTask(taskIdEl.value, data);
            state.tasks = state.tasks.map(t => t.id === updated.id ? updated : t);
        } else {
            data.id = generateId();
            data.createdAt = new Date().toISOString();
            const created = await createTask(data);
            state.tasks = [...state.tasks, created];
        }
        e.target.reset();
        taskIdEl.value = "";
        document.getElementById("submitBtn").textContent = "Secure Save";
    } catch (err) {
        handleUIError(err);
    } finally {
        state.loading = false;
        render();
    }
});

// ACTION DELEGATION
document.getElementById("taskList").addEventListener("click", async e => {
    const card = e.target.closest(".task-card");
    if (!card) return;
    const id = card.dataset.id;
    const task = state.tasks.find(t => t.id === id);

    if (e.target.classList.contains("delete-btn")) {
        if (!confirm("Are you sure you want to delete this task?")) return;
        try {
            state.loading = true; render();
            await deleteTask(id);
            state.tasks = state.tasks.filter(t => t.id !== id);
        } catch (err) { handleUIError(err); }
        finally { state.loading = false; render(); }
    }

    if (e.target.classList.contains("edit-btn")) {
        document.getElementById("taskId").value = task.id;
        document.getElementById("title").value = task.title;
        document.getElementById("description").value = task.description;
        document.getElementById("priority").value = task.priority;
        document.getElementById("tags").value = task.tags.join(", ");
        document.getElementById("dueDate").value = task.dueDate;
        document.getElementById("status").value = task.status;
        document.getElementById("submitBtn").textContent = "Update Task";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// STATUS UPDATE (Event Delegation)
document.getElementById("taskList").addEventListener("change", async e => {
    if (!e.target.classList.contains("status-dropdown")) return;
    const id = e.target.closest(".task-card").dataset.id;
    const newStatus = e.target.value;

    try {
        await updateTask(id, { status: newStatus });
        state.tasks = state.tasks.map(t => t.id === id ? { ...t, status: newStatus } : t);
        updateAnalytics();
    } catch (err) {
        handleUIError(err);
        render(); // Re-render to revert dropdown UI
    }
});

// FILTERS & SEARCH
const searchInput = document.getElementById("search");
searchInput.addEventListener("input", debounce(e => {
    state.filters.search = e.target.value;
    render();
}));

document.getElementById("filterStatus").onchange = e => { state.filters.status = e.target.value; render(); };
document.getElementById("filterPriority").onchange = e => { state.filters.priority = e.target.value; render(); };
document.getElementById("filterTag").onchange = e => { state.filters.tag = e.target.value; render(); };
document.getElementById("sort").onchange = e => { state.filters.sort = e.target.value; render(); };

// BONUS: Keyboard shortcut '/'
window.addEventListener("keydown", e => {
    if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInput.focus();
    }
});

// BONUS: Export JSON
document.getElementById("exportJSON").onclick = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `gupio_tasks_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
};

// RESET SYSTEM
document.getElementById("resetApp").onclick = () => {
    if (confirm("🚨 WARNING: This will PERMANENTLY delete all systemic records. Continue?")) {
        localStorage.clear();
        state.tasks = [];
        render();
    }
};

/* ================= INIT ================= */
(async () => {
    try {
        state.loading = true;
        render();
        state.tasks = await fetchTasks();
    } catch (err) {
        handleUIError(err);
    } finally {
        state.loading = false;
        render();
    }
})();

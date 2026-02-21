const STORAGE_KEY = "smart_task_tracker_tasks";

// Helper to simulate API behavior
const simulateAPI = (delay, failRate = 0.1) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() < failRate) {
                reject(new Error("Server Error: Failed to process request."));
            } else {
                resolve();
            }
        }, delay);
    });
};

export async function fetchTasks() {
    await simulateAPI(500);
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

export async function createTask(task) {
    await simulateAPI(400);
    const tasks = await fetchTasks().catch(() => {
        // Direct read to avoid recursive failure chance during fetch
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    });
    tasks.push(task);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return task;
}

export async function updateTask(id, updates) {
    await simulateAPI(400);
    const data = localStorage.getItem(STORAGE_KEY);
    let tasks = data ? JSON.parse(data) : [];
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return tasks[index];
    }
    throw new Error("Task not found");
}

export async function deleteTask(id) {
    await simulateAPI(300);
    const data = localStorage.getItem(STORAGE_KEY);
    let tasks = data ? JSON.parse(data) : [];
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

# Gupio Smart Task Tracker + Analytics

A high-performance, vanilla JavaScript task management application designed for the Practical JavaScript Evaluation Test.

## Features

### 1. Robust CRUD Operations
- **Create**: Add tasks with automatic ID generation and timestamps.
- **Read**: Dynamic rendering of task cards with priority-themed borders.
- **Update**: Edit existing tasks or change status directly from the card.
- **Delete**: Remove tasks with confirmation.

### 2. Intelligent Filtering & Sorting
- **Real-time Search**: Debounced searching across titles and descriptions.
- **Multi-Filter**: Filter by Status, Priority, and dynamically populated Tags.
- **Advanced Sorting**: Sort by Newest, Due Date, or Priority (High-Low).

### 3. Real-time Analytics Dashboard
- Dynamic counters for Total, Todo, In-Progress, Done, and Overdue tasks.
- **Top Tag Detection**: Automatically identifies and displays the most frequent tag.

### 4. Enterprise-grade Emulation
- **Mock API**: Uses `async/await` with simulated network delays (300ms-500ms).
- **Resilience**: Simulates a 10% random API failure rate with integrated UI error banners.
- **Persistence**: Data lifecycle managed via `localStorage`.
### 5. Premium Light UI
- **Responsive Sidebar**: Clean, modern aesthetic with a organized layout.
- **Micro-animations**: Subtle transitions for improved interactive feedback.
- **Bonus Feature**: Keyboard shortcut (`/`) to focus the search bar.
- **Bonus Feature**: Export tasks as a JSON file for backup.


## JavaScript Concepts Used
- **Modules**: ESM `import/export` for clean dependency management.
- **Closures**: `debounce` for search optimization and `generateId` for unique record tracking.
- **Higher-Order Functions**: Heavy use of `.map()`, `.filter()`, `.reduce()`, and `.sort()`.
- **Event Delegation**: Centralized action handling on the task grid for performance.
- **Async/Await**: Comprehensive asynchronous flow with robust `try/catch` error handling.
- **Immutable Updates**: State management using spread operators and non-mutating array methods.

## How to Run
1. Clone the repository or extract the ZIP.
2. Open `index.html` in a modern web browser.
3. Use a local server (like Live Server or `npx serve`) to ensure ESM Module support.

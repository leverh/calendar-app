import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

export default function TodoList({ user }) {
  const [todos, setTodos] = useState([]);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDueDate, setNewTodoDueDate] = useState("");
  const [newTodoTime, setNewTodoTime] = useState("");
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [newTodoAddToCalendar, setNewTodoAddToCalendar] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "users", user.uid, "todos"));
      const unsub = onSnapshot(q, (snapshot) => {
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTodos(fetched);
      });
      return unsub;
    }
  }, [user]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const showReminder = (todo) => {
    if (!todo.dueDate) return;

    const now = new Date();
    const due = new Date(todo.dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1 && "Notification" in window && Notification.permission === "granted") {
      new Notification("Upcoming Task Reminder", {
        body: `${todo.title} is due ${diffDays === 0 ? "today" : "tomorrow"}!`,
      });
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodoTitle) return;

    let dueDateTime = null;
    if (newTodoDueDate) {
      dueDateTime = new Date(newTodoDueDate);
      if (newTodoTime) {
        const [hours, minutes] = newTodoTime.split(":");
        dueDateTime.setHours(hours, minutes);
      }
    }

    await addDoc(collection(db, "users", user.uid, "todos"), {
      title: newTodoTitle,
      description: newTodoDescription || "",
      dueDate: dueDateTime ? dueDateTime.toISOString() : null,
      addToCalendar: newTodoAddToCalendar,
      completed: false,
      createdAt: new Date().toISOString(),
    }).then(() => {
      showReminder({
        title: newTodoTitle,
        dueDate: dueDateTime,
      });
    });

    // Reset form
    setNewTodoTitle("");
    setNewTodoDueDate("");
    setNewTodoTime("");
    setNewTodoDescription("");
    setNewTodoAddToCalendar(false);
  };

  const toggleTodo = async (id, completed) => {
    await updateDoc(doc(db, "users", user.uid, "todos", id), {
      completed: !completed,
    });

    if (!completed && "Notification" in window && Notification.permission === "granted") {
      new Notification("🎉 Congratulations!", {
        body: "You completed a task! Great job!",
      });
    }
  };

  const deleteTodo = async (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await deleteDoc(doc(db, "users", user.uid, "todos", id));
    }
  };

  const startEditTodo = (todo) => {
    setEditingTodo({
      ...todo,
      dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
      time: todo.dueDate ? new Date(todo.dueDate).toTimeString().slice(0, 5) : ''
    });
  };

  const cancelEdit = () => {
    setEditingTodo(null);
  };

  const saveEditedTodo = async () => {
    if (!editingTodo || !editingTodo.title) return;

    let dueDateTime = null;
    if (editingTodo.dueDate) {
      dueDateTime = new Date(editingTodo.dueDate);
      if (editingTodo.time) {
        const [hours, minutes] = editingTodo.time.split(":");
        dueDateTime.setHours(hours, minutes);
      }
    }

    await updateDoc(doc(db, "users", user.uid, "todos", editingTodo.id), {
      title: editingTodo.title,
      description: editingTodo.description || "",
      dueDate: dueDateTime ? dueDateTime.toISOString() : null,
      addToCalendar: editingTodo.addToCalendar,
    });

    setEditingTodo(null);
  };

  const categorizeTodo = (todo) => {
    if (!todo.dueDate) return "This Lifetime";

    const now = new Date();
    const due = new Date(todo.dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Immediate Attention (Today)";
    if (diffDays === 1) return "Attention Soon (Tomorrow)";
    if (diffDays <= 7) return "Attention This Week";
    if (due.getMonth() === now.getMonth()) return "Attention This Month";
    if (due.getMonth() <= now.getMonth() + 3) return "Next Quarter";
    return "This Lifetime";
  };

  const categorized = {
    "Immediate Attention (Today)": [],
    "Attention Soon (Tomorrow)": [],
    "Attention This Week": [],
    "Attention This Month": [],
    "Next Quarter": [],
    "This Lifetime": [],
  };

  todos
    .filter((todo) => !todo.completed)
    .forEach((todo) => {
      const category = categorizeTodo(todo);
      categorized[category].push(todo);
    });

  const getSectionClass = (section) => {
    switch (section) {
      case "Immediate Attention (Today)":
        return "immediate";
      case "Attention Soon (Tomorrow)":
        return "tomorrow";
      case "Attention This Week":
        return "week";
      case "Attention This Month":
        return "month";
      case "Next Quarter":
        return "quarter";
      case "This Lifetime":
        return "lifetime";
      default:
        return "";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    
    // Add time if it exists (not midnight)
    if (date.getHours() !== 0 || date.getMinutes() !== 0) {
      return `${date.toLocaleDateString(undefined, options)} at ${date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    }
    
    return date.toLocaleDateString(undefined, options);
  };

  return (
    <div className="todo-container">
      <h2 className="todo-header">Task Manager</h2>

      {/* Add Todo Form */}
      <form className="todo-add-form" onSubmit={addTodo}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="task-title">Task</label>
            <input
              id="task-title"
              placeholder="What needs to be done?"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="task-date">Due Date</label>
            <input
              id="task-date"
              type="date"
              value={newTodoDueDate}
              onChange={(e) => setNewTodoDueDate(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="task-time">Time</label>
            <input
              id="task-time"
              type="time"
              value={newTodoTime}
              onChange={(e) => setNewTodoTime(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="task-description">Notes</label>
          <textarea
            id="task-description"
            placeholder="Add any details or notes about this task"
            value={newTodoDescription}
            onChange={(e) => setNewTodoDescription(e.target.value)}
            rows={2}
          />
        </div>
        
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={newTodoAddToCalendar}
              onChange={(e) => setNewTodoAddToCalendar(e.target.checked)}
              className="todo-checkbox"
            />
            Add also to Calendar
          </label>
        </div>
        
        <button type="submit">Add Task</button>
      </form>

      {/* Editing Form */}
      {editingTodo && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Edit Task</h2>
            <form onSubmit={(e) => { e.preventDefault(); saveEditedTodo(); }}>
              <div className="form-group">
                <label htmlFor="edit-title">Task</label>
                <input
                  id="edit-title"
                  value={editingTodo.title}
                  onChange={(e) => setEditingTodo({...editingTodo, title: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-date">Due Date</label>
                  <input
                    id="edit-date"
                    type="date"
                    value={editingTodo.dueDate}
                    onChange={(e) => setEditingTodo({...editingTodo, dueDate: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-time">Time</label>
                  <input
                    id="edit-time"
                    type="time"
                    value={editingTodo.time}
                    onChange={(e) => setEditingTodo({...editingTodo, time: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-description">Notes</label>
                <textarea
                  id="edit-description"
                  value={editingTodo.description || ""}
                  onChange={(e) => setEditingTodo({...editingTodo, description: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editingTodo.addToCalendar}
                    onChange={(e) => setEditingTodo({...editingTodo, addToCalendar: e.target.checked})}
                    className="todo-checkbox"
                  />
                  Add to Calendar
                </label>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="cancel" onClick={cancelEdit}>Cancel</button>
                <button type="submit" className="primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Completed Tasks */}
      <div className="toggle-completed">
        <button 
          onClick={() => setShowCompleted(!showCompleted)}
          className="toggle-btn"
        >
          {showCompleted ? "Hide Completed Tasks" : "Show Completed Tasks"}
        </button>
      </div>

      {/* Completed Tasks */}
      {showCompleted && (
        <div className="todo-section-completed">
          <h3>✅ Completed Tasks</h3>
          {todos.filter(todo => todo.completed).length === 0 ? (
            <p className="no-tasks">No completed tasks yet.</p>
          ) : (
            <ul className="todo-list">
              {todos
                .filter((todo) => todo.completed)
                .map((todo) => (
                  <li key={todo.id} className="todo-item">
                    <div className="todo-item-content">
                      <div className="todo-title">{todo.title}</div>
                      {todo.dueDate && (
                        <div className="todo-due-date">
                          {formatDate(todo.dueDate)}
                        </div>
                      )}
                      {todo.description && (
                        <div className="todo-description">{todo.description}</div>
                      )}
                    </div>
                    <div className="todo-actions">
                      <button 
                        onClick={() => toggleTodo(todo.id, todo.completed)}
                        className="edit-btn"
                      >
                        Restore
                      </button>
                      <button 
                        onClick={() => deleteTodo(todo.id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))
              }
            </ul>
          )}
        </div>
      )}

      {/* Active Tasks by Category */}
      {Object.entries(categorized).map(([section, tasks]) => {
        if (tasks.length === 0) return null;
        
        return (
          <div key={section} className={`todo-section ${getSectionClass(section)}`}>
            <h3>{section}</h3>
            <ul className="todo-list">
              {tasks.map((todo) => (
                <li key={todo.id} className="todo-item">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id, todo.completed)}
                    className="todo-checkbox"
                  />
                  <div className="todo-item-content">
                    <div className="todo-title">{todo.title}</div>
                    {todo.dueDate && (
                      <div className="todo-due-date">
                        {formatDate(todo.dueDate)}
                      </div>
                    )}
                    {todo.description && (
                      <div className="todo-description">{todo.description}</div>
                    )}
                  </div>
                  <div className="todo-actions">
                    <button 
                      onClick={() => startEditTodo(todo)}
                      className="edit-btn"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteTodo(todo.id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      
      {/* Show message if no tasks */}
      {todos.filter(todo => !todo.completed).length === 0 && (
        <div className="empty-state">
          <h3>No active tasks</h3>
          <p>Add some tasks to get started! Your to-do list helps you keep track of what needs to be done.</p>
        </div>
      )}
    </div>
  );
}
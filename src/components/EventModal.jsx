import { useState, useEffect } from "react";

export default function EventModal({ date, onSave, onClose, eventToEdit, onDelete }) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [repeat, setRepeat] = useState("none");
  const [reminder, setReminder] = useState("30");
  const [color, setColor] = useState("blue");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || "");
      setTime(
        eventToEdit.start
          ? new Date(eventToEdit.start).toTimeString().slice(0, 5)
          : "09:00"
      );
      setRepeat(eventToEdit.rrule?.freq?.toLowerCase() || "none");
      setReminder(eventToEdit.reminder || "30");
      setColor(eventToEdit.color || "blue");
      setDescription(eventToEdit.description || "");
    }
  }, [eventToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      title,
      time,
      repeat,
      reminder,
      color,
      description,
    });
  };

  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  return (
    <div className="modal-backdrop" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal">
        <h2>{eventToEdit ? "Edit Event" : `New Event`}</h2>
        <p className="event-date">{formatDate(date)}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="event-title">Title:</label>
            <input 
              id="event-title"
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's happening?"
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="event-time">Time:</label>
            <input 
              id="event-time"
              type="time" 
              value={time} 
              onChange={(e) => setTime(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label htmlFor="event-repeat">Repeat:</label>
            <select 
              id="event-repeat"
              value={repeat} 
              onChange={(e) => setRepeat(e.target.value)}
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Every day</option>
              <option value="weekly">Every week</option>
              <option value="monthly">Every month</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="event-reminder">Remind me:</label>
            <select 
              id="event-reminder"
              value={reminder} 
              onChange={(e) => setReminder(e.target.value)}
            >
              <option value="5">5 minutes before</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
              <option value="24">24 hours before</option>
            </select>
          </div>

          <div className="form-group">
            <label>Color:</label>
            <div className="color-picker">
              {["blue", "red", "green", "orange", "purple", "teal"].map((c) => (
                <div
                  key={c}
                  className={`color-swatch ${c} ${c === color ? "selected" : ""}`}
                  onClick={() => setColor(c)}
                  aria-label={`${c} color`}
                  role="button"
                  tabIndex="0"
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="event-description">Notes:</label>
            <textarea
              id="event-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details for this event"
            />
          </div>

          <div className="modal-actions">
            {eventToEdit && (
              <button 
                type="button"
                onClick={onDelete} 
                className="danger"
              >
                Delete
              </button>
            )}
            <button 
              type="button"
              onClick={onClose} 
              className="cancel"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="primary"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
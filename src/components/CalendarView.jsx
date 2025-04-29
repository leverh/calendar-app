import EventModal from "./EventModal";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import rrulePlugin from "@fullcalendar/rrule";
import WeatherWidget from './WeatherWidget';

import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

export default function CalendarView({ user }) {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [view, setView] = useState(windowWidth < 768 ? "timeGridDay" : "timeGridWeek");

  const calendarRef = useRef(null);

  const handleViewChange = (newView) => {
    setView(newView);
    
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(newView);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);
      
      // Automatically switch views based on screen size
      if (newWidth < 768 && view !== "timeGridDay") {
        setView("timeGridDay");
      } else if (newWidth >= 768 && newWidth < 1024 && view !== "timeGridWeek") {
        setView("timeGridWeek");
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [view]);

  useEffect(() => {
    if (user) {
      const eventQuery = query(collection(db, "users", user.uid, "events"));
      const todoQuery = query(collection(db, "users", user.uid, "todos"));

      const unsubEvents = onSnapshot(eventQuery, (snapshot) => {
        const calendarEvents = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const unsubTodos = onSnapshot(todoQuery, (todoSnapshot) => {
          const todos = todoSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const todoEvents = todos
            .filter((todo) => todo.addToCalendar && todo.dueDate && !todo.fromCalendar)
            .map((todo) => ({
              id: `todo-${todo.id}`,
              title: todo.title,
              start: todo.dueDate,
              backgroundColor: "#f39c12",
              borderColor: "#f39c12",
              textColor: "#ffffff",
              description: todo.description || "",
              classNames: ["todo-calendar-event"],
              editable: false,
            }));

          setEvents([...calendarEvents, ...todoEvents]);
        });

        return unsubTodos;
      });

      return unsubEvents;
    }
  }, [user]);

  const handleDateClick = (arg) => {
    setSelectedDate(new Date(arg.dateStr));
    setEventToEdit(null); 
    setShowModal(true);
  };

  const handleEventClick = (info) => {
    // Prevent clicking on To-Do events
    if (info.event.id.startsWith("todo-")) return;

    setSelectedDate(info.event.start);
    setEventToEdit({
      id: info.event.id,
      title: info.event.title,
      color: info.event.backgroundColor || info.event.extendedProps.color,
      reminder: info.event.extendedProps.reminder || "30",
      description: info.event.extendedProps.description || "",
      rrule: info.event.extendedProps.rrule || null,
      start: info.event.startStr,
    });
    setShowModal(true);
  };

  const handleSaveEvent = async (data) => {
    const [hour, minute] = data.time.split(":");
    const startDate = new Date(selectedDate);
    startDate.setHours(hour, minute);
    
    let eventData = {
      title: data.title,
      color: data.color,
      backgroundColor: data.color,
      borderColor: data.color,
      textColor: "#ffffff",
      reminder: data.reminder,
      description: data.description,
      addToTaskList: data.addToTaskList,
      editable: true,
    };
    
    if (data.repeat !== "none") {
      eventData.rrule = {
        freq: data.repeat.toUpperCase(),
        dtstart: startDate.toISOString(),
      };
    } else {
      eventData.start = startDate.toISOString();
    }
    
    try {
      let eventId;
      
      if (eventToEdit && eventToEdit.id) {
        const ref = doc(db, "users", user.uid, "events", eventToEdit.id);
        await updateDoc(ref, eventData);
        eventId = eventToEdit.id;
      } else {
        const newEventRef = await addDoc(collection(db, "users", user.uid, "events"), eventData);
        eventId = newEventRef.id;
      }
      
      // Add to task list if the checkbox is checked
      if (data.addToTaskList) {
        await addDoc(collection(db, "users", user.uid, "todos"), {
          title: data.title,
          description: data.description || "",
          dueDate: startDate.toISOString(),
          addToCalendar: true, 
          completed: false,
          createdAt: new Date().toISOString(),
          fromCalendar: true,
          calendarEventId: eventId,
        });
      }
      
      setShowModal(false);
    } catch (error) {
      console.error("Error saving event:", error);
      alert("There was a problem saving your event. Please try again.");
    }
  };

  const handleDeleteEvent = async () => {
    if (eventToEdit?.id) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "events", eventToEdit.id));
        setShowModal(false);
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("There was a problem deleting your event. Please try again.");
      }
    }
  };

  return (
    <div className="calendar-container">
      <h2 className="calendar-header">Calendar</h2>

      <WeatherWidget location="New York" /> {/* Example location */}
      
      <div className="calendar-view-buttons">
        <button 
          onClick={() => handleViewChange("dayGridMonth")}
          className={view === "dayGridMonth" ? "active" : ""}
        >
          Month
        </button>
        <button 
          onClick={() => handleViewChange("timeGridWeek")}
          className={view === "timeGridWeek" ? "active" : ""}
        >
          Week
        </button>
        <button 
          onClick={() => handleViewChange("timeGridDay")}
          className={view === "timeGridDay" ? "active" : ""}
        >
          Day
        </button>
      </div>
      
      <div className="calendar-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
          initialView={view}
          view={view}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          editable={true}
          selectable={true}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "", // Custom buttons instead
          }}
          nowIndicator={true}
          height="auto"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: 'short'
          }}
          dayMaxEvents={3}
          moreLinkClick="day"
          eventDidMount={(info) => {
            // Add tooltips
            const tooltip = document.createElement('div');
            tooltip.classList.add('event-tooltip');
            
            let content = `<strong>${info.event.title}</strong>`;
            if (info.event.extendedProps.description) {
              content += `<br>${info.event.extendedProps.description}`;
            }
            
            tooltip.innerHTML = content;
            
            const showTooltip = () => {
              tooltip.style.display = 'block';
              document.body.appendChild(tooltip);
              
              const rect = info.el.getBoundingClientRect();
              tooltip.style.top = `${rect.bottom + window.scrollY}px`;
              tooltip.style.left = `${rect.left + window.scrollX}px`;
            };
            
            const hideTooltip = () => {
              tooltip.style.display = 'none';
              tooltip.remove();
            };
            
            info.el.addEventListener('mouseenter', showTooltip);
            info.el.addEventListener('mouseleave', hideTooltip);
            info.el.addEventListener('touchstart', showTooltip);
            info.el.addEventListener('touchend', hideTooltip);
          }}
        />
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#4a90e2" }}></div>
          <div>Events</div>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#f39c12" }}></div>
          <div>Tasks</div>
        </div>
      </div>

      <div className="calendar-instructions">
        <p>
          <strong>Tip:</strong> Click on any date to add a new event, or click on an existing event to edit it.
        </p>
      </div>

      {showModal && (
        <EventModal
          date={selectedDate}
          eventToEdit={eventToEdit}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
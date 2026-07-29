import React, { useState, useEffect } from 'react';
import { X, Calendar, Loader2 } from 'lucide-react';

const EventModal = ({ isOpen, onClose, onSubmit, eventData = null, title = 'Add Event' }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    venue: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    registrationDeadline: '',
    organizer: '',
    capacity: 50,
    image: '',
    status: 'Upcoming',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['Technical', 'Cultural', 'Sports', 'Seminar', 'Workshop', 'Other'];
  const statuses = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

  // Sync edit mode details
  useEffect(() => {
    if (eventData) {
      // Format dates for input field (YYYY-MM-DD)
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toISOString().split('T')[0];
      };

      setFormData({
        title: eventData.title || '',
        description: eventData.description || '',
        category: eventData.category || '',
        venue: eventData.venue || '',
        eventDate: formatDate(eventData.eventDate),
        startTime: eventData.startTime || '',
        endTime: eventData.endTime || '',
        registrationDeadline: formatDate(eventData.registrationDeadline),
        organizer: eventData.organizer || '',
        capacity: eventData.capacity || 50,
        image: eventData.image || '',
        status: eventData.status || 'Upcoming',
      });
    } else {
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        venue: '',
        eventDate: '',
        startTime: '',
        endTime: '',
        registrationDeadline: '',
        organizer: '',
        capacity: 50,
        image: '',
        status: 'Upcoming',
      });
    }
    setFormErrors({});
  }, [eventData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'capacity' ? Number(value) : value,
    });
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.venue.trim()) errors.venue = 'Venue is required';
    if (!formData.eventDate) errors.eventDate = 'Event date is required';
    if (!formData.registrationDeadline) errors.registrationDeadline = 'Registration deadline is required';
    if (!formData.startTime) errors.startTime = 'Start time is required';
    if (!formData.endTime) errors.endTime = 'End time is required';
    if (formData.capacity <= 0) errors.capacity = 'Capacity must be greater than zero';
    if (!formData.organizer.trim()) errors.organizer = 'Organizer is required';

    // Verify times
    if (formData.startTime && formData.endTime) {
      const [sh, sm] = formData.startTime.split(':').map(Number);
      const [eh, em] = formData.endTime.split(':').map(Number);
      const startM = sh * 60 + sm;
      const endM = eh * 60 + em;
      if (startM >= endM) {
        errors.endTime = 'End time must be after start time';
      }
    }

    // Verify dates
    if (formData.eventDate && formData.registrationDeadline) {
      const evDate = new Date(formData.eventDate);
      const deadDate = new Date(formData.registrationDeadline);
      if (deadDate > evDate) {
        errors.registrationDeadline = 'Registration deadline cannot be after event date';
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit(formData);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs transition-opacity" onClick={onClose}></div>

      {/* Form Container */}
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10 border border-gray-150 transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            {title}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Event Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  formErrors.title ? 'border-red-300' : 'border-gray-300'
                } rounded-lg text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                placeholder="Title"
              />
              {formErrors.title && <p className="mt-0.5 text-xs text-red-500">{formErrors.title}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  formErrors.category ? 'border-red-300' : 'border-gray-300'
                } rounded-lg text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {formErrors.category && <p className="mt-0.5 text-xs text-red-500">{formErrors.category}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className={`w-full px-3 py-2 border ${
                formErrors.description ? 'border-red-300' : 'border-gray-300'
              } rounded-lg text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              placeholder="Event description and objectives..."
            ></textarea>
            {formErrors.description && <p className="mt-0.5 text-xs text-red-500">{formErrors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Venue</label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  formErrors.venue ? 'border-red-300' : 'border-gray-300'
                } rounded-lg text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                placeholder="Room/Hall name"
              />
              {formErrors.venue && <p className="mt-0.5 text-xs text-red-500">{formErrors.venue}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Organizer</label>
              <input
                type="text"
                name="organizer"
                value={formData.organizer}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  formErrors.organizer ? 'border-red-300' : 'border-gray-300'
                } rounded-lg text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                placeholder="Organizer department/committee"
              />
              {formErrors.organizer && <p className="mt-0.5 text-xs text-red-500">{formErrors.organizer}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Event Date</label>
              <input
                type="date"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  formErrors.eventDate ? 'border-red-300' : 'border-gray-300'
                } rounded-lg text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              />
              {formErrors.eventDate && <p className="mt-0.5 text-xs text-red-500">{formErrors.eventDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Start Time</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  formErrors.startTime ? 'border-red-300' : 'border-gray-300'
                } rounded-lg text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              />
              {formErrors.startTime && <p className="mt-0.5 text-xs text-red-500">{formErrors.startTime}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">End Time</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  formErrors.endTime ? 'border-red-300' : 'border-gray-300'
                } rounded-lg text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              />
              {formErrors.endTime && <p className="mt-0.5 text-xs text-red-500">{formErrors.endTime}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Reg. Deadline</label>
              <input
                type="date"
                name="registrationDeadline"
                value={formData.registrationDeadline}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  formErrors.registrationDeadline ? 'border-red-300' : 'border-gray-300'
                } rounded-lg text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              />
              {formErrors.registrationDeadline && <p className="mt-0.5 text-xs text-red-500">{formErrors.registrationDeadline}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Capacity</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  formErrors.capacity ? 'border-red-300' : 'border-gray-300'
                } rounded-lg text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
                placeholder="Capacity"
              />
              {formErrors.capacity && <p className="mt-0.5 text-xs text-red-500">{formErrors.capacity}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Image URL</label>
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g. https://images.unsplash.com/... or leave blank"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg text-sm font-semibold shadow-sm focus:outline-none flex items-center justify-center min-w-[80px]"
            >
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 text-white" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;

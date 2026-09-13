import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../services/api";
import PhotoManager from "./PhotoManager";
import GalleryManager from "./GalleryManager";

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/events/${eventId}`);

      setEvent(response.data.event);
    } catch (error) {
      console.error("Failed to fetch event:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load event"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-gray-600">
            Loading event...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-gray-600">
            Event not found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="mb-6 inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          ← Back to Dashboard
        </button>

        {/* Event header */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {event.name}
          </h1>

          <p className="mt-2 text-gray-600">
            {event.description ||
              "No description provided for this event."}
          </p>
        </div>

        {/* Team members */}
        <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Team Members
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Photographers assigned to this event.
            </p>
          </div>

          {event.teamMembers?.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {event.teamMembers.map((member) => (
                <div
                  key={member._id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  <p className="font-medium text-gray-900">
                    {member.name}
                  </p>

                  <p className="mt-1 break-all text-sm text-gray-600">
                    {member.email}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
              <p className="text-gray-500">
                No team members assigned.
              </p>
            </div>
          )}
        </section>

        {/* Photos */}
        <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <PhotoManager eventId={eventId} />
        </section>

        {/* Gallery */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <GalleryManager eventId={eventId} />
        </section>

      </div>
    </div>
  );
};

export default EventDetails;
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import CreateEvent from "./CreateEvent";
import AddTeamMember from "./AddTeamMember";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/events/my-events");

      setEvents(response.data.events || []);
    } catch (error) {
      console.error("Failed to fetch events:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load events"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen w-full bg-slate-50">
      {/* Top navigation */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 xl:px-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-lg text-white">
                📷
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  TrizenAI Photos
                </p>

                <p className="text-xs text-slate-500">
                  Admin Workspace
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {user?.name}
              </p>

              <p className="text-xs text-slate-500">
                Administrator
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
        {/* Dashboard heading */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                Admin Workspace
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Admin Dashboard
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Create events, assign team members, and
                manage your photography projects.
              </p>
            </div>

            <div className="w-fit rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-2xl font-bold text-slate-900">
                {events.length}
              </p>

              <p className="text-xs font-medium text-slate-500">
                Event{events.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </section>

        {/* Create event */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Create New Event
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Create an event before assigning
              photographers and managing photos.
            </p>
          </div>

          <CreateEvent
            onEventCreated={fetchEvents}
          />
        </section>

        {/* Events */}
        <section>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                My Events
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage your created events and assigned
                team members.
              </p>
            </div>

            {events.length > 0 && (
              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {events.length} event
                {events.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loading && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="p-6">
                      <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
                      <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-100" />
                      <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                      <div className="mt-7 h-10 w-full animate-pulse rounded-xl bg-slate-200" />
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {error && !loading && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-medium text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchEvents}
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                📷
              </div>

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No Events Yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create your first photography event
                using the form above.
              </p>
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {events.map((event) => (
                <div
                  key={event._id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <img
                        src="/logo.svg"
                        alt="TrizenAI Photos"
                        className="h-10 w-10 rounded-xl"
                      />

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {event.teamMembers?.length ||
                          0}{" "}
                        member
                        {(event.teamMembers?.length ||
                          0) !== 1
                          ? "s"
                          : ""}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900">
                      {event.name}
                    </h3>

                    <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
                      {event.description ||
                        "No description provided for this event."}
                    </p>

                    <div className="mt-6 rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Team Members
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {event.teamMembers?.length ||
                          0}{" "}
                        assigned
                      </p>
                    </div>

                    <div className="mt-6">
                      <AddTeamMember
                        eventId={event._id}
                        onMemberAdded={fetchEvents}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/admin/events/${event._id}`
                        )
                      }
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Open Event
                      <span aria-hidden="true">
                        →
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
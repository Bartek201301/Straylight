'use client';

export default function MobileEditorMessage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="glass-enhanced rounded-2xl p-8 text-center max-w-md mx-auto bg-white/5 border-white/10 shadow-premium">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-white/10 text-white">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="2"
                y="3"
                width="20"
                height="14"
                rx="2"
                ry="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <line
                x1="8"
                y1="21"
                x2="16"
                y2="21"
                stroke="currentColor"
                strokeWidth="2"
              />
              <line
                x1="12"
                y1="17"
                x2="12"
                y2="21"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Wymagane urządzenie stacjonarne
          </h2>
          <p className="text-white/70 leading-relaxed">
            Edytor artykułów potrzebuje większego ekranu, aby zapewnić najlepsze
            warunki pisania. Przełącz się na komputer lub iPada, aby kontynuować
            pracę nad tekstem.
          </p>
        </div>

        <div className="space-y-3 text-sm text-white/60">
          <div className="flex items-center justify-center space-x-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="2"
                y="3"
                width="20"
                height="14"
                rx="2"
                ry="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <line
                x1="8"
                y1="21"
                x2="16"
                y2="21"
                stroke="currentColor"
                strokeWidth="2"
              />
              <line
                x1="12"
                y1="17"
                x2="12"
                y2="21"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <span>Komputer stacjonarny lub laptop</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="4"
                y="2"
                width="16"
                height="20"
                rx="2"
                ry="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <line
                x1="12"
                y1="18"
                x2="12.01"
                y2="18"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <span>iPad lub tablet</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-xs text-white/50">
            Edycja na telefonach będzie dostępna wkrótce
          </p>
        </div>
      </div>
    </div>
  );
}

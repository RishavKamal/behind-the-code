export default function Loading() {
  return (
    <main className="flex min-h-[calc(100vh-70px)] items-center justify-center bg-[#fafaf8]">
      <div className="flex flex-col items-center">
        {/* Animated BT Logo */}
        <div className="relative flex h-20 w-20 items-center justify-center">
          {/* Orbital ring */}
          <div className="absolute inset-0 rounded-full border border-[#d8d8d2]" />

          {/* Rotating accent ring */}
          <div className="absolute inset-0 animate-[spin_1.8s_linear_infinite] rounded-full border border-transparent border-t-[#171717]" />

          {/* Orbiting dot */}
          <div className="absolute inset-0 animate-[spin_1.8s_linear_infinite]">
            <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#171717]" />
          </div>

          {/* BT logo */}
          <div className="relative flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#171717] text-[11px] font-bold tracking-tight text-white shadow-[0_8px_25px_rgba(23,23,23,0.12)]">
            BT
          </div>
        </div>

        {/* Brand */}
        <div className="mt-7 text-[15px] font-semibold tracking-[-0.02em] text-[#171717]">
          Behind the Code
        </div>

        {/* Loading text */}
        <div className="mt-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-[#999992]">
          <span>Loading</span>

          <span className="flex gap-0.5">
            <span className="animate-[pulse_1.2s_ease-in-out_infinite]">
              .
            </span>

            <span className="animate-[pulse_1.2s_ease-in-out_0.2s_infinite]">
              .
            </span>

            <span className="animate-[pulse_1.2s_ease-in-out_0.4s_infinite]">
              .
            </span>
          </span>
        </div>
      </div>
    </main>
  );
}
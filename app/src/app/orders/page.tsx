"use client";

const activeOrder = {
  restaurant: "Harbour Café",
  items: "Calamari Rings · Prawn Cocktail · 1x Coke",
  total: "R199",
  eta: "12 min",
  steps: [
    { label: "Placed", icon: "✓", done: true },
    { label: "Confirmed", icon: "✓", done: true },
    { label: "Preparing", icon: "🍳", active: true },
    { label: "On way", icon: "🛵" },
    { label: "Delivered", icon: "🏠" },
  ],
};

const pastOrders = [
  { restaurant: "Fish & More", items: "Yellowtail fillet · Chips · Tartare sauce", total: "R145", time: "Yesterday, 19:34", status: "Delivered" },
  { restaurant: "Pick n Pay", items: "Braai pack · Rolls · 2x Castle Lager", total: "R312", time: "Sun, 14:22", status: "Delivered" },
  { restaurant: "GoRide", items: "Struisbaai Harbour → L'Agulhas town", total: "R68", time: "Sat, 11:05", status: "Completed" },
  { restaurant: "Sea Experience", items: "Whale watching boat · 2 pax · Southern Tip Adventures", total: "R760", time: "Fri, 07:30", status: "Completed" },
];

export default function OrdersPage() {
  return (
    <div className="px-[18px]">
      <h1 className="font-heading font-black text-[22px] tracking-tight pt-3 mb-4">
        Your <span className="text-primary">Orders</span>
      </h1>

      {/* Active order */}
      <div className="bg-dark2 border border-primary/30 rounded-[18px] p-4 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-[7px] h-[7px] bg-primary rounded-full animate-pulse-live" />
          <span className="font-heading font-bold text-xs text-primary">On the way</span>
        </div>
        <div className="font-heading font-bold text-sm mb-1">{activeOrder.restaurant}</div>
        <div className="text-[11px] text-t2 mb-3">{activeOrder.items}</div>

        {/* Tracker */}
        <div className="flex items-center justify-between mb-3">
          {activeOrder.steps.map((step, i) => (
            <div key={step.label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.done
                      ? "bg-primary text-white"
                      : step.active
                      ? "bg-primary/20 border-2 border-primary text-white"
                      : "bg-dark3 border border-bd text-t3"
                  }`}
                >
                  {step.icon}
                </div>
                <span className={`text-[9px] mt-1 font-heading font-semibold ${step.done || step.active ? "text-white" : "text-t3"}`}>
                  {step.label}
                </span>
              </div>
              {i < activeOrder.steps.length - 1 && (
                <div className={`flex-1 h-[2px] mx-1 rounded-full ${step.done ? "bg-primary" : "bg-dark3"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="font-heading font-bold text-sm text-t2">
            {activeOrder.total} · ETA {activeOrder.eta}
          </div>
          <span className="font-heading font-bold text-xs text-primary">Track →</span>
        </div>
      </div>

      {/* Past orders */}
      <h2 className="font-heading font-bold text-sm text-t2 mb-2.5 mt-1">Past orders</h2>
      <div className="space-y-3 pb-24">
        {pastOrders.map((order, i) => (
          <div key={i} className="bg-dark2 border border-bd rounded-[18px] p-4">
            <div className="font-heading font-bold text-[11px] text-t3 mb-1">{order.status}</div>
            <div className="font-heading font-bold text-sm mb-0.5">{order.restaurant}</div>
            <div className="text-[11px] text-t2 mb-2">{order.items}</div>
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-sm">{order.total}</span>
              <span className="text-[11px] text-t3">{order.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

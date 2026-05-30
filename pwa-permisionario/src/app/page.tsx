'use client';

import { useState } from 'react';

const FLOWS = [
  {
    id: 'estacionar',
    title: 'Estacionar',
    icon: '🚗',
    description: 'El conductor envía ESTACIONAR por WhatsApp',
    steps: [
      { role: 'user', message: 'ESTACIONAR A12 ABC123D' },
      { role: 'bot', message: '✅ *Estacionamiento iniciado*\n🚗 Patente: ABC123D\n📍 Zona: A12\n🕐 13:30 → 14:30\n📱 Pago digital registrado\n\nEscribí *FIN* cuando quieras terminar.' },
    ],
  },
  {
    id: 'fin',
    title: 'Finalizar',
    icon: '🏁',
    description: 'El conductor finaliza su sesión y se cobra el tiempo real',
    steps: [
      { role: 'user', message: 'FIN' },
      { role: 'bot', message: '🏁 *Estacionamiento finalizado*\n🚗 Patente: ABC123D\n⏱ Duración: 1h 23min\n💰 Costo: $980\n📄 Saldo restante: $4.020\n\n¡Gracias por usar SEM Digital! 🙏' },
    ],
  },
  {
    id: 'saldo',
    title: 'Consultar saldo',
    icon: '💰',
    description: 'El conductor consulta su saldo disponible',
    steps: [
      { role: 'user', message: 'SALDO' },
      { role: 'bot', message: '💰 *Tu saldo*\nDisponible: $5.000,00\n\n📋 *Sesión activa*\n🚗 ABC123D en zona A12\n🕐 13:30 → 14:30\n📱 Digital\n\nPara recargar escribí: *RECARGAR monto*' },
    ],
  },
  {
    id: 'recargar',
    title: 'Recargar saldo',
    icon: '💳',
    description: 'El conductor recarga su billetera via Mercado Pago',
    steps: [
      { role: 'user', message: 'RECARGAR 5000' },
      { role: 'bot', message: '💳 *Recarga de saldo*\nMonto: $5.000\n\nPagá en el siguiente link:\nhttps://mpago.la/abc123\n\nEl saldo se acreditará automáticamente.' },
      { role: 'bot', message: '✅ *Recarga exitosa*\nSe cargaron $5.000 en tu billetera.\n\nEscribí SALDO para verificar.' },
    ],
  },
  {
    id: 'efectivo',
    title: 'Pago efectivo',
    icon: '💵',
    description: 'El permisionario registra un pago en efectivo desde la PWA',
    steps: [
      { role: 'system', message: 'Permisionario registra pago efectivo desde PWA:\n• Patente: XYZ789\n• Tipo: Auto\n• Se crea sesión con metodo_pago = efectivo\n• Se genera DÉBITO de $140 (20% comisión municipal)\n• El conductor pagó $700 directamente al permisionario' },
    ],
  },
];

const CREDENTIALS = {
  legajo: 'P001',
  password: 'Demo2026',
  telefono: '5493875555123',
};

export default function HomePage() {
  const [activeFlow, setActiveFlow] = useState<string>('estacionar');
  const [stepIndex, setStepIndex] = useState(0);
  const [showSeedInfo, setShowSeedInfo] = useState(false);

  const currentFlow = FLOWS.find((f) => f.id === activeFlow)!;
  const visibleSteps = currentFlow.steps.slice(0, stepIndex + 1);
  const canAdvance = stepIndex < currentFlow.steps.length - 1;
  const isLastStep = stepIndex >= currentFlow.steps.length - 1;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
              S
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm">SEM Salta</span>
              <span className="text-slate-400 text-sm ml-1 hidden sm:inline">Digital</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition">
              PWA Permisionario
            </a>
            <a href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-sm">
              Ingresar
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-white/90 text-sm mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            PunaTech 2026 — Ordenanza 12.170
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-tight">
            SEM Salta Digital
          </h1>
          <p className="text-lg sm:text-xl text-blue-200 max-w-2xl mx-auto mb-8">
            Billetera Virtual sobre WhatsApp. Sin app, sin fricción. El conductor estaciona con un mensaje.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
              <div className="text-2xl sm:text-3xl font-bold text-white">$700</div>
              <div className="text-xs sm:text-sm text-blue-200 mt-1">Auto / hora</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
              <div className="text-2xl sm:text-3xl font-bold text-white">$300</div>
              <div className="text-xs sm:text-sm text-blue-200 mt-1">Moto / hora</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-300">0%</div>
              <div className="text-xs sm:text-sm text-blue-200 mt-1">Comisión digital</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
              <div className="text-2xl sm:text-3xl font-bold text-white">0</div>
              <div className="text-xs sm:text-sm text-blue-200 mt-1">Apps que descargar</div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#simulador" className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl shadow-lg hover:bg-blue-50 transition text-sm">
              Ver simulador WhatsApp
            </a>
            <a href="/dashboard" className="bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl border border-blue-400 hover:bg-blue-600 transition text-sm">
              Probar PWA Permisionario
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 text-center mb-2">¿Cómo funciona?</h2>
        <p className="text-slate-500 text-center mb-12 max-w-2xl mx-auto">El conductor siempre paga la tarifa completa. El incentivo digital es para el permisionario: sin comisión municipal.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { step: '1', icon: '💬', title: 'El conductor envía', desc: 'ESTACIONAR A12 ABC123D por WhatsApp' },
            { step: '2', icon: '✅', title: 'El bot valida', desc: 'Verifica zona, saldo y crea la sesión' },
            { step: '3', icon: '📡', title: 'Realtime', desc: 'El permisionario ve el auto en su PWA al instante' },
            { step: '4', icon: '🏁', title: 'El conductor envía', desc: 'FIN para terminar. Se cobra el tiempo real' },
            { step: '5', icon: '💰', title: 'Clearing', desc: 'Permisionario recibe 100% si es digital, 80% si es efectivo' },
          ].map((item) => (
            <div key={item.step} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-sm mx-auto mb-3">
                {item.step}
              </div>
              <div className="text-2xl mb-2">{item.icon}</div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1">{item.title}</h3>
              <p className="text-slate-500 text-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Clearing model */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 text-center mb-2">Modelo de Clearing</h2>
          <p className="text-slate-500 text-center mb-10 max-w-2xl mx-auto">El conductor paga tarifa completa. El permisionario retiene más si el pago es digital.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-4 text-left font-semibold text-slate-600">Escenario</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-600">Conductor paga</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-600">Permisionario recibe</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-600">Municipalidad</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 bg-emerald-50/50">
                  <td className="py-3 px-4">
                    <span className="badge-digital">Digital</span>{' '}Auto
                  </td>
                  <td className="py-3 px-4 text-right font-medium">$700/h</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600">$700/h crédito</td>
                  <td className="py-3 px-4 text-right text-slate-400">$0 (0%)</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4">
                    <span className="badge-efectivo">Efectivo</span>{' '}Auto
                  </td>
                  <td className="py-3 px-4 text-right font-medium">$700/h</td>
                  <td className="py-3 px-4 text-right font-medium">$560/h neto</td>
                  <td className="py-3 px-4 text-right font-bold text-red-600">$140/h (20%)</td>
                </tr>
                <tr className="border-b border-slate-100 bg-emerald-50/50">
                  <td className="py-3 px-4">
                    <span className="badge-digital">Digital</span>{' '}Moto
                  </td>
                  <td className="py-3 px-4 text-right font-medium">$300/h</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600">$300/h crédito</td>
                  <td className="py-3 px-4 text-right text-slate-400">$0 (0%)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">
                    <span className="badge-efectivo">Efectivo</span>{' '}Moto
                  </td>
                  <td className="py-3 px-4 text-right font-medium">$300/h</td>
                  <td className="py-3 px-4 text-right font-medium">$240/h neto</td>
                  <td className="py-3 px-4 text-right font-bold text-red-600">$60/h (20%)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
            <p className="text-sm text-blue-800">
              <strong>Incentivo digital:</strong> El permisionario retiene el <strong>100%</strong> con pagos digitales vs. el <strong>80%</strong> con efectivo. El conductor siempre paga la tarifa completa.
            </p>
          </div>
        </div>
      </section>

      {/* WhatsApp Simulator */}
      <section id="simulador" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 text-center mb-2">Simulador WhatsApp</h2>
        <p className="text-slate-500 text-center mb-8">Proba los flujos de interacción del conductor con el bot</p>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {FLOWS.map((flow) => (
                <button
                  key={flow.id}
                  onClick={() => { setActiveFlow(flow.id); setStepIndex(0); }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeFlow === flow.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  {flow.icon} {flow.title}
                </button>
              ))}
            </div>

            <p className="text-sm text-slate-500 mb-4">{currentFlow.description}</p>

            <div className="bg-slate-100 rounded-2xl overflow-hidden shadow-xl border border-slate-200">
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#075E54] font-bold text-sm shadow">
                  S
                </div>
                <div>
                  <div className="font-semibold text-sm">SEM Salta Digital</div>
                  <div className="text-[10px] text-green-200">en línea</div>
                </div>
              </div>

              <div className="p-4 space-y-2 min-h-[280px] max-h-[380px] overflow-y-auto bg-[#ECE5DD]">
                {visibleSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className={`flex ${step.role === 'user' ? 'justify-end' : step.role === 'system' ? 'justify-center' : 'justify-start'}`}
                  >
                    {step.role === 'user' && (
                      <div className="max-w-[80%] bg-[#DCF8C6] rounded-2xl rounded-tr-sm px-3 py-2 text-sm shadow-sm">
                        <p className="whitespace-pre-line text-slate-800">{step.message}</p>
                        <div className="text-[9px] text-slate-400 mt-0.5 text-right">
                          {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} ✓✓
                        </div>
                      </div>
                    )}
                    {step.role === 'system' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-sm text-blue-800 max-w-full shadow-sm">
                        <p className="font-semibold text-xs mb-1">💻 Sistema (PWA Permisionario)</p>
                        <p className="whitespace-pre-line text-xs">{step.message}</p>
                      </div>
                    )}
                    {step.role === 'bot' && (
                      <div className="max-w-[80%] bg-white rounded-2xl rounded-tl-sm px-3 py-2 text-sm shadow-sm">
                        <p className="whitespace-pre-line text-slate-800">{step.message}</p>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} ✓✓
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 px-4 py-3 flex gap-2 border-t border-slate-200">
                <button
                  onClick={() => setStepIndex(0)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition"
                >
                  ↻ Reiniciar
                </button>
                {canAdvance && (
                  <button
                    onClick={() => setStepIndex((prev) => prev + 1)}
                    className="px-4 py-2 bg-[#25D366] text-white rounded-xl text-sm hover:bg-[#20BD5A] transition flex-1 shadow-sm"
                  >
                    Siguiente →
                  </button>
                )}
                {isLastStep && (
                  <button
                    onClick={() => setStepIndex(0)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition flex-1 shadow-sm"
                  >
                    ✓ Completado
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-xs font-bold">🏗</span>
                Stack Tecnológico
              </h3>
              <div className="space-y-3">
                {[
                  { icon: 'WA', color: 'bg-green-100 text-green-700', name: 'WhatsApp Business API', desc: '94% penetración en Argentina. Cero fricción.' },
                  { icon: 'JS', color: 'bg-yellow-100 text-yellow-700', name: 'Node.js + TypeScript', desc: 'Tipos seguros. Mejor soporte para APIs de WA y MP.' },
                  { icon: 'PG', color: 'bg-emerald-100 text-emerald-700', name: 'Supabase (PostgreSQL + Realtime)', desc: 'RLS nativo, WebSockets gratis, escalable.' },
                  { icon: 'NX', color: 'bg-blue-100 text-blue-700', name: 'Next.js PWA', desc: 'SSR, instalable, actualizaciones en tiempo real.' },
                  { icon: 'MP', color: 'bg-cyan-100 text-cyan-700', name: 'Mercado Pago SDK', desc: '70%+ adopción. Checkout Pro sin manejo de tarjetas.' },
                ].map((t) => (
                  <div key={t.icon} className="flex items-start gap-3">
                    <span className={`w-8 h-8 ${t.color} rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                      {t.icon}
                    </span>
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="font-bold text-lg mb-4">🔑 Credenciales de prueba</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between bg-white/10 rounded-xl px-4 py-2.5">
                  <span className="text-blue-200">PWA Legajo</span>
                  <span className="font-mono font-bold">P001</span>
                </div>
                <div className="flex justify-between bg-white/10 rounded-xl px-4 py-2.5">
                  <span className="text-blue-200">WhatsApp (test)</span>
                  <span className="font-mono font-bold">5493875555123</span>
                </div>
              </div>
              <p className="text-xs text-blue-200 mt-3 mb-4">Usá estas credenciales para probar el panel del permisionario</p>
              <div className="flex gap-3">
                <a href="/dashboard" className="bg-white text-blue-700 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-blue-50 transition flex-1 text-center">
                  Ir al Dashboard
                </a>
                <a href="/cuenta-corriente" className="bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl text-sm hover:bg-blue-400 border border-blue-400 transition flex-1 text-center">
                  Cuenta Corriente
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
              <div>
                <div className="text-white font-semibold text-sm">SEM Salta Digital</div>
                <div className="text-xs">PunaTech 2026</div>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Propuesta para modernización del SEM — Ordenanza 12.170
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
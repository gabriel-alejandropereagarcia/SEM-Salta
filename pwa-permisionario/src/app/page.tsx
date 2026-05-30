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
      { role: 'bot', message: '✅ *Estacionamiento iniciado*\n🚗 Patente: ABC123D\n📍 Zona: A12\n🕐 Hasta: 15:30\n📱 Pago digital - 20% descuento aplicado\n\nEscribí *FIN* cuando quieras terminar.' },
    ],
  },
  {
    id: 'fin',
    title: 'Finalizar',
    icon: '🏁',
    description: 'El conductor finaliza su sesión y se cobra el tiempo real',
    steps: [
      { role: 'user', message: 'FIN' },
      { role: 'bot', message: '🏁 *Estacionamiento finalizado*\n🚗 Patente: ABC123D\n⏱ Duración: 1h 23min\n💰 Costo: $840\n📄 Saldo restante: $4.160\n\n¡Gracias por usar SEM Digital! 🙏' },
    ],
  },
  {
    id: 'saldo',
    title: 'Consultar saldo',
    icon: '💰',
    description: 'El conductor consulta su saldo disponible',
    steps: [
      { role: 'user', message: 'SALDO' },
      { role: 'bot', message: '💰 *Tu saldo*\nDisponible: $5.000,00\n\n📋 *Sesión activa*\n🚗 ABC123D en zona A12\n🕐 13:30 → 14:30\n📱 Digital (con descuento)\n\nPara recargar escribí: *RECARGAR monto*\nEjemplo: RECARGAR 5000' },
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
    id: 'tarifas',
    title: 'Ver tarifas',
    icon: '📋',
    description: 'El conductor consulta las tarifas vigentes',
    steps: [
      { role: 'user', message: 'TARIFAS' },
      { role: 'bot', message: '📋 *Tarifas SEM Salta*\n\n🚗 *Auto*\n  Tarifa base: $700/h\n  Tarifa digital: $560/h (20% de descuento)\n\n🏍 *Moto*\n  Tarifa base: $300/h\n  Tarifa digital: $240/h (20% de descuento)\n\nFraccionamiento: cada 15 min (desde 2da hora)\nTolerancia: 5 min' },
    ],
  },
  {
    id: 'efectivo',
    title: 'Pago efectivo',
    icon: '💵',
    description: 'El permisionario registra un pago en efectivo desde la PWA',
    steps: [
      { role: 'system', message: 'Permisionario registra pago efectivo desde PWA:\n• Patente: XYZ789\n• Tipo: Auto\n• Se crea sesión con metodo_pago = efectivo\n• Se genera DÉBITO de $140 (20% comisión municipal) en cuenta corriente' },
    ],
  },
];

export default function HomePage() {
  const [activeFlow, setActiveFlow] = useState<string>('estacionar');
  const [stepIndex, setStepIndex] = useState(0);

  const currentFlow = FLOWS.find((f) => f.id === activeFlow)!;
  const visibleSteps = currentFlow.steps.slice(0, stepIndex + 1);
  const canAdvance = stepIndex < currentFlow.steps.length - 1;
  const isLastStep = stepIndex >= currentFlow.steps.length - 1;

  function handleSelectFlow(id: string) {
    setActiveFlow(id);
    setStepIndex(0);
  }

  function handleNext() {
    if (canAdvance) {
      setStepIndex((prev) => prev + 1);
    }
  }

  function handleReset() {
    setStepIndex(0);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-5xl mb-3">🅿️</div>
            <h1 className="text-3xl font-bold mb-2">SEM Salta Digital</h1>
            <p className="text-blue-200 text-lg">
              Sistema de Estacionamiento Medido — Billetera Virtual sobre WhatsApp
            </p>
            <p className="text-blue-300 text-sm mt-2">
              PunaTech 2026 — Propuesta para Ordenanza 12.170
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto -mt-4 px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">20%</div>
            <div className="text-xs text-gray-500">Descuento digital</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-green-600">$560</div>
            <div className="text-xs text-gray-500">Auto/h digital</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">$240</div>
            <div className="text-xs text-gray-500">Moto/h digital</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-xs text-gray-500">Apps que descargar</div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              📱 Simulador WhatsApp
            </h2>

            <div className="flex flex-wrap gap-2 mb-4">
              {FLOWS.map((flow) => (
                <button
                  key={flow.id}
                  onClick={() => handleSelectFlow(flow.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    activeFlow === flow.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {flow.icon} {flow.title}
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-500 mb-4">{currentFlow.description}</p>

            <div className="bg-gray-100 rounded-xl overflow-hidden shadow-lg">
              <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                  SEM
                </div>
                <div>
                  <div className="font-semibold">SEM Salta Digital</div>
                  <div className="text-xs text-green-200">En línea</div>
                </div>
              </div>

              <div className="p-4 space-y-3 min-h-[300px] max-h-[400px] overflow-y-auto">
                {visibleSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className={`flex ${step.role === 'user' ? 'justify-end' : step.role === 'system' ? 'justify-center' : 'justify-start'}`}
                  >
                    {step.role === 'user' && (
                      <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-green-100 text-green-900 rounded-tr-none">
                        <p className="whitespace-pre-line">{step.message}</p>
                        <div className="text-[10px] mt-1 text-green-600">
                          {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    )}
                    {step.role === 'system' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 max-w-full">
                        <p className="font-medium mb-1">💻 Sistema (PWA Permisionario)</p>
                        <p className="whitespace-pre-line text-xs">{step.message}</p>
                      </div>
                    )}
                    {step.role === 'bot' && (
                      <div className="max-w-[80%] bg-white text-gray-800 rounded-lg rounded-tl-none shadow-sm px-3 py-2">
                        <p className="whitespace-pre-line text-sm">{step.message}</p>
                        <div className="text-[10px] mt-1 text-gray-400">
                          {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} ✓✓
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 px-4 py-3 flex gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                >
                  ↻ Reiniciar
                </button>
                {canAdvance && (
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex-1"
                  >
                    Siguiente mensaje →
                  </button>
                )}
                {isLastStep && (
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex-1"
                  >
                    ✓ Flujo completado
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              🏗️ Arquitectura del Sistema
            </h2>

            <div className="bg-white rounded-xl shadow-md p-4 mb-4">
              <h3 className="font-semibold text-gray-700 mb-3">Flujo de Pago Digital</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Conductor envía <code className="bg-gray-100 px-1 rounded">ESTACIONAR A12 ABC123D</code></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Bot valida zona, saldo y crea sesión</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Supabase Realtime notifica al permisionario</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>Conductor envía <code className="bg-gray-100 px-1 rounded">FIN</code></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold">5</span>
                  <span>Sistema calcula costo + genera crédito para permisionario</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4 mb-4">
              <h3 className="font-semibold text-gray-700 mb-3">💰 Modelo de Clearing</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left text-gray-500">Escenario</th>
                    <th className="py-2 text-right text-gray-500">Conductor</th>
                    <th className="py-2 text-right text-gray-500">Permisionario</th>
                    <th className="py-2 text-right text-gray-500">Municipalidad</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Digital Auto</td>
                    <td className="py-2 text-right text-green-600 font-medium">$560/h</td>
                    <td className="py-2 text-right font-medium">$560/h crédito</td>
                    <td className="py-2 text-right text-gray-500">—</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Efectivo Auto</td>
                    <td className="py-2 text-right">$700/h</td>
                    <td className="py-2 text-right font-medium">$560/h neto</td>
                    <td className="py-2 text-right text-red-600 font-medium">$140/h</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Digital Moto</td>
                    <td className="py-2 text-right text-green-600 font-medium">$240/h</td>
                    <td className="py-2 text-right font-medium">$240/h crédito</td>
                    <td className="py-2 text-right text-gray-500">—</td>
                  </tr>
                  <tr>
                    <td className="py-2">Efectivo Moto</td>
                    <td className="py-2 text-right">$300/h</td>
                    <td className="py-2 text-right font-medium">$240/h neto</td>
                    <td className="py-2 text-right text-red-600 font-medium">$60/h</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-xs text-gray-400 mt-2">
                * El permisionario siempre percibe el 80% de la tarifa base. El descuento digital lo absorbe la municipalidad.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-semibold text-gray-700 mb-3">🔧 Stack Tecnológico</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">WA</span>
                  <div>
                    <div className="font-medium">WhatsApp Business API</div>
                    <div className="text-gray-500">94% penetración. Cero fricción.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-yellow-600 font-bold">JS</span>
                  <div>
                    <div className="font-medium">Node.js + TypeScript + Express</div>
                    <div className="text-gray-500">Tipos seguros. Mejor soporte para APIs de WA y MP.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-600 font-bold">PG</span>
                  <div>
                    <div className="font-medium">Supabase (PostgreSQL + Realtime)</div>
                    <div className="text-gray-500">RLS nativo, WebSockets, escalable.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">NX</span>
                  <div>
                    <div className="font-medium">Next.js PWA</div>
                    <div className="text-gray-500">SSR, instalable, tiempo real.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-cyan-600 font-bold">MP</span>
                  <div>
                    <div className="font-medium">Mercado Pago SDK</div>
                    <div className="text-gray-500">70%+ adopción. Checkout Pro.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-md p-6 text-white text-center">
              <h3 className="font-bold text-lg mb-2">🚀 Demo del Permisionario</h3>
              <p className="text-blue-200 text-sm mb-4">
                Accedé a la PWA con datos de prueba
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/dashboard"
                  className="bg-white text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 text-sm"
                >
                  Dashboard Permisionario
                </a>
                <a
                  href="/cuenta-corriente"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-400 border border-blue-400 text-sm"
                >
                  Cuenta Corriente
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 text-gray-400 text-center py-6 text-sm mt-8">
        <p>SEM Salta Digital — PunaTech 2026</p>
        <p className="text-xs mt-1">Propuesta para modernización del Sistema de Estacionamiento Medido — Ordenanza 12.170</p>
      </div>
    </div>
  );
}
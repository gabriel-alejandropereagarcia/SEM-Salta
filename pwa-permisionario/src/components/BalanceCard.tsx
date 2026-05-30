'use client';

interface BalanceCardProps {
  saldo: number;
  zonaCuc: string;
  sesionesActivas: number;
  capacidadMaxima: number;
}

export function BalanceCard({ saldo, zonaCuc, sesionesActivas, capacidadMaxima }: BalanceCardProps) {
  const pct = capacidadMaxima > 0 ? Math.min((sesionesActivas / capacidadMaxima) * 100, 100) : 0;

  return (
    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-5 text-white shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">Cuenta Corriente</p>
          <p className="text-2xl font-extrabold mt-0.5">${saldo.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">Zona</p>
          <p className="text-2xl font-extrabold mt-0.5">{zonaCuc}</p>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-blue-200 text-xs">Ocupación</span>
          <span className="text-sm font-bold">{sesionesActivas}/{capacidadMaxima}</span>
        </div>
        <div className="w-20 h-2 bg-blue-900/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
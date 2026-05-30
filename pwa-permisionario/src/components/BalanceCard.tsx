'use client';

interface BalanceCardProps {
  saldo: number;
  zonaCuc: string;
  sesionesActivas: number;
  capacidadMaxima: number;
}

export function BalanceCard({ saldo, zonaCuc, sesionesActivas, capacidadMaxima }: BalanceCardProps) {
  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-4 text-white shadow-lg">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-primary-200 text-xs">Cuenta Corriente</p>
          <p className="text-2xl font-bold">${saldo.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-primary-200 text-xs">Zona</p>
          <p className="text-lg font-bold">{zonaCuc}</p>
        </div>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-primary-200">
          Ocupacion: {sesionesActivas}/{capacidadMaxima}
        </span>
        <div className="w-24 bg-primary-900 rounded-full h-2 mt-1">
          <div
            className="bg-green-400 h-2 rounded-full"
            style={{
              width: `${Math.min((sesionesActivas / capacidadMaxima) * 100, 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
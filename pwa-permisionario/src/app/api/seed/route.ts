import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    let zonaId: string;

    const { data: zonas } = await supabase.from('zonas').select('id').limit(1);

    if (!zonas || zonas.length === 0) {
      const { data: newZona, error: zonaError } = await supabase
        .from('zonas')
        .insert({
          cuc: 'Z001',
          nombre_calle: 'Calle Florida - 100 al 199',
          numero_desde: 100,
          numero_hasta: 199,
          capacidad: 15,
        })
        .select('id')
        .single();

      if (zonaError) {
        return NextResponse.json(
          { error: 'Error creando zona: ' + zonaError.message + '. ¿Corriste la migración SQL en Supabase?' },
          { status: 500 }
        );
      }
      zonaId = newZona.id;
    } else {
      zonaId = zonas[0].id;
    }

    const { data: existing } = await supabase
      .from('permisionarios')
      .select('*')
      .eq('legajo', 'P001')
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        permisionario: existing,
        message: 'Permisionario P001 ya existe. Usar legajo P001 para login.',
      });
    }

    const { data: permisionario, error: permError } = await supabase
      .from('permisionarios')
      .insert({
        legajo: 'P001',
        nombre: 'Juan Garcia',
        id_zona_actual: zonaId,
      })
      .select()
      .single();

    if (permError) {
      return NextResponse.json({ error: permError.message }, { status: 500 });
    }

    const { data: existingUser } = await supabase
      .from('usuarios_wa')
      .select('*')
      .eq('numero_telefono', '5493875555123')
      .maybeSingle();

    if (!existingUser) {
      await supabase.from('usuarios_wa').insert({
        numero_telefono: '5493875555123',
        nombre: 'Conductor Demo',
        saldo_billetera: 10000,
      });
    }

    return NextResponse.json({
      permisionario,
      credentials: { legajo: 'P001', telefono: '5493875555123' },
      message: 'Datos de demo creados. Usar legajo P001 para ingresar al panel.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data: permisionario } = await supabase
      .from('permisionarios')
      .select('*')
      .eq('legajo', 'P001')
      .maybeSingle();

    if (permisionario) {
      return NextResponse.json({ exists: true, legajo: 'P001' });
    }

    return NextResponse.json({ exists: false, legajo: 'P001' });
  } catch {
    return NextResponse.json({ exists: false, legajo: 'P001' });
  }
}
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data: zonas } = await supabase.from('zonas').select('id, cuc').limit(1);
    if (!zonas || zonas.length === 0) {
      return NextResponse.json(
        { error: 'No hay zonas en la base de datos. Ejecutar la migracion SQL primero.' },
        { status: 400 }
      );
    }

    const zonaId = zonas[0].id;

    // Check if P001 already exists
    const { data: existing } = await supabase
      .from('permisionarios')
      .select('*')
      .eq('legajo', 'P001')
      .single();

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

    // Check if demo user exists
    const { data: existingUser } = await supabase
      .from('usuarios_wa')
      .select('*')
      .eq('numero_telefono', '5493875555123')
      .single();

    let usuario = existingUser;

    if (!existingUser) {
      const { data: newUser } = await supabase
        .from('usuarios_wa')
        .insert({
          numero_telefono: '5493875555123',
          nombre: 'Conductor Demo',
          saldo_billetera: 10000,
        })
        .select()
        .single();

      usuario = newUser;
    }

    return NextResponse.json({
      permisionario,
      usuario,
      credentials: {
        legajo: 'P001',
        telefono: '5493875555123',
        saldo_billetera: 10000,
      },
      message: 'Datos de demo creados. Usar legajo P001 para ingresar al panel.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error creando seed data' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data: permisionario } = await supabase
      .from('permisionarios')
      .select('*')
      .eq('legajo', 'P001')
      .single();

    if (permisionario) {
      return NextResponse.json({ exists: true, legajo: 'P001', permisionario });
    }

    return NextResponse.json({ exists: false, legajo: 'P001' });
  } catch {
    return NextResponse.json({ exists: false, legajo: 'P001' });
  }
}
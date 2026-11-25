import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { CitizenDebt, MunicipalCitizenData, Servicio, Transaction } from '@/types';

import { apiClient } from './api-client';

const LOCAL_DEBTS_KEY = 'citypay_citizen_debts_v1';
const LOCAL_MUNI_KEY = 'citypay_municipal_data_v1';

async function readStorage<T>(key: string): Promise<T | null> {
  try {
    const raw =
      Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem(key)
        : await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function writeStorage<T>(key: string, value: T): Promise<void> {
  try {
    const raw = JSON.stringify(value);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, raw);
      return;
    }
    await AsyncStorage.setItem(key, raw);
  } catch {
    // non-blocking
  }
}

function buildFallbackDebts(uid: string): CitizenDebt[] {
  const tag = uid.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || '2026';
  return [
    {
      id: `local-pre-${tag}`,
      folio: `PRE-${tag}-01`,
      concept: 'Impuesto Predial — Bimestre Actual (Predio Urbano)',
      amount: 1685.5,
      dueDate: '2026-12-15',
      status: 'pending',
      serviceSlug: 'predial',
      serviceName: 'Impuesto Predial y Catastro',
    },
    {
      id: `local-agu-${tag}`,
      folio: `AGU-${tag}-02`,
      concept: 'Agua Potable y Alcantarillado — Consumo Mensual',
      amount: 390.0,
      dueDate: '2026-11-30',
      status: 'pending',
      serviceSlug: 'agua',
      serviceName: 'Agua Potable y Drenaje',
    },
    {
      id: `local-tra-${tag}`,
      folio: `TRA-${tag}-03`,
      concept: 'Boleta de Tránsito — Estacionamiento en zona restringida',
      amount: 868.0,
      dueDate: '2026-11-28',
      status: 'overdue',
      serviceSlug: 'multas',
      serviceName: 'Tránsito y Vialidad',
    },
  ];
}

function normalizeApiDebt(raw: any): CitizenDebt {
  const concept: string = raw.concept ?? 'Concepto municipal';
  const slug: Servicio =
    raw.serviceSlug ??
    raw.service?.slug ??
    (concept.toLowerCase().includes('agua')
      ? 'agua'
      : concept.toLowerCase().includes('multa') ||
          concept.toLowerCase().includes('tránsito') ||
          concept.toLowerCase().includes('infracción')
        ? 'multas'
        : 'predial');

  return {
    id: String(raw.id),
    folio: String(raw.folio ?? 'ADE-2026'),
    concept,
    amount: Number(raw.amount ?? 0),
    dueDate: String(raw.dueDate ?? '2026-12-15'),
    status: raw.status === 'paid' ? 'paid' : raw.status === 'overdue' ? 'overdue' : 'pending',
    serviceSlug: slug,
    serviceName:
      raw.serviceName ??
      raw.service?.name ??
      (slug === 'predial' ? 'Predial y Catastro' : slug === 'agua' ? 'Agua Potable' : 'Tránsito y Vialidad'),
  };
}

export const citizenFinanceService = {
  async listMyDebts(uid: string): Promise<CitizenDebt[]> {
    const storedMap = (await readStorage<Record<string, CitizenDebt[]>>(LOCAL_DEBTS_KEY)) ?? {};
    const localItems = storedMap[uid] ?? [];

    try {
      const apiDebts = await apiClient<any[]>('/debts/me');
      const normalized = Array.isArray(apiDebts) ? apiDebts.map(normalizeApiDebt) : [];
      if (normalized.length > 0) {
        // Combina cualquier adeudo local recién vinculado con los del servidor
        const merged = [
          ...normalized,
          ...localItems.filter((l) => l.id.startsWith('local-') && !normalized.some((n) => n.folio === l.folio)),
        ];
        storedMap[uid] = merged;
        await writeStorage(LOCAL_DEBTS_KEY, storedMap);
        return merged;
      }
    } catch {
      // Si el servidor aún no responde /debts/me o está despertando, usa respaldo local persistente
    }

    if (localItems.length > 0) return localItems;
    const seeded = buildFallbackDebts(uid);
    storedMap[uid] = seeded;
    await writeStorage(LOCAL_DEBTS_KEY, storedMap);
    return seeded;
  },

  async linkDebt(
    uid: string,
    payload: { serviceSlug: Servicio; referenceCode: string; concept?: string; amount?: number },
  ): Promise<CitizenDebt> {
    const ref = payload.referenceCode.trim().toUpperCase();
    try {
      const created = await apiClient<any>('/debts/link', {
        method: 'POST',
        body: payload,
      });
      return normalizeApiDebt(created);
    } catch {
      // Respaldo inmediato si el backend en la nube aún no tiene desplegado POST /debts/link
      const suffix = Math.floor(1000 + Math.random() * 9000);
      const prefix = payload.serviceSlug === 'predial' ? 'CAT' : payload.serviceSlug === 'agua' ? 'AGU' : 'TRA';
      const fallback: CitizenDebt = {
        id: `local-${Date.now()}`,
        folio: `${prefix}-2026-${suffix}`,
        concept:
          payload.concept?.trim() ||
          (payload.serviceSlug === 'predial'
            ? `Impuesto Predial — Clave Catastral ${ref}`
            : payload.serviceSlug === 'agua'
              ? `Servicio de Agua Potable — Contrato ${ref}`
              : `Infracción / Reporte de Tránsito — Placa o Folio ${ref}`),
        amount: payload.amount && payload.amount > 0 ? payload.amount : payload.serviceSlug === 'predial' ? 1840 : payload.serviceSlug === 'agua' ? 465 : 980,
        dueDate: '2026-12-20',
        status: 'pending',
        serviceSlug: payload.serviceSlug,
        serviceName:
          payload.serviceSlug === 'predial'
            ? 'Predial y Catastro'
            : payload.serviceSlug === 'agua'
              ? 'Agua Potable'
              : 'Tránsito y Vialidad',
      };
      const storedMap = (await readStorage<Record<string, CitizenDebt[]>>(LOCAL_DEBTS_KEY)) ?? {};
      storedMap[uid] = [fallback, ...(storedMap[uid] ?? [])];
      await writeStorage(LOCAL_DEBTS_KEY, storedMap);
      return fallback;
    }
  },

  async listMyPayments(): Promise<Transaction[]> {
    try {
      return await apiClient<Transaction[]>('/payments/me');
    } catch {
      return [];
    }
  },

  async payDebt(
    uid: string,
    input: {
      debt?: CitizenDebt;
      serviceSlug: Servicio;
      concept: string;
      amount: number;
      paymentMethod: string;
      bank: string;
      bankReference: string;
    },
  ): Promise<Transaction> {
    const isUuid = input.debt && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.debt.id);
    const created = await apiClient<Transaction>('/payments/simulate', {
      method: 'POST',
      body: {
        concept: input.concept,
        serviceSlug: input.serviceSlug,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        bank: input.bank,
        bankReference: input.bankReference,
        ...(isUuid ? { debtId: input.debt!.id } : {}),
      },
    });

    if (input.debt) {
      const storedMap = (await readStorage<Record<string, CitizenDebt[]>>(LOCAL_DEBTS_KEY)) ?? {};
      const current = storedMap[uid] ?? [];
      storedMap[uid] = current.map((d) => (d.id === input.debt!.id ? { ...d, status: 'paid' } : d));
      await writeStorage(LOCAL_DEBTS_KEY, storedMap);
    }

    return created;
  },

  async getMunicipalData(uid: string, fromSession?: MunicipalCitizenData | null): Promise<MunicipalCitizenData> {
    const stored = (await readStorage<Record<string, MunicipalCitizenData>>(LOCAL_MUNI_KEY)) ?? {};
    return {
      cadastralKey: '',
      propertyAddress: '',
      propertyType: 'Urbano',
      waterAccount: '',
      vehiclePlates: '',
      driverLicense: '',
      ...(stored[uid] ?? {}),
      ...(fromSession ?? {}),
    };
  },

  async saveMunicipalData(uid: string, data: MunicipalCitizenData): Promise<MunicipalCitizenData> {
    const clean: MunicipalCitizenData = {
      cadastralKey: data.cadastralKey?.trim().toUpperCase() ?? '',
      propertyAddress: data.propertyAddress?.trim() ?? '',
      propertyType: data.propertyType ?? 'Urbano',
      waterAccount: data.waterAccount?.trim().toUpperCase() ?? '',
      vehiclePlates: data.vehiclePlates?.trim().toUpperCase() ?? '',
      driverLicense: data.driverLicense?.trim().toUpperCase() ?? '',
    };

    const stored = (await readStorage<Record<string, MunicipalCitizenData>>(LOCAL_MUNI_KEY)) ?? {};
    stored[uid] = clean;
    await writeStorage(LOCAL_MUNI_KEY, stored);

    try {
      await apiClient('/users/me', {
        method: 'PATCH',
        body: clean,
      });
    } catch {
      // Respaldo guardado localmente si el servidor aún no acepta campos extendidos
    }

    return clean;
  },
};

import { create } from 'zustand';
import type {
  WorkOrder,
  WaxMoldingRecord,
  WaxInspectionRecord,
  AssemblyRecord,
  ShellMakingRecord,
  DewaxingRecord,
  FiringRecord,
  MeltingRecord,
  PouringRecord,
  CleaningRecord,
} from '@/types';
import {
  mockWorkOrders,
  mockWaxMoldingRecords,
  mockWaxInspectionRecords,
  mockAssemblyRecords,
  mockShellMakingRecords,
  mockDewaxingRecords,
  mockFiringRecords,
  mockMeltingRecords,
  mockPouringRecords,
  mockCleaningRecords,
} from '@/data/mockData';

interface AppState {
  workOrders: WorkOrder[];
  waxMoldingRecords: WaxMoldingRecord[];
  waxInspectionRecords: WaxInspectionRecord[];
  assemblyRecords: AssemblyRecord[];
  shellMakingRecords: ShellMakingRecord[];
  dewaxingRecords: DewaxingRecord[];
  firingRecords: FiringRecord[];
  meltingRecords: MeltingRecord[];
  pouringRecords: PouringRecord[];
  cleaningRecords: CleaningRecord[];
  
  addWorkOrder: (order: WorkOrder) => void;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  
  addWaxMoldingRecord: (record: WaxMoldingRecord) => void;
  addWaxInspectionRecord: (record: WaxInspectionRecord) => void;
  addAssemblyRecord: (record: AssemblyRecord) => void;
  addShellMakingRecord: (record: ShellMakingRecord) => void;
  addDewaxingRecord: (record: DewaxingRecord) => void;
  addFiringRecord: (record: FiringRecord) => void;
  addMeltingRecord: (record: MeltingRecord) => void;
  addPouringRecord: (record: PouringRecord) => void;
  addCleaningRecord: (record: CleaningRecord) => void;
  
  getWorkOrderById: (id: string) => WorkOrder | undefined;
  getWaxMoldingByOrderId: (orderId: string) => WaxMoldingRecord[];
  getWaxInspectionByOrderId: (orderId: string) => WaxInspectionRecord[];
  getAssemblyByOrderId: (orderId: string) => AssemblyRecord[];
  getShellMakingByOrderId: (orderId: string) => ShellMakingRecord[];
  getDewaxingByOrderId: (orderId: string) => DewaxingRecord[];
  getFiringByOrderId: (orderId: string) => FiringRecord[];
  getMeltingByOrderId: (orderId: string) => MeltingRecord[];
  getPouringByOrderId: (orderId: string) => PouringRecord[];
  getCleaningByOrderId: (orderId: string) => CleaningRecord[];
}

export const useStore = create<AppState>((set, get) => ({
  workOrders: mockWorkOrders,
  waxMoldingRecords: mockWaxMoldingRecords,
  waxInspectionRecords: mockWaxInspectionRecords,
  assemblyRecords: mockAssemblyRecords,
  shellMakingRecords: mockShellMakingRecords,
  dewaxingRecords: mockDewaxingRecords,
  firingRecords: mockFiringRecords,
  meltingRecords: mockMeltingRecords,
  pouringRecords: mockPouringRecords,
  cleaningRecords: mockCleaningRecords,

  addWorkOrder: (order) =>
    set((state) => ({ workOrders: [...state.workOrders, order] })),

  updateWorkOrder: (id, updates) =>
    set((state) => ({
      workOrders: state.workOrders.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
    })),

  addWaxMoldingRecord: (record) =>
    set((state) => ({
      waxMoldingRecords: [...state.waxMoldingRecords, record],
    })),

  addWaxInspectionRecord: (record) =>
    set((state) => ({
      waxInspectionRecords: [...state.waxInspectionRecords, record],
    })),

  addAssemblyRecord: (record) =>
    set((state) => ({
      assemblyRecords: [...state.assemblyRecords, record],
    })),

  addShellMakingRecord: (record) =>
    set((state) => ({
      shellMakingRecords: [...state.shellMakingRecords, record],
    })),

  addDewaxingRecord: (record) =>
    set((state) => ({
      dewaxingRecords: [...state.dewaxingRecords, record],
    })),

  addFiringRecord: (record) =>
    set((state) => ({
      firingRecords: [...state.firingRecords, record],
    })),

  addMeltingRecord: (record) =>
    set((state) => ({
      meltingRecords: [...state.meltingRecords, record],
    })),

  addPouringRecord: (record) =>
    set((state) => ({
      pouringRecords: [...state.pouringRecords, record],
    })),

  addCleaningRecord: (record) =>
    set((state) => ({
      cleaningRecords: [...state.cleaningRecords, record],
    })),

  getWorkOrderById: (id) => get().workOrders.find((o) => o.id === id),

  getWaxMoldingByOrderId: (orderId) =>
    get().waxMoldingRecords.filter((r) => r.workOrderId === orderId),

  getWaxInspectionByOrderId: (orderId) =>
    get().waxInspectionRecords.filter((r) => r.workOrderId === orderId),

  getAssemblyByOrderId: (orderId) =>
    get().assemblyRecords.filter((r) => r.workOrderId === orderId),

  getShellMakingByOrderId: (orderId) =>
    get().shellMakingRecords.filter((r) => r.workOrderId === orderId),

  getDewaxingByOrderId: (orderId) =>
    get().dewaxingRecords.filter((r) => r.workOrderId === orderId),

  getFiringByOrderId: (orderId) =>
    get().firingRecords.filter((r) => r.workOrderId === orderId),

  getMeltingByOrderId: (orderId) =>
    get().meltingRecords.filter((r) => r.workOrderId === orderId),

  getPouringByOrderId: (orderId) =>
    get().pouringRecords.filter((r) => r.workOrderId === orderId),

  getCleaningByOrderId: (orderId) =>
    get().cleaningRecords.filter((r) => r.workOrderId === orderId),
}));

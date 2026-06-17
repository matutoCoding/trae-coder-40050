export type WorkOrderStatus = 
  | 'pending' 
  | 'wax_molding' 
  | 'wax_inspection' 
  | 'assembly' 
  | 'shell_making' 
  | 'dewaxing' 
  | 'firing' 
  | 'melting' 
  | 'pouring' 
  | 'cleaning' 
  | 'completed';

export interface WorkOrder {
  id: string;
  orderNo: string;
  productName: string;
  productCode: string;
  quantity: number;
  status: WorkOrderStatus;
  currentProcess: string;
  createdAt: string;
  estimatedDelivery: string;
  customer?: string;
}

export interface WaxMoldingRecord {
  id: string;
  workOrderId: string;
  moldNo: string;
  waxMaterial: string;
  waxTemperature: number;
  moldTemperature: number;
  pressPressure: number;
  holdTime: number;
  cycleTime: number;
  operator: string;
  startTime: string;
  endTime: string;
  outputCount: number;
  qualifiedCount: number;
  remark?: string;
}

export interface DimensionItem {
  name: string;
  standard: number;
  tolerance: number;
  actual: number;
  deviation: number;
  isQualified: boolean;
}

export interface WaxInspectionRecord {
  id: string;
  workOrderId: string;
  waxMoldingId: string;
  sampleNo: string;
  dimensions: DimensionItem[];
  surfaceQuality: string;
  isQualified: boolean;
  inspector: string;
  inspectTime: string;
  remark?: string;
}

export interface AssemblyRecord {
  id: string;
  workOrderId: string;
  assemblyNo: string;
  waxCount: number;
  weldingMethod: string;
  weldingTemperature: number;
  welder: string;
  weldingTime: string;
  inspectionResult: boolean;
  inspector: string;
  remark?: string;
}

export interface ShellMakingRecord {
  id: string;
  workOrderId: string;
  assemblyId: string;
  layerNumber: number;
  slurryType: string;
  viscosity: number;
  sandType: string;
  sandMesh: string;
  dryTime: number;
  dryTemperature: number;
  dryHumidity: number;
  operator: string;
  operateTime: string;
}

export interface DewaxingRecord {
  id: string;
  workOrderId: string;
  kettleNo: string;
  pressure: number;
  temperature: number;
  duration: number;
  waxRecovery: number;
  operator: string;
  startTime: string;
  endTime: string;
  result: string;
  remark?: string;
}

export interface CurvePoint {
  time: number;
  temperature: number;
}

export interface FiringRecord {
  id: string;
  workOrderId: string;
  furnaceNo: string;
  maxTemperature: number;
  holdTime: number;
  totalTime: number;
  curveData: CurvePoint[];
  operator: string;
  startTime: string;
  endTime: string;
  remark?: string;
}

export interface MaterialItem {
  name: string;
  weight: number;
  percentage: number;
  standard?: string;
}

export interface CompositionItem {
  element: string;
  content: number;
  standard: string;
  isQualified: boolean;
}

export interface MeltingRecord {
  id: string;
  workOrderId: string;
  furnaceNo: string;
  alloyGrade: string;
  totalWeight: number;
  materials: MaterialItem[];
  meltingTemperature: number;
  meltingTime: number;
  degassingTime: number;
  operator: string;
  startTime: string;
  compositionTest?: CompositionItem[];
}

export interface TemperatureRecord {
  timePoint: string;
  temperature: number;
}

export interface PouringRecord {
  id: string;
  workOrderId: string;
  meltingId: string;
  shellCount: number;
  shellTemperature: number;
  pouringTemperature: number;
  temperatureRecords: TemperatureRecord[];
  pouringSpeed: string;
  ladleNo: string;
  steelWeight: number;
  pouredWeight: number;
  holdingTemperature: number;
  holdingTime: number;
  operator: string;
  pourTime: string;
  pouredCount: number;
  qualifiedCount: number;
  remark?: string;
}

export type CleaningType = 'cutting' | 'grinding' | 'polishing';

export interface CleaningRecord {
  id: string;
  workOrderId: string;
  processType: CleaningType;
  equipment: string;
  equipmentNo: string;
  operator: string;
  startTime: string;
  endTime: string;
  quantity: number;
  qualifiedCount: number;
  qualityResult: string;
  unqualifiedReason?: string;
  remark?: string;
}

export interface StatCardData {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon: string;
  color: string;
}

export const statusLabels: Record<WorkOrderStatus, string> = {
  pending: '待开始',
  wax_molding: '蜡模压制',
  wax_inspection: '蜡件检验',
  assembly: '模组焊接',
  shell_making: '制壳挂砂',
  dewaxing: '脱蜡',
  firing: '焙烧',
  melting: '熔炼',
  pouring: '浇注',
  cleaning: '清理打磨',
  completed: '已完成',
};

export const statusColors: Record<WorkOrderStatus, string> = {
  pending: 'bg-gray-100 text-gray-800',
  wax_molding: 'bg-amber-100 text-amber-800',
  wax_inspection: 'bg-orange-100 text-orange-800',
  assembly: 'bg-yellow-100 text-yellow-800',
  shell_making: 'bg-blue-100 text-blue-800',
  dewaxing: 'bg-indigo-100 text-indigo-800',
  firing: 'bg-red-100 text-red-800',
  melting: 'bg-orange-100 text-orange-800',
  pouring: 'bg-rose-100 text-rose-800',
  cleaning: 'bg-teal-100 text-teal-800',
  completed: 'bg-green-100 text-green-800',
};

export interface StudentItem {
  id: number;
  full_name: string;
  gender?: string;
  grade?: string;
}

export interface GroupData {
  id: number;
  class_id: number;
  group_name: string;
  members: { student_id: number; full_name: string }[];
}

export interface TrustedSwapStudent {
  id: number;
  class_id: number;
  student_id: number;
  student_name: string;
  gender?: string;
}

export interface AddMemberModalTarget {
  id: number;
  name: string;
  type: 'friend' | 'conflict' | 'trusted';
  currentMemberIds: Set<number>;
}

import { directoryCandidates } from './taxOfficeLookup';

export interface SupportOfficeEntry {
  id: string;
  name: string;
  unit: string;
  email: string | null;
}

export interface SupportDirectoryResult {
  status: 'matched' | 'clarify' | 'not_found';
  message: string;
  offices: SupportOfficeEntry[];
}

export function supportDirectory(answers: string[]): SupportDirectoryResult {
  const candidates = directoryCandidates(answers);
  const offices: SupportOfficeEntry[] = candidates.slice(0, 6).map((c: any) => ({
    id: String(c.id || ''),
    name: String(c.name || ''),
    unit: String(c.unit || ''),
    email: typeof c.email === 'string' ? c.email : null,
  }));
  if (offices.length === 1) {
    return {
      status: 'matched',
      message: 'Đã tìm thấy đơn vị thuế phù hợp theo địa bàn bạn cung cấp.',
      offices,
    };
  }
  if (offices.length > 1) {
    return {
      status: 'clarify',
      message: 'Có nhiều đơn vị thuế/đầu mối liên hệ tại địa bàn. Bạn vui lòng cho biết quận/huyện hoặc cơ sở quản lý trực tiếp.',
      offices,
    };
  }
  return {
    status: 'not_found',
    message: 'Chưa xác định được cơ quan thuế quản lý trực tiếp từ thông tin hiện có.',
    offices: [],
  };
}

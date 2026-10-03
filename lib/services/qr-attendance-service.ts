import { apiClient } from '../api-client';

export interface QrCheckInPayload {
  studentId: number;
  qrCode: string;
  checkInTime?: string;
  tenantId?: number;
}

export interface QrCheckInResponse {
  success: boolean;
  message: string;
  data?: {
    attendanceId: number;
    studentId: number;
    studentName: string;
    courseId: number;
    courseName: string;
    checkInTime: string;
    status: string;
    message: string;
  };
}

export async function submitQrCheckIn(payload: QrCheckInPayload): Promise<QrCheckInResponse> {
  try {
    const res = await apiClient.post('/api/Attendances/qr-checkin', {
      studentId: payload.studentId,
      qrCode: payload.qrCode,
      tenantId: payload.tenantId,
    });
    const data = res.data?.data || res.data;
    const message = res.data?.message || data?.message || 'Yoklama başarıyla kaydedildi.';
    return {
      success: true,
      message,
      data,
    };
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      'Yoklama işlemi gerçekleştirilemedi.';
    return {
      success: false,
      message: typeof errorMsg === 'string' ? errorMsg : 'Ders saati aralığı dışında veya geçersiz QR kod.',
    };
  }
}

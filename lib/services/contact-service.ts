import { apiClient } from '../api-client';

export interface SendContactMessagePayload {
  fullName: string;
  userEmail: string;
  subject: string;
  message: string;
}

export async function sendContactMessage(
  payload: SendContactMessagePayload
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await apiClient.post<string>(
      '/api/Contact/send',
      {
        FullName: payload.fullName.trim(),
        UserEmail: payload.userEmail.trim(),
        Subject: payload.subject.trim(),
        Message: payload.message.trim(),
      },
      { timeout: 30000 }
    );

    const msg = typeof res.data === 'string' ? res.data : 'Mesajınız başarıyla iletildi.';
    return {
      success: true,
      message: msg || 'Mesajınız başarıyla iletildi.',
    };
  } catch (err: any) {
    const serverMsg =
      err.response?.data?.message ||
      err.response?.data?.Message ||
      (typeof err.response?.data === 'string' ? err.response?.data : null) ||
      err.message ||
      'Mesaj iletilirken bir hata oluştu.';

    return {
      success: false,
      message: serverMsg,
    };
  }
}

export interface SendInstitutionRegistrationPayload {
  fullName: string;
  phone: string;
  email: string;
  institutionName: string;
  city?: string;
  institutionType?: string;
  studentCount?: string;
  message?: string;
}

export async function sendInstitutionRegistration(
  payload: SendInstitutionRegistrationPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await apiClient.post<string>(
      '/api/Contact/institution-registration',
      {
        FullName: payload.fullName.trim(),
        Phone: payload.phone.trim(),
        Email: payload.email.trim(),
        InstitutionName: payload.institutionName.trim(),
        City: payload.city?.trim() || '',
        InstitutionType: payload.institutionType || '',
        StudentCount: payload.studentCount || '',
        Message: payload.message?.trim() || '',
        Source: 'Kursum Mobil Uygulaması',
      },
      { timeout: 30000 }
    );

    const msg = typeof res.data === 'string' ? res.data : 'Başvurunuz başarıyla iletildi.';
    return {
      success: true,
      message: msg || 'Başvurunuz başarıyla iletildi.',
    };
  } catch (err: any) {
    const serverMsg =
      err.response?.data?.message ||
      err.response?.data?.Message ||
      (typeof err.response?.data === 'string' ? err.response?.data : null) ||
      err.message ||
      'Başvuru iletilirken bir hata oluştu.';

    return {
      success: false,
      message: serverMsg,
    };
  }
}


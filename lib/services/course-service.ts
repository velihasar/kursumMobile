import { apiClient } from '../api-client';

export interface Course {
  id: number;
  name: string;
  code?: string;
  description?: string;
  color?: string;
  isActive: boolean;
}

export interface Branch {
  id: number;
  name: string;
  courseId: number;
  courseName?: string;
  teacherName?: string;
  capacity?: number;
  classroom?: string;
  schedule?: string;
}

export async function fetchCourses(): Promise<Course[]> {
  try {
    const res = await apiClient.get('/api/v1/courses/getall');
    return res.data?.data || res.data || [];
  } catch {
    return [
      { id: 1, name: 'Matematik - YKS', code: 'MAT-101', description: 'Temel & İleri Matematik', isActive: true },
      { id: 2, name: 'Fizik', code: 'FIZ-201', description: 'Mekanik ve Elektrik', isActive: true },
      { id: 3, name: 'Kimya', code: 'KIM-301', description: 'Organik & Genel Kimya', isActive: true },
      { id: 4, name: 'Biyoloji', code: 'BIY-401', description: 'Hücre ve Sistemler', isActive: true },
      { id: 5, name: 'Türkçe & Edebiyat', code: 'EDB-501', description: 'Paragraf & Dil Bilgisi', isActive: true },
    ];
  }
}

export async function fetchBranches(): Promise<Branch[]> {
  try {
    const res = await apiClient.get('/api/v1/branches/getall');
    return res.data?.data || res.data || [];
  } catch {
    return [
      { id: 101, name: '12-A Sayısal', courseId: 1, courseName: 'Matematik', teacherName: 'Ahmet Hoca', classroom: 'Derslik 3', schedule: 'Pzt, Çar 09:00 - 11:30' },
      { id: 102, name: '12-B Sayısal', courseId: 2, courseName: 'Fizik', teacherName: 'Zeynep Hoca', classroom: 'Lab 1', schedule: 'Salı, Per 13:00 - 15:30' },
      { id: 103, name: '11-A Eşit Ağırlık', courseId: 5, courseName: 'Türkçe', teacherName: 'Mehmet Hoca', classroom: 'Derslik 1', schedule: 'Cuma 10:00 - 12:30' },
    ];
  }
}

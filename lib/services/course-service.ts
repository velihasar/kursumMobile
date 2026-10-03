import { apiClient } from '../api-client';

export interface Course {
  id: number;
  name: string;
  code?: string;
  description?: string;
  daysOfWeek?: string;
  startTime?: string;
  endTime?: string;
  teacherName?: string;
  branchName?: string;
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

export async function fetchCourses(studentId?: string | number): Promise<Course[]> {
  try {
    if (studentId) {
      const enrollRes = await apiClient.get(`/api/CourseEnrollments/getall?studentId=${studentId}`);
      const enrollments = enrollRes.data?.data || enrollRes.data;
      if (Array.isArray(enrollments)) {
        return enrollments
          .filter((e: any) => (!e.studentId || e.studentId == studentId) && (e.status === 1 || e.isActive !== false))
          .map((e: any) => ({
            id: e.courseId || e.id,
            name: e.courseName || e.name || 'Ders',
            code: e.courseCode || 'KRS',
            description: e.description || '',
            daysOfWeek: e.daysOfWeek || undefined,
            startTime: e.startTime || undefined,
            endTime: e.endTime || undefined,
            teacherName: e.teacherName || undefined,
            branchName: e.branchName || undefined,
            isActive: true,
          }));
      }
      return [];
    }

    const res = await apiClient.get('/api/Courses/getall');
    const allCourses = res.data?.data || res.data || [];
    if (Array.isArray(allCourses)) {
      return allCourses.map((c: any) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        description: c.description,
        daysOfWeek: c.daysOfWeek,
        startTime: c.startTime,
        endTime: c.endTime,
        teacherName: c.teacherName,
        branchName: c.branchName,
        isActive: c.isActive !== false,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export async function fetchBranches(tenantId?: string | number): Promise<Branch[]> {
  try {
    const res = await apiClient.get('/api/Branches/getall');
    return res.data?.data || res.data || [];
  } catch {
    return [
      { id: 101, name: '12-A Sayısal', courseId: 1, courseName: 'Matematik', teacherName: 'Ahmet Hoca', classroom: 'Derslik 3', schedule: 'Pzt, Çar 09:00 - 11:30' },
      { id: 102, name: '12-B Sayısal', courseId: 2, courseName: 'Fizik', teacherName: 'Zeynep Hoca', classroom: 'Lab 1', schedule: 'Salı, Per 13:00 - 15:30' },
      { id: 103, name: '11-A Eşit Ağırlık', courseId: 5, courseName: 'Türkçe', teacherName: 'Mehmet Hoca', classroom: 'Derslik 1', schedule: 'Cuma 10:00 - 12:30' },
    ];
  }
}
